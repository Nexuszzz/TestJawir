// Confirm Action Modal
// Safety modal for dangerous actions - requires user confirmation
// Used for: file operations, system commands, send messages, etc.

import { useState } from 'react'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface ConfirmActionProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel?: () => void
  
  // Action details
  title: string
  description: string
  action: string
  details?: string[]
  
  // Risk level affects styling
  riskLevel: RiskLevel
  
  // Optional countdown before confirm is enabled
  countdownSeconds?: number
}

const riskStyles: Record<RiskLevel, { bg: string; border: string; icon: string; text: string }> = {
  low: {
    bg: 'bg-info/10',
    border: 'border-info/30',
    icon: 'info',
    text: 'text-info',
  },
  medium: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    icon: 'warning',
    text: 'text-warning',
  },
  high: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'error',
    text: 'text-orange-500',
  },
  critical: {
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    icon: 'dangerous',
    text: 'text-danger',
  },
}

const riskLabels: Record<RiskLevel, string> = {
  low: 'Risiko Rendah',
  medium: 'Risiko Sedang',
  high: 'Risiko Tinggi',
  critical: 'Risiko Kritis',
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  description,
  action,
  details,
  riskLevel,
  countdownSeconds = 0,
}: ConfirmActionProps) {
  const [countdown, setCountdown] = useState(countdownSeconds)
  const [confirmed, setConfirmed] = useState(false)
  
  const styles = riskStyles[riskLevel]
  
  // Handle countdown for high-risk actions
  useState(() => {
    if (isOpen && countdownSeconds > 0) {
      setCountdown(countdownSeconds)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  })
  
  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm()
    setTimeout(() => {
      setConfirmed(false)
      onClose()
    }, 500)
  }
  
  const handleCancel = () => {
    if (onCancel) onCancel()
    onClose()
  }
  
  if (!isOpen) return null
  
  const canConfirm = countdown === 0
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className={`bg-coffee-dark border-2 ${styles.border} rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95`}>
        {/* Header */}
        <div className={`${styles.bg} px-6 py-4 rounded-t-2xl border-b ${styles.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-2xl ${styles.text}`}>
                {styles.icon}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-cream">{title}</h2>
              <span className={`text-xs font-medium ${styles.text} uppercase tracking-wide`}>
                {riskLabels[riskLevel]}
              </span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-cream/80">{description}</p>
          
          {/* Action details */}
          <div className={`${styles.bg} rounded-xl p-4 border ${styles.border}`}>
            <p className="text-xs text-cream/50 uppercase tracking-wide mb-2">Aksi yang akan dilakukan:</p>
            <p className="text-cream font-medium">{action}</p>
            
            {details && details.length > 0 && (
              <ul className="mt-3 space-y-1">
                {details.map((detail, idx) => (
                  <li key={idx} className="text-sm text-cream/70 flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-0.5">chevron_right</span>
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Warning for high risk */}
          {(riskLevel === 'high' || riskLevel === 'critical') && (
            <div className="flex items-start gap-3 p-3 bg-danger/10 rounded-lg border border-danger/20">
              <span className="material-symbols-outlined text-danger">warning</span>
              <p className="text-sm text-danger/90">
                Aksi ini tidak dapat dibatalkan. Pastikan Anda yakin sebelum melanjutkan.
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 px-4 text-sm text-cream/70 bg-coffee-light/20 
                       hover:bg-coffee-light/30 rounded-xl font-medium transition-colors
                       flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            Batalkan
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || confirmed}
            className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all
                       flex items-center justify-center gap-2
                       ${canConfirm 
                         ? riskLevel === 'critical'
                           ? 'bg-danger text-white hover:bg-danger/90'
                           : riskLevel === 'high'
                             ? 'bg-orange-500 text-white hover:bg-orange-500/90'
                             : 'bg-primary text-coffee-dark hover:bg-primary/90'
                         : 'bg-coffee-light/30 text-cream/40 cursor-not-allowed'
                       }`}
          >
            {confirmed ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                Memproses...
              </>
            ) : canConfirm ? (
              <>
                <span className="material-symbols-outlined text-lg">check</span>
                Ya, Lanjutkan
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">hourglass_empty</span>
                Tunggu {countdown}s
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for easy usage
export function useConfirmAction() {
  const [state, setState] = useState<{
    isOpen: boolean
    props: Omit<ConfirmActionProps, 'isOpen' | 'onClose' | 'onConfirm' | 'onCancel'> | null
    resolve: ((confirmed: boolean) => void) | null
  }>({
    isOpen: false,
    props: null,
    resolve: null,
  })
  
  const confirm = (
    props: Omit<ConfirmActionProps, 'isOpen' | 'onClose' | 'onConfirm' | 'onCancel'>
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        props,
        resolve,
      })
    })
  }
  
  const handleConfirm = () => {
    state.resolve?.(true)
    setState({ isOpen: false, props: null, resolve: null })
  }
  
  const handleCancel = () => {
    state.resolve?.(false)
    setState({ isOpen: false, props: null, resolve: null })
  }
  
  const modal = state.isOpen && state.props ? (
    <ConfirmActionModal
      isOpen={state.isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...state.props}
    />
  ) : null
  
  return { confirm, modal }
}

export default ConfirmActionModal
