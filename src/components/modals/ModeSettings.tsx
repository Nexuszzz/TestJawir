// Mode Settings Component
// Settings panel for Mode Aman / Mode Bebas configuration

import { useModeStore, MODE_LABELS, MODE_DESCRIPTIONS, OI_STATUS_LABELS } from '@stores/modeStore'
import { useOIServer } from '@hooks/useOIServer'

export function ModeSettings() {
  const { mode, setMode, oiServerStatus, lastOIError } = useModeStore()
  const { startServer, stopServer, checkHealth, isRunning, isStarting } = useOIServer()
  
  const isSafe = mode === 'safe'
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-cream mb-1">Mode Eksekusi</h3>
        <p className="text-sm text-cream-muted">
          Pilih mode eksekusi untuk mengontrol bagaimana Jawir menjalankan perintah
        </p>
      </div>
      
      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode Aman */}
        <button
          onClick={() => setMode('safe')}
          className={`
            p-4 rounded-xl border-2 text-left transition-all
            ${isSafe 
              ? 'border-success bg-success/10' 
              : 'border-coffee-light/30 bg-coffee-medium hover:border-coffee-light/50'}
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${isSafe ? 'bg-success/20 text-success' : 'bg-coffee-light/20 text-cream-muted'}
            `}>
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${isSafe ? 'text-success' : 'text-cream'}`}>
                  {MODE_LABELS.safe}
                </h4>
                {isSafe && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-sm text-cream-muted mt-1">
                {MODE_DESCRIPTIONS.safe}
              </p>
              <ul className="text-xs text-cream-muted mt-2 space-y-1">
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-success">check</span>
                  Respons instan (&lt;500ms)
                </li>
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-success">check</span>
                  Deterministik & aman
                </li>
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-success">check</span>
                  Cocok untuk demo expo
                </li>
              </ul>
            </div>
          </div>
        </button>
        
        {/* Mode Bebas */}
        <button
          onClick={() => setMode('advanced')}
          className={`
            p-4 rounded-xl border-2 text-left transition-all
            ${!isSafe 
              ? 'border-warning bg-warning/10' 
              : 'border-coffee-light/30 bg-coffee-medium hover:border-coffee-light/50'}
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${!isSafe ? 'bg-warning/20 text-warning' : 'bg-coffee-light/20 text-cream-muted'}
            `}>
              <span className="material-symbols-outlined">science</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${!isSafe ? 'text-warning' : 'text-cream'}`}>
                  {MODE_LABELS.advanced}
                </h4>
                {!isSafe && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-sm text-cream-muted mt-1">
                {MODE_DESCRIPTIONS.advanced}
              </p>
              <ul className="text-xs text-cream-muted mt-2 space-y-1">
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-warning">science</span>
                  Perintah kompleks
                </li>
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-warning">science</span>
                  Natural language execution
                </li>
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-orange-500">warning</span>
                  Perlu konfirmasi user
                </li>
              </ul>
            </div>
          </div>
        </button>
      </div>
      
      {/* OI Server Status (only shown in advanced mode) */}
      {!isSafe && (
        <div className="p-4 rounded-xl bg-coffee-medium border border-coffee-light/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-cream">terminal</span>
              <h4 className="font-medium text-cream">Open Interpreter Server</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className={`
                size-2.5 rounded-full
                ${isRunning ? 'bg-success animate-pulse' : 
                  isStarting ? 'bg-warning animate-pulse' :
                  oiServerStatus === 'error' ? 'bg-error' : 'bg-gray-500'}
              `} />
              <span className={`text-sm ${
                isRunning ? 'text-success' :
                isStarting ? 'text-warning' :
                oiServerStatus === 'error' ? 'text-error' : 'text-cream-muted'
              }`}>
                {OI_STATUS_LABELS[oiServerStatus]}
              </span>
            </div>
          </div>
          
          {/* Error message */}
          {lastOIError && (
            <div className="mb-3 p-2 rounded-lg bg-error/10 border border-error/30 text-sm text-error">
              {lastOIError}
            </div>
          )}
          
          {/* Server Controls */}
          <div className="flex items-center gap-2">
            {!isRunning && !isStarting && (
              <button
                onClick={startServer}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Start Server
              </button>
            )}
            
            {isStarting && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 text-warning cursor-wait"
              >
                <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
                Starting...
              </button>
            )}
            
            {isRunning && (
              <>
                <button
                  onClick={stopServer}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">stop</span>
                  Stop Server
                </button>
                <button
                  onClick={checkHealth}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">monitor_heart</span>
                  Check Health
                </button>
              </>
            )}
          </div>
          
          {/* Info */}
          <p className="text-xs text-cream-muted mt-3">
            Server berjalan di <code className="px-1 py-0.5 rounded bg-coffee-dark">http://127.0.0.1:8765</code>
          </p>
        </div>
      )}
      
      {/* Warning for Advanced Mode */}
      {!isSafe && (
        <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-warning">warning</span>
            <div className="text-sm">
              <p className="text-cream font-medium">Perhatian</p>
              <p className="text-cream-muted mt-1">
                Mode Bebas memungkinkan eksekusi perintah yang lebih kompleks. 
                Semua perintah berbahaya akan meminta konfirmasi sebelum dijalankan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
