// Toast Notification Hook
// Provides toast notifications for the app

import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newToast: Toast = { ...toast, id }
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))
    
    // Auto remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
    
    return id
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  
  clearToasts: () => {
    set({ toasts: [] })
  },
}))

/**
 * Hook for showing toast notifications
 */
export function useToast() {
  const { addToast, removeToast, clearToasts } = useToastStore()
  
  const toast = {
    success: (title: string, message?: string) => 
      addToast({ type: 'success', title, message }),
    
    error: (title: string, message?: string) => 
      addToast({ type: 'error', title, message, duration: 8000 }),
    
    warning: (title: string, message?: string) => 
      addToast({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) => 
      addToast({ type: 'info', title, message }),
    
    custom: (toast: Omit<Toast, 'id'>) => 
      addToast(toast),
    
    dismiss: (id: string) => 
      removeToast(id),
    
    dismissAll: () => 
      clearToasts(),
  }
  
  return toast
}

/**
 * Play notification sound
 */
export function playNotificationSound(type: 'success' | 'error' | 'alert' = 'success') {
  try {
    // Use Web Audio API for notification sounds
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    
    const ctx = new AudioContextClass()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Different sounds for different types
    switch (type) {
      case 'success':
        oscillator.frequency.value = 880 // A5
        oscillator.type = 'sine'
        gainNode.gain.value = 0.1
        break
      case 'error':
        oscillator.frequency.value = 220 // A3
        oscillator.type = 'square'
        gainNode.gain.value = 0.1
        break
      case 'alert':
        oscillator.frequency.value = 440 // A4
        oscillator.type = 'triangle'
        gainNode.gain.value = 0.15
        break
    }
    
    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    oscillator.stop(ctx.currentTime + 0.3)
    
  } catch (e) {
    console.warn('Failed to play notification sound:', e)
  }
}

/**
 * Show desktop notification (if supported)
 */
export async function showDesktopNotification(
  title: string, 
  body: string, 
  options?: { icon?: string; requireInteraction?: boolean }
): Promise<boolean> {
  // Try Electron notification first
  if (window.electronAPI?.showNotification) {
    const result = await window.electronAPI.showNotification({
      title,
      body,
      icon: options?.icon,
    }) as unknown
    // Handle both object and boolean return types
    if (typeof result === 'object' && result !== null && 'success' in result) {
      return (result as { success: boolean }).success
    }
    return !!result
  }
  
  // Fallback to Web Notification API
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: options?.icon })
      return true
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification(title, { body, icon: options?.icon })
        return true
      }
    }
  }
  
  return false
}
