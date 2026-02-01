// Mode Store - Manages app mode (safe/advanced) and OI server status
// Safe mode: Only IPC commands (80% of use cases)
// Advanced mode: Open Interpreter enabled for complex tasks (20%)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppMode = 'safe' | 'advanced'
export type OIServerStatus = 'unknown' | 'starting' | 'running' | 'stopped' | 'error'

interface ModeState {
  // State
  mode: AppMode
  oiServerStatus: OIServerStatus
  lastOIError: string | null
  
  // Actions
  setMode: (mode: AppMode) => void
  setOIStatus: (status: OIServerStatus, error?: string) => void
  toggleMode: () => void
  
  // Computed helpers
  isAdvancedMode: () => boolean
  isOIReady: () => boolean
}

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      // Initial state - default to safe mode
      mode: 'safe',
      oiServerStatus: 'unknown',
      lastOIError: null,
      
      // Set mode directly
      setMode: (mode) => set({ mode }),
      
      // Set OI server status with optional error
      setOIStatus: (status, error) => set({ 
        oiServerStatus: status, 
        lastOIError: error || null 
      }),
      
      // Toggle between modes
      toggleMode: () => set((state) => ({ 
        mode: state.mode === 'safe' ? 'advanced' : 'safe' 
      })),
      
      // Check if in advanced mode
      isAdvancedMode: () => get().mode === 'advanced',
      
      // Check if OI is ready to use
      isOIReady: () => get().oiServerStatus === 'running',
    }),
    {
      name: 'jawir-mode-storage',
      // Only persist mode, not server status
      partialize: (state) => ({ mode: state.mode }),
    }
  )
)

// Mode labels for UI
export const MODE_LABELS: Record<AppMode, string> = {
  safe: 'Mode Aman',
  advanced: 'Mode Bebas',
}

// Mode descriptions
export const MODE_DESCRIPTIONS: Record<AppMode, string> = {
  safe: 'Hanya menjalankan perintah yang sudah terdaftar (cepat & stabil)',
  advanced: 'Bisa menjalankan perintah kompleks dengan Open Interpreter (perlu konfirmasi)',
}

// OI Status labels
export const OI_STATUS_LABELS: Record<OIServerStatus, string> = {
  unknown: 'Tidak diketahui',
  starting: 'Memulai...',
  running: 'Berjalan',
  stopped: 'Berhenti',
  error: 'Error',
}
