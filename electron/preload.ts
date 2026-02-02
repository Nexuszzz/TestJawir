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
  getPath: (name: string) => ipcRenderer.invoke('system:getPath', name),

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

  // KiCad MCP Server Control
  kicad: {
    checkStatus: () => ipcRenderer.invoke('kicad:checkStatus'),
    createProject: (name: string, path: string) => ipcRenderer.invoke('kicad:createProject', name, path),
    createSchematic: (name: string) => ipcRenderer.invoke('kicad:createSchematic', name),
    addSchematicComponent: (params: {
      schematicPath: string
      symbol: string
      reference: string
      value?: string
      position: { x: number; y: number }
    }) => ipcRenderer.invoke('kicad:addSchematicComponent', params),
    addWire: (params: {
      start: { x: number; y: number }
      end: { x: number; y: number }
    }) => ipcRenderer.invoke('kicad:addWire', params),
    addSchematicConnection: (params: {
      schematicPath: string
      sourceRef: string
      sourcePin: string
      targetRef: string
      targetPin: string
    }) => ipcRenderer.invoke('kicad:addSchematicConnection', params),
    addSchematicNetLabel: (params: {
      schematicPath: string
      netName: string
      position: number[]
    }) => ipcRenderer.invoke('kicad:addSchematicNetLabel', params),
    launchUI: (projectPath?: string) => ipcRenderer.invoke('kicad:launchUI', projectPath),
    openProject: (path: string) => ipcRenderer.invoke('kicad:openProject', path),
    writeSchematic: (params: {
      projectPath: string
      schematicName: string
      content: string
    }) => ipcRenderer.invoke('kicad:writeSchematic', params),
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

// Type definitions are in src/types/electron.d.ts
// This export is needed for the file to be treated as a module
export { }
