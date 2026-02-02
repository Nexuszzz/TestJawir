// Voice Controller Hook
// Orchestrates the complete voice interaction flow:
// 1. PTT Recording (Space key)
// 2. Deepgram STT
// 3. Gemini Processing
// 4. Tool Execution
// 5. TTS Response

import { useCallback, useEffect, useRef } from 'react'
import { useVoiceStore } from '@stores/voiceStore'
import { useChatStore } from '@stores/chatStore'
import { useSettingsStore } from '@stores/settingsStore'
import { useVoiceRecording } from './useVoiceRecording'
import { transcribeAudio } from '@services/deepgram'
import { initGemini, chatWithGemini, sendFunctionResult, type ChatMessage } from '@services/gemini'
import { speak, stop as stopTTS } from '@services/tts'
import { routeToolCall } from '@tools/router'
import { executeAgenticTask, needsAgenticExecution, type AgenticStep } from '@services/agentic-executor'
import { startContext, addStep, completeContext } from '@services/agentic-memory'

export function useVoiceController() {
  const {
    status,
    setStatus,
    setTranscript,
    setError
  } = useVoiceStore()

  const { messages, addMessage } = useChatStore()
  const { geminiApiKey, deepgramApiKey, voiceEnabled } = useSettingsStore()

  const processingRef = useRef(false)
  const geminiInitializedRef = useRef(false)

  // Initialize Gemini when API key is available
  useEffect(() => {
    if (geminiApiKey && !geminiInitializedRef.current) {
      initGemini(geminiApiKey)
      geminiInitializedRef.current = true
    }
  }, [geminiApiKey])

  // Handle recording completion
  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    if (processingRef.current) return
    processingRef.current = true

    try {
      // Step 1: Transcribe with Deepgram
      setStatus('transcribing')

      if (!deepgramApiKey) {
        throw new Error('Deepgram API key not configured')
      }

      const result = await transcribeAudio(audioBlob, deepgramApiKey)
      const transcriptText = result.transcript

      if (!transcriptText || transcriptText.trim() === '') {
        setStatus('standby')
        setError('Tidak ada suara terdeteksi')
        processingRef.current = false
        return
      }

      setTranscript(transcriptText)

      // Add user message to chat
      addMessage({
        type: 'user',
        role: 'user',
        content: transcriptText,
        isVoice: true,
      })

      // Step 2: Process with Gemini
      setStatus('processing')

      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured')
      }

      // Prepare chat history (last 10 messages)
      const chatHistory: ChatMessage[] = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }))

      const response = await chatWithGemini(transcriptText, chatHistory)

      let assistantResponse: string
      let toolCalls: Array<{ name: string; status: 'pending' | 'success' | 'error'; result?: unknown }> | undefined

      // Check if this is a complex task that needs agentic execution
      const isComplexTask = needsAgenticExecution(transcriptText)

      if (isComplexTask) {
        // AGENTIC MODE: Multi-step execution with ReAct loop
        console.log('[Voice] Using Agentic Mode for complex task')

        // Start memory context
        startContext(transcriptText, { source: 'voice' })

        // Show thinking indicator
        addMessage({
          type: 'assistant',
          role: 'model',
          content: '🤖 **Mode Agentic Aktif**\n\n_Menganalisis tugas kompleks..._',
        })

        // Execute with agentic loop
        const agenticResult = await executeAgenticTask(transcriptText, chatHistory, {
          maxIterations: 5,
          enableLogging: true,
          onStepComplete: (step: AgenticStep) => {
            // Update memory
            addStep(step)

            // Show step in chat
            const status = step.success ? '✅' : '❌'
            addMessage({
              type: 'assistant',
              role: 'model',
              content: `**Step ${step.stepNumber}** ${status}\n💭 ${step.thought}\n🔧 \`${step.action}\`\n📊 ${step.observation.substring(0, 200)}${step.observation.length > 200 ? '...' : ''}`,
            })
          },
        })

        // Complete memory context
        completeContext(agenticResult.success, agenticResult.finalAnswer)

        // Collect tool calls from steps
        toolCalls = agenticResult.steps.map(step => ({
          name: step.action,
          status: step.success ? 'success' as const : 'error' as const,
          result: step.observation,
        }))

        assistantResponse = agenticResult.finalAnswer ||
          `Tugas selesai dalam ${agenticResult.totalIterations} langkah (${agenticResult.executionTime}ms)`

      } else if (response.type === 'function_call' && response.functionCall) {
        // STANDARD MODE: Single function call
        const { name, args } = response.functionCall

        const toolResult = await routeToolCall(name, args)

        toolCalls = [{
          name,
          status: toolResult.success ? 'success' : 'error',
          result: toolResult.message,
        }]

        // Get final response from Gemini with tool result
        assistantResponse = await sendFunctionResult(name, toolResult, chatHistory)
      } else {
        assistantResponse = response.text || 'Mohon maaf, saya tidak dapat memproses permintaan tersebut.'
      }

      // Add assistant message to chat
      addMessage({
        type: 'assistant',
        role: 'model',
        content: assistantResponse,
        toolCalls,
      })

      // Step 4: TTS Response
      if (voiceEnabled) {
        setStatus('responding')
        await speak(assistantResponse)
      }

      setStatus('standby')
      setTranscript('')

    } catch (error) {
      console.error('Voice processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setStatus('standby')

      // Add error message to chat
      addMessage({
        type: 'assistant',
        role: 'model',
        content: `Maaf, terjadi kesalahan: ${errorMessage}`,
      })
    } finally {
      processingRef.current = false
    }
  }, [
    geminiApiKey,
    deepgramApiKey,
    voiceEnabled,
    messages,
    setStatus,
    setTranscript,
    setError,
    addMessage,
  ])

  // Voice recording hook
  const {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recordingError,
  } = useVoiceRecording({
    onComplete: handleRecordingComplete,
  })

  // Update status when recording starts
  useEffect(() => {
    if (isRecording) {
      setStatus('listening')
    }
  }, [isRecording, setStatus])

  // Handle recording error
  useEffect(() => {
    if (recordingError) {
      setError(recordingError.message)
    }
  }, [recordingError, setError])

  // PTT handlers
  const handlePTTStart = useCallback(() => {
    if (status === 'standby' || status === 'responding') {
      stopTTS()
      startRecording()
    }
  }, [status, startRecording])

  const handlePTTEnd = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }
  }, [isRecording, stopRecording])

  const handleCancel = useCallback(() => {
    stopTTS()
    cancelRecording()
    setStatus('standby')
    setTranscript('')
  }, [cancelRecording, setStatus, setTranscript])

  // Space key PTT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space key for PTT (only when not in input field)
      if (e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        handlePTTStart()
      }

      // Escape to cancel
      if (e.code === 'Escape') {
        handleCancel()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        handlePTTEnd()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handlePTTStart, handlePTTEnd, handleCancel])

  // Text message handler (for ChatInput)
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim() || processingRef.current) return

    processingRef.current = true

    try {
      // Add user message
      addMessage({
        type: 'user',
        role: 'user',
        content: text,
      })

      setStatus('processing')

      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured')
      }

      const chatHistory: ChatMessage[] = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }))

      const response = await chatWithGemini(text, chatHistory)

      let assistantResponse: string
      let toolCalls: Array<{ name: string; status: 'pending' | 'success' | 'error'; result?: unknown }> | undefined

      if (response.type === 'function_call' && response.functionCall) {
        const { name, args } = response.functionCall
        const toolResult = await routeToolCall(name, args)

        toolCalls = [{
          name,
          status: toolResult.success ? 'success' : 'error',
          result: toolResult.message,
        }]

        assistantResponse = await sendFunctionResult(name, toolResult, chatHistory)
      } else {
        assistantResponse = response.text || 'Mohon maaf, saya tidak dapat memproses permintaan tersebut.'
      }

      addMessage({
        type: 'assistant',
        role: 'model',
        content: assistantResponse,
        toolCalls,
      })

      if (voiceEnabled) {
        setStatus('responding')
        await speak(assistantResponse)
      }

      setStatus('standby')

    } catch (error) {
      console.error('Message processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      addMessage({
        type: 'assistant',
        role: 'model',
        content: `Maaf, terjadi kesalahan: ${errorMessage}`,
      })

      setStatus('standby')
    } finally {
      processingRef.current = false
    }
  }, [geminiApiKey, voiceEnabled, messages, addMessage, setStatus])

  return {
    status,
    isRecording,
    handlePTTStart,
    handlePTTEnd,
    handleCancel,
    sendTextMessage,
  }
}
