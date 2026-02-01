import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File System
  openFile: (filePath: string) => ipcRenderer.invoke('file:open', filePath),
  openFolder: (folderPath: string) => ipcRenderer.invoke('folder:open', folderPath),
  
  // App Control
  openApp: (appPath: string) => ipcRenderer.invoke('app:open', appPath),
  openURL: (url: string) => ipcRenderer.invoke('url:open', url),
  
  // Notifications
  showNotification: (options: { title: string; body: string; icon?: string }) => 
    ipcRenderer.invoke('notify:show', options),
  
  // System Info
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  
  // Computer Control
  computer: {
    openApp: (appName: string) => ipcRenderer.invoke('computer:openApp', appName),
    execute: (command: string) => ipcRenderer.invoke('computer:execute', command),
    setVolume: (level: number) => ipcRenderer.invoke('computer:setVolume', level),
    toggleMute: () => ipcRenderer.invoke('computer:toggleMute'),
    minimizeAll: () => ipcRenderer.invoke('computer:minimizeAll'),
    showDesktop: () => ipcRenderer.invoke('computer:showDesktop'),
    lockScreen: () => ipcRenderer.invoke('computer:lockScreen'),
    shutdown: (restart?: boolean) => ipcRenderer.invoke('computer:shutdown', restart),
    cancelShutdown: () => ipcRenderer.invoke('computer:cancelShutdown'),
    sleep: () => ipcRenderer.invoke('computer:sleep'),
    getProcesses: () => ipcRenderer.invoke('computer:getProcesses'),
    killProcess: (processName: string) => ipcRenderer.invoke('computer:killProcess', processName),
    screenshot: () => ipcRenderer.invoke('computer:screenshot'),
  },
  
  // Open Interpreter Server Control
  oi: {
    start: () => ipcRenderer.invoke('oi:start'),
    stop: () => ipcRenderer.invoke('oi:stop'),
    status: () => ipcRenderer.invoke('oi:status'),
    health: () => ipcRenderer.invoke('oi:health'),
    onStatusChange: (callback: (data: { status: string; error?: string }) => void) => {
      ipcRenderer.on('oi:status', (_event, data) => callback(data))
      return () => ipcRenderer.removeAllListeners('oi:status')
    },
  },
  
  // Event listeners for main process events
  onMqttMessage: (callback: (data: any) => void) => {
    ipcRenderer.on('mqtt:message', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('mqtt:message')
  },
  
  onWakeWordDetected: (callback: () => void) => {
    ipcRenderer.on('wakeword:detected', () => callback())
    return () => ipcRenderer.removeAllListeners('wakeword:detected')
  },
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
      openFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>
      openApp: (appPath: string) => Promise<{ success: boolean; error?: string }>
      openURL: (url: string) => Promise<{ success: boolean; error?: string }>
      showNotification: (options: { title: string; body: string; icon?: string }) => Promise<{ success: boolean; error?: string }>
      getSystemInfo: () => Promise<{
        platform: string
        arch: string
        version: string
        electronVersion: string
        nodeVersion: string
        chromeVersion: string
      }>
      computer: {
        openApp: (appName: string) => Promise<{ success: boolean; app?: string; error?: string }>
        execute: (command: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>
        setVolume: (level: number) => Promise<{ success: boolean; volume?: number; error?: string }>
        toggleMute: () => Promise<{ success: boolean; error?: string }>
        minimizeAll: () => Promise<{ success: boolean; error?: string }>
        showDesktop: () => Promise<{ success: boolean; error?: string }>
        lockScreen: () => Promise<{ success: boolean; error?: string }>
        shutdown: (restart?: boolean) => Promise<{ success: boolean; message?: string; error?: string }>
        cancelShutdown: () => Promise<{ success: boolean; error?: string }>
        sleep: () => Promise<{ success: boolean; error?: string }>
        getProcesses: () => Promise<{ success: boolean; processes?: any[]; error?: string }>
        killProcess: (processName: string) => Promise<{ success: boolean; error?: string }>
        screenshot: () => Promise<{ success: boolean; path?: string; error?: string }>
      }
      oi: {
        start: () => Promise<{ success: boolean; status: string; message?: string; error?: string }>
        stop: () => Promise<{ success: boolean; status: string; message?: string; error?: string }>
        status: () => Promise<{ status: string; running: boolean }>
        health: () => Promise<{ success: boolean; status: string; data?: any }>
        onStatusChange: (callback: (data: { status: string; error?: string }) => void) => () => void
      }
      onMqttMessage: (callback: (data: any) => void) => () => void
      onWakeWordDetected: (callback: () => void) => () => void
    }
  }
}
