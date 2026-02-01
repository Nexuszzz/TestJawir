import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // Voice settings
  voiceEnabled: boolean
  wakeWordEnabled: boolean
  pttKey: string
  selectedMicrophone: string
  ttsVoice: string
  speechRate: number
  
  // Appearance
  theme: 'dark' | 'light' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  animationsEnabled: boolean
  
  // API Keys (stored securely)
  geminiApiKey: string
  deepgramApiKey: string
  
  // MQTT
  mqttBrokerUrl: string
  mqttUsername: string
  mqttPassword: string
  
  // WhatsApp
  whatsappApiUrl: string
  
  // UI State
  isSettingsOpen: boolean
  settingsTab: 'voice' | 'appearance' | 'integrations' | 'about'
  
  // Actions
  setVoiceEnabled: (enabled: boolean) => void
  setWakeWordEnabled: (enabled: boolean) => void
  setPttKey: (key: string) => void
  setSelectedMicrophone: (deviceId: string) => void
  setTtsVoice: (voice: string) => void
  setSpeechRate: (rate: number) => void
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  setAnimationsEnabled: (enabled: boolean) => void
  setGeminiApiKey: (key: string) => void
  setDeepgramApiKey: (key: string) => void
  setMqttBrokerUrl: (url: string) => void
  setMqttSettings: (settings: { url?: string; username?: string; password?: string }) => void
  setWhatsappApiUrl: (url: string) => void
  openSettings: () => void
  closeSettings: () => void
  setSettingsTab: (tab: SettingsState['settingsTab']) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      voiceEnabled: true,
      wakeWordEnabled: true,
      pttKey: 'Space',
      selectedMicrophone: 'default',
      ttsVoice: 'id-ID-ArdiNeural',
      speechRate: 1.0,
      theme: 'dark',
      fontSize: 'medium',
      animationsEnabled: true,
      geminiApiKey: '',
      deepgramApiKey: '',
      mqttBrokerUrl: '',
      mqttUsername: '',
      mqttPassword: '',
      whatsappApiUrl: '',
      isSettingsOpen: false,
      settingsTab: 'voice',
      
      // Actions
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setWakeWordEnabled: (wakeWordEnabled) => set({ wakeWordEnabled }),
      setPttKey: (pttKey) => set({ pttKey }),
      setSelectedMicrophone: (selectedMicrophone) => set({ selectedMicrophone }),
      setTtsVoice: (ttsVoice) => set({ ttsVoice }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setDeepgramApiKey: (deepgramApiKey) => set({ deepgramApiKey }),
      setMqttBrokerUrl: (mqttBrokerUrl) => set({ mqttBrokerUrl }),
      setMqttSettings: (settings) => set((state) => ({
        mqttBrokerUrl: settings.url ?? state.mqttBrokerUrl,
        mqttUsername: settings.username ?? state.mqttUsername,
        mqttPassword: settings.password ?? state.mqttPassword,
      })),
      setWhatsappApiUrl: (whatsappApiUrl) => set({ whatsappApiUrl }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      setSettingsTab: (settingsTab) => set({ settingsTab }),
    }),
    {
      name: 'jawir-settings',
      partialize: (state) => ({
        voiceEnabled: state.voiceEnabled,
        wakeWordEnabled: state.wakeWordEnabled,
        pttKey: state.pttKey,
        selectedMicrophone: state.selectedMicrophone,
        ttsVoice: state.ttsVoice,
        speechRate: state.speechRate,
        theme: state.theme,
        fontSize: state.fontSize,
        animationsEnabled: state.animationsEnabled,
        // Note: API keys should be stored more securely in production
        geminiApiKey: state.geminiApiKey,
        deepgramApiKey: state.deepgramApiKey,
        mqttBrokerUrl: state.mqttBrokerUrl,
        mqttUsername: state.mqttUsername,
        mqttPassword: state.mqttPassword,
        whatsappApiUrl: state.whatsappApiUrl,
      }),
    }
  )
)
