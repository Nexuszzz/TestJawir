import { useIoTStore } from '@stores/iotStore'

export function FireDetectionCard() {
  const { fireDetection, sendCommand } = useIoTStore()
  
  const {
    temperature,
    humidity,
    gasLevel,
    flameDetected,
    alarmActive,
    isOnline,
    lastUpdate,
  } = fireDetection
  
  // Determine alert status
  const isAlert = flameDetected || alarmActive || gasLevel > 70
  
  return (
    <div className={`
      workspace-card rounded-2xl p-6 transition-all duration-300
      ${isAlert 
        ? 'bg-gradient-to-br from-error/20 to-error/10 border-2 border-error/50 alarm-pulse' 
        : 'bg-gradient-to-br from-cream to-cream-dark'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isAlert ? 'bg-error/20' : 'bg-error/10'
          }`}>
            <span className={`material-symbols-outlined text-2xl ${
              isAlert ? 'text-error animate-pulse' : 'text-error'
            }`}>
              local_fire_department
            </span>
          </div>
          <div>
            <h3 className={`font-bold ${isAlert ? 'text-error' : 'text-coffee-dark'}`}>
              Fire Detection
            </h3>
            <p className="text-sm text-coffee-medium">Lab Workshop</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
          isAlert 
            ? 'bg-error/20' 
            : isOnline 
              ? 'bg-success/10' 
              : 'bg-coffee-light'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isAlert ? 'bg-error animate-pulse' : isOnline ? 'bg-success' : 'bg-cream-muted'
          }`} />
          <span className={`text-xs font-medium ${
            isAlert ? 'text-error' : isOnline ? 'text-success' : 'text-cream-muted'
          }`}>
            {isAlert ? 'ALARM!' : isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      {/* Alert Banner */}
      {isAlert && (
        <div className="bg-error text-white rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
            <div>
              <p className="font-bold">BAHAYA TERDETEKSI!</p>
              <p className="text-sm opacity-90">
                {flameDetected && 'Api terdeteksi! '}
                {gasLevel > 70 && 'Gas level tinggi! '}
              </p>
            </div>
          </div>
          <button 
            onClick={() => sendCommand('fire', 'BUZZER_OFF')}
            className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            Matikan Alarm
          </button>
        </div>
      )}
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Temperature */}
        <div className="bg-white/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-coffee-medium text-sm mb-1">
            <span className="material-symbols-outlined text-base">thermostat</span>
            Suhu
          </div>
          <p className={`text-2xl font-bold ${
            (temperature ?? 0) > 40 ? 'text-error' : 'text-coffee-dark'
          }`}>
            {temperature !== null ? `${temperature}°C` : '--'}
          </p>
        </div>
        
        {/* Humidity */}
        <div className="bg-white/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-coffee-medium text-sm mb-1">
            <span className="material-symbols-outlined text-base">humidity_percentage</span>
            Kelembaban
          </div>
          <p className="text-2xl font-bold text-coffee-dark">
            {humidity !== null ? `${humidity}%` : '--'}
          </p>
        </div>
        
        {/* Gas Level */}
        <div className="bg-white/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-coffee-medium text-sm mb-1">
            <span className="material-symbols-outlined text-base">gas_meter</span>
            Gas Level
          </div>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${
              gasLevel > 70 ? 'text-error' : gasLevel > 40 ? 'text-warning' : 'text-success'
            }`}>
              {gasLevel > 70 ? 'Tinggi' : gasLevel > 40 ? 'Sedang' : 'Normal'}
            </p>
          </div>
          {/* Gas level bar */}
          <div className="w-full h-2 bg-coffee-light rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                gasLevel > 70 ? 'bg-error' : gasLevel > 40 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${gasLevel}%` }}
            />
          </div>
        </div>
        
        {/* Flame Status */}
        <div className="bg-white/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-coffee-medium text-sm mb-1">
            <span className="material-symbols-outlined text-base">whatshot</span>
            Status Api
          </div>
          <p className={`text-2xl font-bold ${
            flameDetected ? 'text-error' : 'text-success'
          }`}>
            {flameDetected ? 'TERDETEKSI!' : 'Aman'}
          </p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button 
          onClick={() => sendCommand('fire', 'BUZZER_ON')}
          className="flex-1 py-2 text-sm bg-error text-white rounded-xl font-medium flex items-center justify-center gap-1 hover:bg-error/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">notifications_active</span>
          Test Alarm
        </button>
        <button 
          onClick={() => sendCommand('fire', 'BUZZER_OFF')}
          className="flex-1 py-2 text-sm bg-coffee-light text-coffee-dark rounded-xl font-medium flex items-center justify-center gap-1 hover:bg-coffee-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">notifications_off</span>
          Matikan
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
