// Wake Word Detection Hook
// Uses OpenWakeWord or simple voice activity detection
// Triggers listening when "Jawir" is detected

import { useEffect, useRef, useCallback, useState } from 'react'
import { useVoiceStore } from '@stores/voiceStore'

// Web Speech API types
interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export interface UseWakeWordOptions {
  enabled?: boolean
  keyword?: string
  sensitivity?: number
  onDetected?: () => void
}

/**
 * Hook for wake word detection
 * Currently uses a simplified approach - in production would use OpenWakeWord
 */
export function useWakeWord(options: UseWakeWordOptions = {}) {
  const {
    enabled = true,
    keyword = 'jawir',
    sensitivity: _sensitivity = 0.5, // Reserved for future use
    onDetected,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const { startListening } = useVoiceStore()

  // Check if Web Speech API is supported
  useEffect(() => {
    const SR = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition || 
               (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
    setIsSupported(!!SR)
  }, [])

  // Handle wake word detection
  const handleWakeWordDetected = useCallback(() => {
    console.log('🎤 Wake word "Jawir" detected!')
    
    // Stop wake word listening
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    // Trigger callback
    onDetected?.()
    
    // Start main voice listening
    startListening()
  }, [onDetected, startListening])

  // Start wake word detection
  const startWakeWordDetection = useCallback(() => {
    if (!isSupported || !enabled) return

    const SR = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition || 
               (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
    if (!SR) return

    try {
      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'id-ID'

      recognition.onstart = () => {
        setIsListening(true)
        console.log('👂 Wake word detection started')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results
        for (let i = event.resultIndex; i < results.length; i++) {
          const transcript = results[i][0].transcript.toLowerCase()
          
          // Check for wake word
          if (transcript.includes(keyword.toLowerCase())) {
            handleWakeWordDetected()
            return
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Only log once for permission errors, don't spam
        if (event.error === 'not-allowed') {
          console.warn('Wake word: Microphone permission denied. Please allow microphone access.')
          // Stop trying - user needs to grant permission
          stopWakeWordDetection()
          return
        }
        
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Wake word detection error:', event.error)
        }
        
        // Restart on recoverable errors only
        if (event.error === 'no-speech' || event.error === 'aborted') {
          setTimeout(() => {
            if (enabled) startWakeWordDetection()
          }, 1000)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        
        // Only auto-restart if still enabled AND we didn't get a permission error
        // The permission error handler already stops detection
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error('Failed to start wake word detection:', error)
    }
  }, [isSupported, enabled, keyword, handleWakeWordDetected])

  // Stop wake word detection
  const stopWakeWordDetection = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // Start/stop based on enabled flag
  useEffect(() => {
    if (enabled && isSupported) {
      startWakeWordDetection()
    } else {
      stopWakeWordDetection()
    }

    return () => {
      stopWakeWordDetection()
    }
  }, [enabled, isSupported, startWakeWordDetection, stopWakeWordDetection])

  // Handle Electron wake word event
  useEffect(() => {
    if (window.electronAPI?.onWakeWordDetected) {
      const unsubscribe = window.electronAPI.onWakeWordDetected(() => {
        handleWakeWordDetected()
      })
      return unsubscribe
    }
  }, [handleWakeWordDetected])

  return {
    isListening,
    isSupported,
    startWakeWordDetection,
    stopWakeWordDetection,
  }
}
