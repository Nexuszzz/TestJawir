import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore } from '@stores/chatStore'
import { useVoiceStore } from '@stores/voiceStore'
import { useSettingsStore } from '@stores/settingsStore'
import { initGemini, chatWithGemini, sendFunctionResult, type ChatMessage } from '@services/gemini'
import { routeToolCall } from '@tools/router'

export function ChatInput() {
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const geminiInitializedRef = useRef(false)

  const { messages, addMessage } = useChatStore()
  const { status, startListening, stopListening, setStatus } = useVoiceStore()
  const { geminiApiKey } = useSettingsStore()

  // Initialize Gemini when API key is available
  useEffect(() => {
    if (geminiApiKey && !geminiInitializedRef.current) {
      console.log('[ChatInput] Initializing Gemini with API key')
      initGemini(geminiApiKey)
      geminiInitializedRef.current = true
    }
  }, [geminiApiKey])

  // Process message with Gemini
  const processWithGemini = useCallback(async (text: string) => {
    if (!geminiApiKey) {
      addMessage({
        type: 'assistant',
        role: 'model',
        content: 'Mohon maaf Mas, API key belum dikonfigurasi. Silakan cek file .env dan pastikan VITE_GEMINI_API_KEY sudah diisi.',
      })
      setStatus('standby')
      return
    }

    try {
      // Prepare chat history (last 10 messages)
      const chatHistory: ChatMessage[] = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }))

      console.log('[ChatInput] Sending to Gemini:', text)
      const response = await chatWithGemini(text, chatHistory)
      console.log('[ChatInput] Gemini response:', response)

      let assistantResponse: string
      let toolCalls: Array<{ name: string; status: 'pending' | 'success' | 'error'; result?: unknown }> | undefined

      if (response.type === 'function_call' && response.functionCall) {
        // Execute tool
        const { name, args } = response.functionCall
        console.log('[ChatInput] Executing tool:', name, args)

        const toolResult = await routeToolCall(name, args)

        toolCalls = [{
          name,
          status: toolResult.success ? 'success' : 'error',
          result: toolResult,
        }]

        // Get final response from Gemini with tool result
        assistantResponse = await sendFunctionResult(name, toolResult, [
          ...chatHistory,
          { role: 'user', content: text },
        ])
      } else {
        assistantResponse = response.text || 'Maaf, tidak ada respons dari AI.'
      }

      // Add assistant message
      addMessage({
        type: 'assistant',
        role: 'model',
        content: assistantResponse,
        toolCalls,
      })

    } catch (error) {
      console.error('[ChatInput] Error processing with Gemini:', error)
      addMessage({
        type: 'assistant',
        role: 'model',
        content: `Mohon maaf Mas, terjadi error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }

    setStatus('standby')
  }, [geminiApiKey, messages, addMessage, setStatus])

  // Handle text submission
  const handleSubmit = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isProcessing) return

    setIsProcessing(true)

    addMessage({
      type: 'user',
      role: 'user',
      content: text,
      isVoice: false,
    })

    setInputText('')
    setStatus('processing')

    await processWithGemini(text)

    setIsProcessing(false)
  }, [inputText, isProcessing, addMessage, setStatus, processWithGemini])

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle PTT (Space key)
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (document.activeElement === inputRef.current) return

      if (e.code === 'Space' && !e.repeat && status === 'standby') {
        e.preventDefault()
        setIsRecording(true)
        startListening()
      }
    }

    const handleKeyUpGlobal = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault()
        setIsRecording(false)
        stopListening()

        // Simulate transcription
        setTimeout(() => {
          // TODO: Real STT integration
          setStatus('standby')
        }, 1000)
      }
    }

    window.addEventListener('keydown', handleKeyDownGlobal)
    window.addEventListener('keyup', handleKeyUpGlobal)

    return () => {
      window.removeEventListener('keydown', handleKeyDownGlobal)
      window.removeEventListener('keyup', handleKeyUpGlobal)
    }
  }, [status, isRecording, startListening, stopListening, setStatus])

  // Handle mic button click (toggle mode)
  const handleMicClick = () => {
    if (status === 'standby') {
      startListening()
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (useVoiceStore.getState().status === 'listening') {
          stopListening()
          setTimeout(() => setStatus('standby'), 1000)
        }
      }, 10000)
    } else if (status === 'listening') {
      stopListening()
      setTimeout(() => setStatus('standby'), 1000)
    }
  }

  const isDisabled = status !== 'standby' || isProcessing

  return (
    <div className="p-4 border-t border-coffee-medium">
      <div className="flex items-center gap-2 bg-coffee-light rounded-2xl p-2">
        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan atau tahan Space untuk bicara..."
          className="flex-1 bg-transparent text-cream text-sm px-3 py-2 outline-none placeholder:text-cream-muted"
          disabled={isDisabled}
        />

        {/* Attachment Button */}
        <button
          className="btn-ghost p-2 rounded-xl disabled:opacity-50"
          disabled={isDisabled}
          title="Lampirkan file"
        >
          <span className="material-symbols-outlined text-cream-muted">attach_file</span>
        </button>

        {/* Send/Mic Button */}
        {inputText.trim() ? (
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
            title="Kirim pesan"
          >
            <span className="material-symbols-outlined text-coffee-dark">
              {isProcessing ? 'hourglass_empty' : 'send'}
            </span>
          </button>
        ) : (
          <button
            onClick={handleMicClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${status === 'listening'
                ? 'bg-error animate-pulse'
                : 'bg-primary hover:bg-primary/90'
              }`}
            title={status === 'listening' ? 'Berhenti merekam' : 'Mulai bicara'}
          >
            <span className={`material-symbols-outlined ${status === 'listening' ? 'text-white' : 'text-coffee-dark'
              }`}>
              {status === 'listening' ? 'stop' : 'mic'}
            </span>
          </button>
        )}
      </div>

      {/* Hint text */}
      <p className="text-xs text-cream-muted text-center mt-2">
        {isProcessing ? (
          <span className="text-primary animate-pulse">⏳ Memproses...</span>
        ) : status === 'listening' ? (
          <span className="text-primary animate-pulse">🎤 Mendengarkan...</span>
        ) : (
          <>
            Tekan & tahan <kbd className="px-1.5 py-0.5 bg-coffee-light rounded text-primary font-mono">Space</kbd> untuk bicara
          </>
        )}
      </p>
    </div>
  )
}

