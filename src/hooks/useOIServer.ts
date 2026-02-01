// Hook for Open Interpreter Server Lifecycle Management
// Connects to Electron IPC for OI server control

import { useEffect, useCallback } from 'react'
import { useModeStore } from '@stores/modeStore'

export function useOIServer() {
  const { 
    oiServerStatus, 
    setOIStatus, 
    mode,
    lastOIError,
  } = useModeStore()
  
  // Subscribe to OI status changes from main process
  useEffect(() => {
    if (!window.electronAPI?.oi) return
    
    const unsubscribe = window.electronAPI.oi.onStatusChange((data) => {
      console.log('[useOIServer] Status change:', data)
      
      if (data.status === 'running') {
        setOIStatus('running')
      } else if (data.status === 'stopped') {
        setOIStatus('stopped')
      } else if (data.status === 'error') {
        setOIStatus('error', data.error)
      } else if (data.status === 'starting') {
        setOIStatus('starting')
      }
    })
    
    return unsubscribe
  }, [setOIStatus])
  
  // Auto-start OI server when switching to advanced mode
  useEffect(() => {
    if (mode === 'advanced' && oiServerStatus === 'stopped') {
      startServer()
    }
    // Auto-stop when switching to safe mode (optional - keep running for faster switch back)
    // if (mode === 'safe' && oiServerStatus === 'running') {
    //   stopServer()
    // }
  }, [mode, oiServerStatus])
  
  // Start OI Server
  const startServer = useCallback(async () => {
    if (!window.electronAPI?.oi) {
      console.error('[useOIServer] Electron API not available')
      setOIStatus('error', 'Electron API not available')
      return false
    }
    
    try {
      setOIStatus('starting')
      const result = await window.electronAPI.oi.start()
      
      if (result.success) {
        // Status will be updated via onStatusChange
        return true
      } else {
        setOIStatus('error', result.error || 'Failed to start')
        return false
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setOIStatus('error', errorMsg)
      return false
    }
  }, [setOIStatus])
  
  // Stop OI Server
  const stopServer = useCallback(async () => {
    if (!window.electronAPI?.oi) {
      console.error('[useOIServer] Electron API not available')
      return false
    }
    
    try {
      const result = await window.electronAPI.oi.stop()
      
      if (result.success) {
        setOIStatus('stopped')
        return true
      } else {
        setOIStatus('error', result.error || 'Failed to stop')
        return false
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setOIStatus('error', errorMsg)
      return false
    }
  }, [setOIStatus])
  
  // Check OI Server Health
  const checkHealth = useCallback(async () => {
    if (!window.electronAPI?.oi) {
      return { healthy: false, error: 'Electron API not available' }
    }
    
    try {
      const result = await window.electronAPI.oi.health()
      
      if (result.success && result.status === 'running') {
        setOIStatus('running')
        return { healthy: true, data: result.data }
      } else {
        return { healthy: false, status: result.status }
      }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Health check failed' 
      }
    }
  }, [setOIStatus])
  
  // Get current status from main process
  const refreshStatus = useCallback(async () => {
    if (!window.electronAPI?.oi) return
    
    try {
      const result = await window.electronAPI.oi.status()
      
      if (result.running) {
        setOIStatus('running')
      } else if (result.status === 'stopped') {
        setOIStatus('stopped')
      } else if (result.status === 'starting') {
        setOIStatus('starting')
      } else if (result.status === 'error') {
        setOIStatus('error')
      }
    } catch (error) {
      console.error('[useOIServer] Failed to refresh status:', error)
    }
  }, [setOIStatus])
  
  return {
    // State
    status: oiServerStatus,
    isRunning: oiServerStatus === 'running',
    isStarting: oiServerStatus === 'starting',
    isStopped: oiServerStatus === 'stopped',
    hasError: oiServerStatus === 'error',
    lastError: lastOIError,
    
    // Actions
    startServer,
    stopServer,
    checkHealth,
    refreshStatus,
  }
}
