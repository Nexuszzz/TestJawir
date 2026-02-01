// Computer Control Service
// Wrapper for Electron IPC computer control functions

interface ComputerControlResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Check if running in Electron environment
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

/**
 * Get the computer API, with fallback for web environment
 */
function getComputerAPI() {
  if (!isElectron()) {
    throw new Error('Computer control is only available in Electron environment')
  }
  return window.electronAPI.computer
}

// ============================================
// Application Control
// ============================================

/**
 * Open an application by name
 * @param appName - Common app name like "chrome", "vscode", "spotify"
 */
export async function openApplication(appName: string): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    const result = await api.openApp(appName)
    return result
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Execute a shell command
 * @param command - PowerShell command to execute
 */
export async function executeCommand(command: string): Promise<{
  success: boolean
  stdout?: string
  stderr?: string
  error?: string
}> {
  try {
    const api = getComputerAPI()
    return await api.execute(command)
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============================================
// Volume Control
// ============================================

/**
 * Set system volume level
 * @param level - Volume level 0-100
 */
export async function setVolume(level: number): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    const result = await api.setVolume(level)
    return { success: result.success, data: { volume: result.volume }, error: result.error }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Toggle mute/unmute
 */
export async function toggleMute(): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    return await api.toggleMute()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============================================
// Window Management
// ============================================

/**
 * Minimize all windows
 */
export async function minimizeAllWindows(): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    return await api.minimizeAll()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Show desktop (toggle desktop view)
 */
export async function showDesktop(): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    return await api.showDesktop()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============================================
// Power Management
// ============================================

/**
 * Lock the screen
 */
export async function lockScreen(): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    return await api.lockScreen()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Shutdown or restart the computer (with 60s delay)
 * @param restart - If true, restart instead of shutdown
 */
export async function shutdownComputer(restart: boolean = false): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    const result = await api.shutdown(restart)
    return { success: result.success, data: { message: result.message }, error: result.error }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Cancel pending shutdown
 */
export async function cancelShutdown(): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    return await api.cancelShutdown()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Put computer to sleep
 */
export async function sleepComputer(): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    return await api.sleep()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============================================
// Process Management
// ============================================

/**
 * Get list of running processes
 */
export async function getRunningProcesses(): Promise<{
  success: boolean
  processes?: Array<{ Name: string; CPU: number; WorkingSet: number }>
  error?: string
}> {
  try {
    const api = getComputerAPI()
    const result = await api.getProcesses()
    return {
      success: result.success,
      processes: result.processes as Array<{ Name: string; CPU: number; WorkingSet: number }>,
      error: result.error,
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Kill a process by name
 * @param processName - Name of the process to kill (e.g., "chrome.exe")
 */
export async function killProcess(processName: string): Promise<ComputerControlResult> {
  try {
    const api = getComputerAPI()
    return await api.killProcess(processName)
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============================================
// Utilities
// ============================================

/**
 * Take a screenshot and save to Pictures folder
 */
export async function takeScreenshot(): Promise<{
  success: boolean
  path?: string
  error?: string
}> {
  try {
    const api = getComputerAPI()
    return await api.screenshot()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Open a file with default application
 */
export async function openFile(filePath: string): Promise<ComputerControlResult> {
  if (!isElectron()) {
    return { success: false, error: 'Not in Electron environment' }
  }
  return window.electronAPI.openFile(filePath)
}

/**
 * Open a folder in file explorer
 */
export async function openFolder(folderPath: string): Promise<ComputerControlResult> {
  if (!isElectron()) {
    return { success: false, error: 'Not in Electron environment' }
  }
  return window.electronAPI.openFolder(folderPath)
}

/**
 * Open a URL in default browser
 */
export async function openURL(url: string): Promise<ComputerControlResult> {
  if (!isElectron()) {
    // Fallback for web environment
    window.open(url, '_blank')
    return { success: true }
  }
  return window.electronAPI.openURL(url)
}

/**
 * Show desktop notification
 */
export async function showNotification(title: string, body: string): Promise<ComputerControlResult> {
  if (!isElectron()) {
    // Fallback for web environment using Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
      return { success: true }
    }
    return { success: false, error: 'Notifications not supported or not permitted' }
  }
  return window.electronAPI.showNotification({ title, body })
}

/**
 * Get system information
 */
export async function getSystemInfo(): Promise<{
  success: boolean
  info?: {
    platform: string
    arch: string
    version: string
    electronVersion: string
    nodeVersion: string
    chromeVersion: string
  }
  error?: string
}> {
  if (!isElectron()) {
    return { success: false, error: 'Not in Electron environment' }
  }
  try {
    const info = await window.electronAPI.getSystemInfo()
    return { success: true, info }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
