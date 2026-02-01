import { create } from 'zustand'

export type VoiceStatus = 'standby' | 'listening' | 'transcribing' | 'processing' | 'responding'

interface VoiceState {
  status: VoiceStatus
  transcript: string
  audioLevel: number  // 0-100 for visualizer
  isWakeWordActive: boolean
  error: string | null
  
  // Actions
  setStatus: (status: VoiceStatus) => void
  setTranscript: (text: string) => void
  setAudioLevel: (level: number) => void
  setWakeWordActive: (active: boolean) => void
  setError: (error: string | null) => void
  startListening: () => void
  stopListening: () => void
  reset: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  status: 'standby',
  transcript: '',
  audioLevel: 0,
  isWakeWordActive: true,
  error: null,
  
  setStatus: (status) => set({ status }),
  
  setTranscript: (transcript) => set({ transcript }),
  
  setAudioLevel: (audioLevel) => set({ audioLevel: Math.min(100, Math.max(0, audioLevel)) }),
  
  setWakeWordActive: (isWakeWordActive) => set({ isWakeWordActive }),
  
  setError: (error) => set({ error }),
  
  startListening: () => set({ 
    status: 'listening', 
    transcript: '',
    audioLevel: 0,
    error: null
  }),
  
  stopListening: () => set({ 
    status: 'transcribing',
    audioLevel: 0 
  }),
  
  reset: () => set({
    status: 'standby',
    transcript: '',
    audioLevel: 0,
    error: null,
  }),
}))
