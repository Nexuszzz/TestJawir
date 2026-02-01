import { useState } from 'react'
import { useIoTStore } from '@stores/iotStore'

/**
 * Dimmer Kipas Card
 * NOTE: Kipas dikendalikan secara LOKAL via tombol fisik di ESP32
 * - BTN_MODE (GPIO19): Toggle MANUAL <-> AUTO(DHT)
 * - BTN_SPEED (GPIO18): Cycle speed (OFF -> LOW -> MED -> HIGH)
 * - LED GREEN (GPIO26): Mode MANUAL
 * - LED RED (GPIO27): Mode AUTO
 * 
 * Tidak menggunakan MQTT - hanya simulasi UI
 * Kontrol kipas sesungguhnya dilakukan via tombol fisik
 */
export function DimmerFanCard() {
  const { fanDimmer, updateFanDimmer } = useIoTStore()
  const [localSpeed, setLocalSpeed] = useState(fanDimmer.speed)
  
  const { speed, isOn, lastUpdate } = fanDimmer
  // Simulasi: selalu online karena ini hanya UI lokal
  const isOnline = true
  
  // Handle slider change (UI only - no MQTT)
  const handleSpeedChange = (newSpeed: number) => {
    setLocalSpeed(newSpeed)
  }
  
  // Handle slider release - update local state only
  const handleSpeedCommit = () => {
    updateFanDimmer({ speed: localSpeed, isOn: localSpeed > 0 })
    // NOTE: No MQTT command - kipas dikendalikan lokal
  }
  
  // Quick actions (UI simulation only)
  const handleOff = () => {
    setLocalSpeed(0)
    updateFanDimmer({ speed: 0, isOn: false })
  }
  
  const handleMax = () => {
    setLocalSpeed(100)
    updateFanDimmer({ speed: 100, isOn: true })
  }
  
  return (
    <div className="workspace-card bg-gradient-to-br from-cream to-cream-dark rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
            <span className={`material-symbols-outlined text-info text-2xl ${
              isOn ? 'animate-spin-slow' : ''
            }`}>
              mode_fan
            </span>
          </div>
          <div>
            <h3 className="font-bold text-coffee-dark">Dimmer Kipas</h3>
            <p className="text-sm text-coffee-medium">Lab Workshop - Kontrol Lokal</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
          isOnline ? 'bg-success/10' : 'bg-coffee-light'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-success' : 'bg-cream-muted'
          }`} />
          <span className={`text-xs font-medium ${
            isOnline ? 'text-success' : 'text-cream-muted'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      {/* Speed Display */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/50 relative">
          {/* Circular progress indicator */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(localSpeed / 100) * 352} 352`}
              className="transition-all duration-300"
            />
          </svg>
          
          {/* Speed value */}
          <div className="relative z-10 text-center">
            <p className="text-3xl font-bold text-coffee-dark">{localSpeed}%</p>
            <p className="text-xs text-coffee-medium">
              {localSpeed === 0 ? 'Mati' : localSpeed < 30 ? 'Pelan' : localSpeed < 70 ? 'Sedang' : 'Kencang'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Slider */}
      <div className="space-y-3 mb-6">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={localSpeed}
          onChange={(e) => handleSpeedChange(Number(e.target.value))}
          onMouseUp={handleSpeedCommit}
          onTouchEnd={handleSpeedCommit}
          className="w-full h-3 bg-coffee-light rounded-full appearance-none cursor-pointer accent-info"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localSpeed}%, #3f3d38 ${localSpeed}%, #3f3d38 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-coffee-medium">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Quick Presets */}
      <div className="flex gap-2 mb-4">
        {[25, 50, 75].map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setLocalSpeed(preset)
              updateFanDimmer({ speed: preset, isOn: true })
              // NOTE: No MQTT - kipas dikendalikan lokal via tombol fisik
            }}
            className={`flex-1 py-2 text-sm rounded-xl font-medium transition-colors ${
              speed === preset
                ? 'bg-info text-white'
                : 'bg-white/50 text-coffee-dark hover:bg-white/70'
            }`}
          >
            {preset}%
          </button>
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button 
          onClick={handleOff}
          className={`flex-1 py-2.5 text-sm rounded-xl font-medium flex items-center justify-center gap-1 transition-colors ${
            !isOn 
              ? 'bg-coffee-medium text-cream' 
              : 'bg-coffee-light text-coffee-dark hover:bg-coffee-medium'
          }`}
        >
          <span className="material-symbols-outlined text-lg">power_settings_new</span>
          Matikan
        </button>
        <button 
          onClick={handleMax}
          className="flex-1 py-2.5 text-sm bg-info text-white rounded-xl font-medium flex items-center justify-center gap-1 hover:bg-info/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">speed</span>
          Maksimal
        </button>
      </div>
      
      {/* Last update */}
      {lastUpdate && (
        <p className="text-xs text-coffee-medium text-center mt-3">
          Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
        </p>
      )}
    </div>
  )
}
