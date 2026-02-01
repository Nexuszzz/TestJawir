// Text-to-Speech Service
// Primary: Edge TTS (via edge-tts package)
// Fallback: Web Speech API

export interface TTSOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

// Default Indonesian voice for Edge TTS
const DEFAULT_VOICE = 'id-ID-ArdiNeural' // Indonesian male voice
// const FALLBACK_VOICE = 'id-ID-GadisNeural' // Indonesian female voice (reserved)

let isPlaying = false
let currentAudio: HTMLAudioElement | null = null

/**
 * Speak text using Edge TTS
 * This uses the edge-tts-node package or fallback to Web Speech API
 */
export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  // Stop any currently playing audio
  stop()
  
  const {
    voice = DEFAULT_VOICE,
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
  } = options
  
  try {
    // For now, use Web Speech API directly
    // TODO: Implement Edge TTS via Electron IPC
    await speakWithWebSpeech(text, { voice, rate, pitch, volume })
  } catch (error) {
    console.error('TTS error:', error)
    // Final fallback
    await speakWithWebSpeech(text, { voice, rate, pitch, volume })
  }
}

/**
 * Play audio from base64 string
 * Reserved for Edge TTS integration
 */
async function _playAudioBase64(base64: string, volume: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`)
    audio.volume = volume
    currentAudio = audio
    isPlaying = true
    
    audio.onended = () => {
      isPlaying = false
      currentAudio = null
      resolve()
    }
    
    audio.onerror = (e) => {
      isPlaying = false
      currentAudio = null
      reject(e)
    }
    
    audio.play()
  })
}

// Export for future Edge TTS integration
export { _playAudioBase64 as playAudioBase64 }

/**
 * Fallback: Speak using Web Speech API
 */
function speakWithWebSpeech(text: string, options: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Web Speech API not supported'))
      return
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Find Indonesian voice or use default
    const voices = speechSynthesis.getVoices()
    const indonesianVoice = voices.find(v => v.lang.startsWith('id')) || voices[0]
    
    if (indonesianVoice) {
      utterance.voice = indonesianVoice
    }
    
    utterance.rate = options.rate || 1.0
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0
    
    isPlaying = true
    
    utterance.onend = () => {
      isPlaying = false
      resolve()
    }
    
    utterance.onerror = (e) => {
      isPlaying = false
      reject(e)
    }
    
    speechSynthesis.speak(utterance)
  })
}

/**
 * Stop any currently playing speech
 */
export function stop(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
  
  isPlaying = false
}

/**
 * Check if TTS is currently playing
 */
export function isSpeaking(): boolean {
  return isPlaying || speechSynthesis?.speaking || false
}

/**
 * Get available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return []
  }
  return speechSynthesis.getVoices()
}

/**
 * Get Indonesian voices
 */
export function getIndonesianVoices(): SpeechSynthesisVoice[] {
  return getAvailableVoices().filter(v => v.lang.startsWith('id'))
}

// Preload voices when module loads
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    // Voices are loaded
    console.log('TTS voices loaded:', getAvailableVoices().length)
  }
  // Trigger initial load
  speechSynthesis.getVoices()
}
