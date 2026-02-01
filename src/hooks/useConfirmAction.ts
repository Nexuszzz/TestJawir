// Hook for action confirmation flow
// Manages the modal confirmation for dangerous actions

import { useState, useCallback } from 'react'
import { RiskLevel } from '@services/mode-router'

export interface PendingAction {
  id: string
  title: string
  description: string
  riskLevel: RiskLevel
  actionCode?: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function useConfirmAction() {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Request confirmation for an action
   * Returns a promise that resolves to true if confirmed, false if cancelled
   */
  const requestConfirmation = useCallback(
    (params: {
      title: string
      description: string
      riskLevel: RiskLevel
      actionCode?: string
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        setPendingAction({
          id,
          title: params.title,
          description: params.description,
          riskLevel: params.riskLevel,
          actionCode: params.actionCode,
          onConfirm: async () => {
            setIsProcessing(true)
            resolve(true)
            setPendingAction(null)
            setIsProcessing(false)
          },
          onCancel: () => {
            resolve(false)
            setPendingAction(null)
          }
        })
      })
    },
    []
  )

  /**
   * Confirm the pending action
   */
  const confirm = useCallback(async () => {
    if (pendingAction) {
      await pendingAction.onConfirm()
    }
  }, [pendingAction])

  /**
   * Cancel the pending action
   */
  const cancel = useCallback(() => {
    if (pendingAction) {
      pendingAction.onCancel()
    }
  }, [pendingAction])

  /**
   * Check if there's a pending action
   */
  const hasPendingAction = pendingAction !== null

  return {
    pendingAction,
    isProcessing,
    hasPendingAction,
    requestConfirmation,
    confirm,
    cancel
  }
}

// Confirmation timeout by risk level (in seconds)
export const CONFIRMATION_TIMEOUTS: Record<RiskLevel, number> = {
  low: 0,      // No auto-cancel
  medium: 30,  // 30 seconds
  high: 15,    // 15 seconds
  critical: 10 // 10 seconds - must act fast
}

// Risk level colors for UI
export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30'
  },
  medium: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30'
  },
  high: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/30'
  },
  critical: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/30'
  }
}

// Risk level labels in Indonesian
export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Risiko Rendah',
  medium: 'Risiko Sedang',
  high: 'Risiko Tinggi',
  critical: 'Risiko Kritis'
}

// Risk level icons
export const RISK_ICONS: Record<RiskLevel, string> = {
  low: 'check_circle',
  medium: 'info',
  high: 'warning',
  critical: 'dangerous'
}
