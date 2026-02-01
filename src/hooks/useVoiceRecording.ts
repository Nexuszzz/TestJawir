import { useState, useRef, useCallback, useEffect } from 'react'
import { useVoiceStore } from '@stores/voiceStore'

export interface UseVoiceRecordingOptions {
  onComplete?: (audioBlob: Blob) => void
  onTranscript?: (text: string) => void
  onError?: (error: Error) => void
  maxDuration?: number  // in seconds
}

export function useVoiceRecording(options: UseVoiceRecordingOptions = {}) {
  const { onComplete, onError, maxDuration = 30 } = options
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const stream = useRef<MediaStream | null>(null)
  const durationInterval = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const { setAudioLevel, startListening, stopListening } = useVoiceStore()
  
  // Analyze audio levels for visualization
  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    const normalizedLevel = Math.min(100, (average / 128) * 100)
    
    setAudioLevel(normalizedLevel)
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel)
    }
  }, [isRecording, setAudioLevel])
  
  // Start recording
  const start = useCallback(async () => {
    try {
      // Request microphone access
      stream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      })
      
      // Setup audio analyzer for visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream.current)
      analyserRef.current = audioContext.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      
      // Create MediaRecorder
      mediaRecorder.current = new MediaRecorder(stream.current, {
        mimeType: 'audio/webm;codecs=opus',
      })
      
      audioChunks.current = []
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        
        // Trigger onComplete callback
        if (audioChunks.current.length > 0) {
          onComplete?.(blob)
        }
        
        // Clean up
        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop())
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (durationInterval.current) {
          clearInterval(durationInterval.current)
        }
        
        setAudioLevel(0)
      }
      
      mediaRecorder.current.start(100) // Collect data every 100ms
      setIsRecording(true)
      setDuration(0)
      startListening()
      
      // Start audio level analysis
      analyzeAudioLevel()
      
      // Track duration
      durationInterval.current = window.setInterval(() => {
        setDuration((d) => {
          if (d >= maxDuration) {
            stop()
            return d
          }
          return d + 1
        })
      }, 1000)
      
    } catch (err) {
      const recordingError = err as Error
      console.error('Failed to start recording:', recordingError)
      setError(recordingError)
      onError?.(recordingError)
    }
  }, [analyzeAudioLevel, maxDuration, onComplete, onError, setAudioLevel, startListening])
  
  // Stop recording
  const stop = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
      setIsRecording(false)
      stopListening()
    }
  }, [stopListening])
  
  // Cancel recording without saving
  const cancel = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      audioChunks.current = []
      mediaRecorder.current.stop()
      setIsRecording(false)
      setAudioBlob(null)
      
      const { reset } = useVoiceStore.getState()
      reset()
    }
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
    }
  }, [])
  
  return {
    isRecording,
    audioBlob,
    duration,
    error,
    start,
    stop,
    cancel,
    // Aliases for compatibility
    startRecording: start,
    stopRecording: stop,
    cancelRecording: cancel,
  }
}
