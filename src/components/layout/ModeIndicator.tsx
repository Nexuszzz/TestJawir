// Mode Indicator Component
// Shows current app mode (safe/advanced) in header
// Clickable to toggle between modes

import { useModeStore, MODE_LABELS, OI_STATUS_LABELS } from '@stores/modeStore'

export function ModeIndicator() {
  const { mode, oiServerStatus, toggleMode } = useModeStore()
  
  const isSafe = mode === 'safe'
  const isOIRunning = oiServerStatus === 'running'
  
  return (
    <button
      onClick={toggleMode}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium
        transition-all duration-200 border
        ${isSafe 
          ? 'bg-success/10 text-success border-success/30 hover:bg-success/20' 
          : 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'}
      `}
      title={isSafe 
        ? 'Mode Aman aktif - Klik untuk Mode Bebas' 
        : 'Mode Bebas aktif - Klik untuk Mode Aman'}
    >
      {/* Icon */}
      <span className="material-symbols-outlined text-base">
        {isSafe ? 'verified_user' : 'science'}
      </span>
      
      {/* Label */}
      <span className="hidden sm:inline">{MODE_LABELS[mode]}</span>
      
      {/* OI Status indicator (only in advanced mode) */}
      {!isSafe && (
        <span 
          className={`size-2 rounded-full ${
            isOIRunning 
              ? 'bg-success animate-pulse' 
              : oiServerStatus === 'starting'
                ? 'bg-warning animate-pulse'
                : 'bg-gray-400'
          }`}
          title={`Open Interpreter: ${OI_STATUS_LABELS[oiServerStatus]}`}
        />
      )}
    </button>
  )
}

// Compact version for mobile
export function ModeIndicatorCompact() {
  const { mode, oiServerStatus, toggleMode } = useModeStore()
  
  const isSafe = mode === 'safe'
  const isOIRunning = oiServerStatus === 'running'
  
  return (
    <button
      onClick={toggleMode}
      className={`
        flex items-center justify-center size-9 rounded-xl
        transition-all duration-200 border
        ${isSafe 
          ? 'bg-success/10 text-success border-success/30' 
          : 'bg-warning/10 text-warning border-warning/30'}
      `}
      title={`${MODE_LABELS[mode]} - Klik untuk toggle`}
    >
      <span className="material-symbols-outlined text-lg">
        {isSafe ? 'verified_user' : 'science'}
      </span>
      
      {/* Small dot for OI status */}
      {!isSafe && (
        <span 
          className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white ${
            isOIRunning ? 'bg-success' : 'bg-gray-400'
          }`}
        />
      )}
    </button>
  )
}
