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
      // Read from environment variables with fallback to empty string
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      deepgramApiKey: import.meta.env.VITE_DEEPGRAM_API_KEY || '',
      mqttBrokerUrl: import.meta.env.VITE_MQTT_BROKER_URL || '',
      mqttUsername: import.meta.env.VITE_MQTT_USERNAME || '',
      mqttPassword: import.meta.env.VITE_MQTT_PASSWORD || '',
      whatsappApiUrl: import.meta.env.VITE_WHATSAPP_API_URL || '',
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
      // Merge persisted state with env variables (env takes priority if persisted is empty)
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsState>

        // Helper to get value: prefer persisted if non-empty, else env, else default
        const getValue = (persistedVal: string | undefined, envKey: string): string => {
          // If persisted has a non-empty value, use it
          if (persistedVal && persistedVal.trim() !== '') {
            return persistedVal
          }
          // Otherwise fallback to env
          return import.meta.env[envKey] || ''
        }

        return {
          ...currentState,
          ...persisted,
          // Override with env variables if persisted values are empty
          geminiApiKey: getValue(persisted?.geminiApiKey, 'VITE_GEMINI_API_KEY'),
          deepgramApiKey: getValue(persisted?.deepgramApiKey, 'VITE_DEEPGRAM_API_KEY'),
          mqttBrokerUrl: getValue(persisted?.mqttBrokerUrl, 'VITE_MQTT_BROKER_URL'),
          mqttUsername: getValue(persisted?.mqttUsername, 'VITE_MQTT_USERNAME'),
          mqttPassword: getValue(persisted?.mqttPassword, 'VITE_MQTT_PASSWORD'),
          whatsappApiUrl: getValue(persisted?.whatsappApiUrl, 'VITE_WHATSAPP_API_URL'),
        }
      },
    }
  )
)

