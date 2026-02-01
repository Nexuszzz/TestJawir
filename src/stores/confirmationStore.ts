// Global Confirmation Store
// Allows any part of the app to trigger confirmation modals
// Used by mode-router and tool router for dangerous actions

import { create } from 'zustand'
import type { RiskLevel } from '@components/modals/ConfirmActionModal'

export interface ConfirmationRequest {
  title: string
  description: string
  action: string
  details?: string[]
  riskLevel: RiskLevel
  countdownSeconds?: number
}

interface ConfirmationState {
  isOpen: boolean
  request: ConfirmationRequest | null
  resolve: ((confirmed: boolean) => void) | null
  
  // Actions
  requestConfirmation: (request: ConfirmationRequest) => Promise<boolean>
  confirm: () => void
  cancel: () => void
  reset: () => void
}

export const useConfirmationStore = create<ConfirmationState>((set, get) => ({
  isOpen: false,
  request: null,
  resolve: null,
  
  requestConfirmation: (request) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        request,
        resolve,
      })
    })
  },
  
  confirm: () => {
    const { resolve } = get()
    if (resolve) resolve(true)
    set({ isOpen: false, request: null, resolve: null })
  },
  
  cancel: () => {
    const { resolve } = get()
    if (resolve) resolve(false)
    set({ isOpen: false, request: null, resolve: null })
  },
  
  reset: () => {
    set({ isOpen: false, request: null, resolve: null })
  },
}))

// Helper function to request confirmation from anywhere
export async function requestConfirmation(params: {
  title: string
  description: string
  action: string
  details?: string[]
  riskLevel?: RiskLevel
  countdownSeconds?: number
}): Promise<boolean> {
  const store = useConfirmationStore.getState()
  
  return store.requestConfirmation({
    title: params.title,
    description: params.description,
    action: params.action,
    details: params.details,
    riskLevel: params.riskLevel || 'medium',
    countdownSeconds: params.countdownSeconds,
  })
}
