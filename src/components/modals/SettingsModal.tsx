// Settings Modal Component with Tabs
// Voice, Appearance, Mode, and Integrations settings

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@stores/settingsStore'
import { validateGeminiKey } from '@services/gemini'
import { validateDeepgramKey } from '@services/deepgram'
import { ModeSettings } from './ModeSettings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'voice' | 'appearance' | 'mode' | 'integrations'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSettingsStore()
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('voice')
  
  // Voice settings
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '')
  const [deepgramKey, setDeepgramKey] = useState(settings.deepgramApiKey || '')
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceEnabled)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(settings.wakeWordEnabled)
  const [ttsVoice, setTtsVoice] = useState(settings.ttsVoice || 'id-ID-ArdiNeural')
  const [speechRate, setSpeechRate] = useState(settings.speechRate || 1.0)
  
  // Appearance settings
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(settings.theme || 'dark')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(settings.fontSize || 'medium')
  const [animationsEnabled, setAnimationsEnabled] = useState(settings.animationsEnabled ?? true)
  
  // Integration settings
  const [mqttUrl, setMqttUrl] = useState(settings.mqttBrokerUrl || '')
  const [mqttUsername, setMqttUsername] = useState(settings.mqttUsername || 'zaks')
  const [mqttPassword, setMqttPassword] = useState(settings.mqttPassword || 'enggangodinginmcu')
  const [whatsappUrl, setWhatsappUrl] = useState(settings.whatsappApiUrl || '')
  const [googleConnected, setGoogleConnected] = useState(false)
  
  // Validation states
  const [geminiValid, setGeminiValid] = useState<boolean | null>(null)
  const [deepgramValid, setDeepgramValid] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setGeminiKey(settings.geminiApiKey || '')
      setDeepgramKey(settings.deepgramApiKey || '')
      setVoiceEnabled(settings.voiceEnabled)
      setWakeWordEnabled(settings.wakeWordEnabled)
      setMqttUrl(settings.mqttBrokerUrl || '')
      setGeminiValid(null)
      setDeepgramValid(null)
    }
  }, [isOpen, settings])
  
  // Validate API keys
  const handleValidate = async () => {
    setIsValidating(true)
    
    try {
      const [geminiResult, deepgramResult] = await Promise.all([
        geminiKey ? validateGeminiKey(geminiKey) : Promise.resolve(false),
        deepgramKey ? validateDeepgramKey(deepgramKey) : Promise.resolve(false),
      ])
      
      setGeminiValid(geminiResult)
      setDeepgramValid(deepgramResult)
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }
  
  // Save settings
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Voice settings
      settings.setGeminiApiKey(geminiKey)
      settings.setDeepgramApiKey(deepgramKey)
      settings.setVoiceEnabled(voiceEnabled)
      settings.setWakeWordEnabled(wakeWordEnabled)
      settings.setTtsVoice(ttsVoice)
      settings.setSpeechRate(speechRate)
      
      // Appearance settings
      settings.setTheme(theme)
      settings.setFontSize(fontSize)
      settings.setAnimationsEnabled(animationsEnabled)
      
      // Integration settings - MQTT with credentials
      settings.setMqttSettings({
        url: mqttUrl,
        username: mqttUsername,
        password: mqttPassword,
      })
      settings.setWhatsappApiUrl(whatsappUrl)
      
      onClose()
    } finally {
      setIsSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'voice', label: 'Suara', icon: 'record_voice_over' },
    { id: 'appearance', label: 'Tampilan', icon: 'palette' },
    { id: 'mode', label: 'Mode', icon: 'tune' },
    { id: 'integrations', label: 'Integrasi', icon: 'extension' },
  ]
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-coffee-dark border border-coffee-light/20 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-light/10">
          <h2 className="text-lg font-semibold text-cream flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            Pengaturan
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg 
                       hover:bg-coffee-light/10 text-cream/60 hover:text-cream transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-coffee-light/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
                         transition-colors ${
                           activeTab === tab.id
                             ? 'text-primary border-b-2 border-primary'
                             : 'text-cream/60 hover:text-cream'
                         }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <>
              {/* Gemini API Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-cream/80 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
                  Gemini API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 px-3 py-2 bg-coffee-light/10 border border-coffee-light/20 
                               rounded-lg text-cream placeholder-cream/30 focus:outline-none 
                               focus:border-primary/50 text-sm"
                  />
                  <ValidationBadge status={geminiValid} />
                </div>
                <p className="text-xs text-cream/40">
                  Dapatkan di{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google AI Studio
                  </a>
                </p>
              </div>
              
              {/* Deepgram API Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-cream/80 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">mic</span>
                  Deepgram API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={deepgramKey}
                    onChange={(e) => setDeepgramKey(e.target.value)}
                    placeholder="xxxxxxxx..."
                    className="flex-1 px-3 py-2 bg-coffee-light/10 border border-coffee-light/20 
                               rounded-lg text-cream placeholder-cream/30 focus:outline-none 
                               focus:border-primary/50 text-sm"
                  />
                  <ValidationBadge status={deepgramValid} />
                </div>
                <p className="text-xs text-cream/40">
                  Dapatkan di{' '}
                  <a href="https://console.deepgram.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Deepgram Console
                  </a>
                </p>
              </div>
              
              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-coffee-light/10">
                <ToggleSwitch
                  label="Respons Suara (TTS)"
                  description="Jawir akan berbicara merespons perintah"
                  icon="volume_up"
                  checked={voiceEnabled}
                  onChange={setVoiceEnabled}
                />
                
                <ToggleSwitch
                  label="Wake Word 'Jawir'"
                  description="Aktifkan dengan menyebut 'Jawir'"
                  icon="hearing"
                  checked={wakeWordEnabled}
                  onChange={setWakeWordEnabled}
                />
              </div>
              
              {/* TTS Voice Selection */}
              <div className="space-y-2 pt-4 border-t border-coffee-light/10">
                <label className="text-sm font-medium text-cream/80 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">person</span>
                  Suara TTS
                </label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full px-3 py-2 bg-coffee-light/10 border border-coffee-light/20 
                             rounded-lg text-cream focus:outline-none focus:border-primary/50 text-sm"
                >
                  <option value="id-ID-ArdiNeural">🇮🇩 Ardi (Pria Indonesia)</option>
                  <option value="id-ID-GadisNeural">🇮🇩 Gadis (Wanita Indonesia)</option>
                  <option value="en-US-ChristopherNeural">🇺🇸 Christopher (English)</option>
                </select>
              </div>
              
              {/* Speech Rate */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-cream/80 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">speed</span>
                    Kecepatan Bicara
                  </span>
                  <span className="text-primary">{speechRate}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </>
          )}
          
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <>
              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-cream/80">Tema</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'dark', label: 'Gelap', icon: 'dark_mode' },
                    { id: 'light', label: 'Terang', icon: 'light_mode' },
                    { id: 'system', label: 'Sistem', icon: 'computer' },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === t.id
                          ? 'border-primary bg-primary/10'
                          : 'border-coffee-light/20 hover:border-coffee-light/40'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${
                        theme === t.id ? 'text-primary' : 'text-cream/60'
                      }`}>
                        {t.icon}
                      </span>
                      <p className={`text-xs mt-2 ${
                        theme === t.id ? 'text-primary' : 'text-cream/60'
                      }`}>
                        {t.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Font Size */}
              <div className="space-y-3 pt-4 border-t border-coffee-light/10">
                <label className="text-sm font-medium text-cream/80">Ukuran Font</label>
                <div className="flex gap-3">
                  {([
                    { id: 'small', label: 'Kecil' },
                    { id: 'medium', label: 'Normal' },
                    { id: 'large', label: 'Besar' },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFontSize(f.id)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${
                        fontSize === f.id
                          ? 'bg-primary text-coffee-dark font-medium'
                          : 'bg-coffee-light/10 text-cream/60 hover:bg-coffee-light/20'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Animations */}
              <div className="pt-4 border-t border-coffee-light/10">
                <ToggleSwitch
                  label="Animasi"
                  description="Aktifkan transisi dan animasi UI"
                  icon="animation"
                  checked={animationsEnabled}
                  onChange={setAnimationsEnabled}
                />
              </div>
            </>
          )}
          
          {/* Mode Tab */}
          {activeTab === 'mode' && (
            <ModeSettings />
          )}
          
          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <>
              {/* MQTT Broker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-cream/80 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">hub</span>
                  MQTT Broker URL
                </label>
                <input
                  type="text"
                  value={mqttUrl}
                  onChange={(e) => setMqttUrl(e.target.value)}
                  placeholder="mqtt://103.127.99.24:1884"
                  className="w-full px-3 py-2 bg-coffee-light/10 border border-coffee-light/20 
                             rounded-lg text-cream placeholder-cream/30 focus:outline-none 
                             focus:border-primary/50 text-sm"
                />
                <p className="text-xs text-cream/40">
                  Format: mqtt://IP:PORT atau ws://IP:PORT/mqtt
                </p>
              </div>
              
              {/* MQTT Credentials */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cream/80">Username</label>
                  <input
                    type="text"
                    value={mqttUsername}
                    onChange={(e) => setMqttUsername(e.target.value)}
                    placeholder="zaks"
                    className="w-full px-3 py-2 bg-coffee-light/10 border border-coffee-light/20 
                               rounded-lg text-cream placeholder-cream/30 focus:outline-none 
                               focus:border-primary/50 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cream/80">Password</label>
                  <input
                    type="password"
                    value={mqttPassword}
                    onChange={(e) => setMqttPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-coffee-light/10 border border-coffee-light/20 
                               rounded-lg text-cream placeholder-cream/30 focus:outline-none 
                               focus:border-primary/50 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-cream/40 -mt-1">
                Untuk sensor deteksi api (nimak/deteksi-api/*)
              </p>
              
              {/* WhatsApp API */}
              <div className="space-y-2 pt-4 border-t border-coffee-light/10">
                <label className="text-sm font-medium text-cream/80 flex items-center gap-2">
                  <span className="material-symbols-outlined text-whatsapp text-lg">chat</span>
                  WhatsApp API URL
                </label>
                <input
                  type="text"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-2 bg-coffee-light/10 border border-coffee-light/20 
                             rounded-lg text-cream placeholder-cream/30 focus:outline-none 
                             focus:border-primary/50 text-sm"
                />
                <p className="text-xs text-cream/40">
                  go-whatsapp-web-multidevice REST API
                </p>
              </div>
              
              {/* Google Account */}
              <div className="pt-4 border-t border-coffee-light/10">
                <div className="flex items-center justify-between p-4 bg-coffee-light/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-500">account_circle</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cream">Google Account</p>
                      <p className="text-xs text-cream/40">
                        {googleConnected ? 'Terhubung' : 'Belum terhubung'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGoogleConnected(!googleConnected)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                      googleConnected
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-primary text-coffee-dark hover:bg-primary/90'
                    }`}
                  >
                    {googleConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-coffee-light/10">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="px-4 py-2 text-sm text-cream/60 hover:text-cream 
                       hover:bg-coffee-light/10 rounded-lg transition-colors
                       disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              {isValidating ? 'sync' : 'verified'}
            </span>
            {isValidating ? 'Validating...' : 'Validate Keys'}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-cream/60 hover:text-cream 
                         hover:bg-coffee-light/10 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-sm bg-primary text-coffee-dark font-bold 
                         rounded-lg hover:bg-primary-light transition-colors
                         disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <span className="material-symbols-outlined animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined">save</span>
              )}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function ValidationBadge({ status }: { status: boolean | null }) {
  if (status === null) return null
  
  return (
    <span className={`flex items-center px-2 ${status ? 'text-green-500' : 'text-red-500'}`}>
      <span className="material-symbols-outlined">
        {status ? 'check_circle' : 'error'}
      </span>
    </span>
  )
}

function ToggleSwitch({
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  label: string
  description?: string
  icon: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-lg mt-0.5">{icon}</span>
        <div>
          <span className="text-sm font-medium text-cream/80">{label}</span>
          {description && (
            <p className="text-xs text-cream/40">{description}</p>
          )}
        </div>
      </label>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-coffee-light/20'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  )
}
