import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore } from '@stores/chatStore'
import { useVoiceStore } from '@stores/voiceStore'

export function ChatInput() {
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const addMessage = useChatStore((state) => state.addMessage)
  const { status, startListening, stopListening, setStatus } = useVoiceStore()
  
  // Handle text submission
  const handleSubmit = useCallback(() => {
    const text = inputText.trim()
    if (!text) return
    
    addMessage({
      type: 'user',
      role: 'user',
      content: text,
      isVoice: false,
    })
    
    setInputText('')
    setStatus('processing')
    
    // TODO: Send to Gemini
    setTimeout(() => {
      addMessage({
        type: 'assistant',
        role: 'model',
        content: 'Mohon maaf Mas, fitur AI belum aktif. Silakan konfigurasi API key di pengaturan.',
      })
      setStatus('standby')
    }, 1500)
  }, [inputText, addMessage, setStatus])
  
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
          disabled={status !== 'standby'}
        />
        
        {/* Attachment Button */}
        <button 
          className="btn-ghost p-2 rounded-xl disabled:opacity-50"
          disabled={status !== 'standby'}
          title="Lampirkan file"
        >
          <span className="material-symbols-outlined text-cream-muted">attach_file</span>
        </button>
        
        {/* Send/Mic Button */}
        {inputText.trim() ? (
          <button 
            onClick={handleSubmit}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
            title="Kirim pesan"
          >
            <span className="material-symbols-outlined text-coffee-dark">send</span>
          </button>
        ) : (
          <button 
            onClick={handleMicClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              status === 'listening' 
                ? 'bg-error animate-pulse' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            title={status === 'listening' ? 'Berhenti merekam' : 'Mulai bicara'}
          >
            <span className={`material-symbols-outlined ${
              status === 'listening' ? 'text-white' : 'text-coffee-dark'
            }`}>
              {status === 'listening' ? 'stop' : 'mic'}
            </span>
          </button>
        )}
      </div>
      
      {/* Hint text */}
      <p className="text-xs text-cream-muted text-center mt-2">
        {status === 'listening' ? (
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
