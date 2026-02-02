/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_DEEPGRAM_API_KEY: string
  readonly VITE_MQTT_BROKER_URL: string
  readonly VITE_MQTT_USERNAME: string
  readonly VITE_MQTT_PASSWORD: string
  readonly VITE_WHATSAPP_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Computer Control API types
interface ComputerAPI {
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
  getProcesses: () => Promise<{ success: boolean; processes?: unknown[]; error?: string }>
  killProcess: (processName: string) => Promise<{ success: boolean; error?: string }>
  screenshot: () => Promise<{ success: boolean; path?: string; error?: string }>
}

// Open Interpreter Server API types
interface OIAPI {
  start: () => Promise<{ success: boolean; status: string; message?: string; error?: string }>
  stop: () => Promise<{ success: boolean; status: string; message?: string; error?: string }>
  status: () => Promise<{ status: string; running: boolean }>
  health: () => Promise<{ success: boolean; status: string; data?: unknown }>
  onStatusChange: (callback: (data: { status: string; error?: string }) => void) => () => void
}

// KiCad MCP Server API types
interface KiCadAPI {
  checkStatus: () => Promise<{ running: boolean; message: string }>
  createProject: (name: string, path: string) => Promise<{ success: boolean; message?: string }>
  createSchematic: (name: string) => Promise<{ success: boolean; message?: string; path?: string }>
  addSchematicComponent: (params: {
    schematicPath: string
    symbol: string
    reference: string
    value?: string
    position: { x: number; y: number }
  }) => Promise<{ success: boolean; message?: string }>
  addWire: (params: {
    start: { x: number; y: number }
    end: { x: number; y: number }
  }) => Promise<{ success: boolean; message?: string }>
  addSchematicConnection: (params: {
    schematicPath: string
    sourceRef: string
    sourcePin: string
    targetRef: string
    targetPin: string
  }) => Promise<{ success: boolean; message?: string }>
  addSchematicNetLabel: (params: {
    schematicPath: string
    netName: string
    position: number[]
  }) => Promise<{ success: boolean; message?: string }>
  launchUI: (projectPath?: string) => Promise<{ success: boolean; message?: string }>
  openProject: (path: string) => Promise<{ success: boolean; message?: string }>
  writeSchematic: (params: {
    projectPath: string
    schematicName: string
    content: string
  }) => Promise<{ success: boolean; message?: string }>
}

// Electron API exposed via preload
interface ElectronAPI {
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
  getPath: (name: string) => Promise<string>
  computer: ComputerAPI
  kicad: KiCadAPI
  oi: OIAPI
  onMqttMessage: (callback: (data: unknown) => void) => () => void
  onWakeWordDetected: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export { }

