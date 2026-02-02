import { useEffect } from 'react'
import { Header, Sidebar, Workspace } from '@components/layout'
import { ListeningOverlay, SettingsModal, ToastContainer, ConfirmActionModal } from '@components/modals'
import { ErrorBoundary, SectionErrorBoundary } from '@components/ErrorBoundary'
import { useVoiceController } from '@hooks/useVoiceController'
import { useWakeWord } from '@hooks/useWakeWord'
import { useSettingsStore } from '@stores/settingsStore'
import { useConfirmationStore } from '@stores/confirmationStore'
import { connectMqtt } from '@services/mqtt'
import { initGemini } from '@services/gemini'

/**
 * Load API keys from environment variables (.env) on first run
 * User can override these in Settings
 */
function useEnvConfig() {
  const settings = useSettingsStore()

  useEffect(() => {
    // Only set from env if not already configured (first run)
    const envGemini = import.meta.env.VITE_GEMINI_API_KEY
    const envDeepgram = import.meta.env.VITE_DEEPGRAM_API_KEY
    const envMqttUrl = import.meta.env.VITE_MQTT_BROKER_URL
    const envMqttUser = import.meta.env.VITE_MQTT_USERNAME
    const envMqttPass = import.meta.env.VITE_MQTT_PASSWORD
    const envWhatsApp = import.meta.env.VITE_WHATSAPP_API_URL

    // Set Gemini key from env if not set in store
    if (envGemini && !settings.geminiApiKey) {
      settings.setGeminiApiKey(envGemini)
    }

    // Set Deepgram key from env if not set in store
    if (envDeepgram && !settings.deepgramApiKey) {
      settings.setDeepgramApiKey(envDeepgram)
    }

    // Set MQTT settings from env if not set in store
    if (envMqttUrl && !settings.mqttBrokerUrl) {
      settings.setMqttSettings({
        url: envMqttUrl,
        username: envMqttUser || 'zaks',
        password: envMqttPass || 'enggangodinginmcu',
      })
    }

    // Set WhatsApp API URL from env if not set in store
    if (envWhatsApp && !settings.whatsappApiUrl) {
      settings.setWhatsappApiUrl(envWhatsApp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount
}

function AppContent() {
  const { geminiApiKey, mqttBrokerUrl, isSettingsOpen, closeSettings, wakeWordEnabled } = useSettingsStore()
  const { isOpen: isConfirmOpen, request: confirmRequest, confirm, cancel } = useConfirmationStore()

  // Load env config on first run
  useEnvConfig()

  // Initialize voice controller (handles PTT Space key)
  useVoiceController()

  // Initialize wake word detection
  useWakeWord({ enabled: wakeWordEnabled })

  // Initialize voice controller (handles PTT Space key)
  useVoiceController()

  // Initialize wake word detection
  useWakeWord({ enabled: wakeWordEnabled })

  // Initialize services on mount
  useEffect(() => {
    // Initialize Gemini if API key exists
    if (geminiApiKey) {
      initGemini(geminiApiKey)
    }

    // Connect to MQTT broker (only if URL is configured)
    if (mqttBrokerUrl && mqttBrokerUrl.trim() !== '') {
      connectMqtt(mqttBrokerUrl).catch(console.error)
    } else {
      console.log('[MQTT] Broker URL not configured - skipping connection')
    }
  }, [geminiApiKey, mqttBrokerUrl])

  return (
    <div className="h-screen w-screen bg-coffee-dark flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SectionErrorBoundary sectionName="sidebar">
          <Sidebar />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="workspace">
          <Workspace />
        </SectionErrorBoundary>
      </div>

      {/* Voice listening overlay */}
      <ListeningOverlay />

      {/* Settings modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />

      {/* Global Confirmation Modal */}
      {confirmRequest && (
        <ConfirmActionModal
          isOpen={isConfirmOpen}
          onClose={cancel}
          onConfirm={confirm}
          onCancel={cancel}
          title={confirmRequest.title}
          description={confirmRequest.description}
          action={confirmRequest.action}
          details={confirmRequest.details}
          riskLevel={confirmRequest.riskLevel}
          countdownSeconds={confirmRequest.countdownSeconds}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
