// Mode Router - Decides between IPC (safe) and Open Interpreter (advanced)
// This is the brain of the dual-mode architecture

import { useModeStore } from '@stores/modeStore'
import * as computerControl from './computer-control'
import * as openInterpreter from './open-interpreter'

// Action categories and their preferred execution mode
export type ActionCategory = 
  | 'app_control'      // Open/close apps - IPC
  | 'volume_control'   // Volume/mute - IPC  
  | 'system_control'   // Lock/shutdown/restart - IPC (with confirm)
  | 'window_control'   // Minimize/maximize/arrange - IPC
  | 'screenshot'       // Take screenshot - IPC
  | 'file_operation'   // File CRUD - IPC for basic, OI for complex
  | 'command_exec'     // Execute commands - IPC for known, OI for unknown
  | 'web_browse'       // Browser control - IPC
  | 'complex_task'     // Multi-step tasks - OI only
  | 'code_execution'   // Run/analyze code - OI only
  | 'unknown'          // Unrecognized - depends on mode

// Risk levels for actions
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// Action definition
export interface Action {
  category: ActionCategory
  name: string
  params: Record<string, unknown>
  riskLevel: RiskLevel
  requiresConfirmation: boolean
}

// Route result - which mode to use
export interface RouteResult {
  mode: 'ipc' | 'oi' | 'blocked'
  reason: string
  requiresConfirmation: boolean
  riskLevel: RiskLevel
}

// IPC-only actions (Mode Aman default)
const IPC_ONLY_ACTIONS: ActionCategory[] = [
  'app_control',
  'volume_control', 
  'window_control',
  'screenshot',
  'web_browse'
]

// Actions that require confirmation regardless of mode
const CONFIRM_REQUIRED_CATEGORIES: ActionCategory[] = [
  'system_control',  // Lock, shutdown, restart
  'file_operation',  // Delete files
  'command_exec'     // Execute arbitrary commands
]

// Actions that always use OI (if available)
const OI_ONLY_ACTIONS: ActionCategory[] = [
  'complex_task',
  'code_execution'
]

// Risk assessment by category
const RISK_BY_CATEGORY: Record<ActionCategory, RiskLevel> = {
  app_control: 'low',
  volume_control: 'low',
  window_control: 'low',
  screenshot: 'low',
  web_browse: 'low',
  file_operation: 'medium',
  command_exec: 'high',
  system_control: 'critical',
  complex_task: 'high',
  code_execution: 'high',
  unknown: 'medium'
}

/**
 * Route an action to the appropriate execution mode
 */
export function routeAction(action: Action): RouteResult {
  const { mode: appMode, isOIReady } = useModeStore.getState()
  const isSafeMode = appMode === 'safe'
  
  // Get risk level from category
  const riskLevel = action.riskLevel || RISK_BY_CATEGORY[action.category] || 'medium'
  
  // Check if confirmation is required
  const requiresConfirmation = 
    action.requiresConfirmation || 
    CONFIRM_REQUIRED_CATEGORIES.includes(action.category) ||
    riskLevel === 'high' ||
    riskLevel === 'critical'
  
  // Route based on category
  if (IPC_ONLY_ACTIONS.includes(action.category)) {
    // Always use IPC for these
    return {
      mode: 'ipc',
      reason: 'Perintah sederhana - menggunakan IPC langsung',
      requiresConfirmation,
      riskLevel
    }
  }
  
  if (OI_ONLY_ACTIONS.includes(action.category)) {
    // Must use OI for complex tasks
    if (isSafeMode) {
      return {
        mode: 'blocked',
        reason: 'Tugas kompleks memerlukan Mode Bebas',
        requiresConfirmation: false,
        riskLevel
      }
    }
    
    if (!isOIReady()) {
      return {
        mode: 'blocked',
        reason: 'Open Interpreter tidak tersedia',
        requiresConfirmation: false,
        riskLevel
      }
    }
    
    return {
      mode: 'oi',
      reason: 'Tugas kompleks - menggunakan Open Interpreter',
      requiresConfirmation: true, // Always confirm OI actions
      riskLevel
    }
  }
  
  // For other categories, decide based on mode
  if (isSafeMode) {
    // In safe mode, try IPC first
    if (canExecuteWithIPC(action)) {
      return {
        mode: 'ipc',
        reason: 'Mode Aman - menggunakan IPC',
        requiresConfirmation,
        riskLevel
      }
    } else {
      return {
        mode: 'blocked',
        reason: 'Perintah ini memerlukan Mode Bebas',
        requiresConfirmation: false,
        riskLevel
      }
    }
  } else {
    // In advanced mode, prefer OI for flexibility but fall back to IPC
    if (!isOIReady()) {
      // OI not ready, use IPC if possible
      if (canExecuteWithIPC(action)) {
        return {
          mode: 'ipc',
          reason: 'OI tidak tersedia - fallback ke IPC',
          requiresConfirmation,
          riskLevel
        }
      } else {
        return {
          mode: 'blocked',
          reason: 'OI tidak tersedia dan IPC tidak mendukung perintah ini',
          requiresConfirmation: false,
          riskLevel
        }
      }
    }
    
    // OI is ready - use it for complex commands
    if (isComplexCommand(action)) {
      return {
        mode: 'oi',
        reason: 'Mode Bebas - menggunakan Open Interpreter',
        requiresConfirmation: true,
        riskLevel
      }
    }
    
    // Simple commands still use IPC for speed
    return {
      mode: 'ipc',
      reason: 'Perintah sederhana - IPC lebih cepat',
      requiresConfirmation,
      riskLevel
    }
  }
}

/**
 * Check if an action can be executed with IPC
 */
function canExecuteWithIPC(action: Action): boolean {
  const ipcHandlers: ActionCategory[] = [
    'app_control',
    'volume_control',
    'window_control',
    'screenshot',
    'web_browse',
    'system_control'
  ]
  
  // Basic check - is there an IPC handler for this category?
  if (ipcHandlers.includes(action.category)) {
    return true
  }
  
  // For command execution, check if it's a known command
  if (action.category === 'command_exec') {
    const knownCommands = ['notepad', 'calc', 'explorer', 'cmd', 'powershell']
    const cmd = (action.params.command as string || '').toLowerCase()
    return knownCommands.some(known => cmd.includes(known))
  }
  
  return false
}

/**
 * Determine if a command is complex (should use OI)
 */
function isComplexCommand(action: Action): boolean {
  // Complex tasks are always complex
  if (action.category === 'complex_task') return true
  
  // Commands with multiple steps
  if (action.category === 'command_exec') {
    const cmd = (action.params.command as string || '')
    // Multi-line or chained commands
    if (cmd.includes('&&') || cmd.includes('||') || cmd.includes('\n')) {
      return true
    }
    // Commands with pipes or redirects
    if (cmd.includes('|') || cmd.includes('>') || cmd.includes('<')) {
      return true
    }
  }
  
  // File operations beyond basic CRUD
  if (action.category === 'file_operation') {
    const op = action.params.operation as string || ''
    const complexOps = ['search', 'find', 'batch', 'recursive', 'compress', 'extract']
    if (complexOps.some(c => op.includes(c))) {
      return true
    }
  }
  
  return false
}

/**
 * Execute an action through the appropriate mode
 */
export async function executeAction(
  action: Action,
  onConfirm?: () => Promise<boolean>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const route = routeAction(action)
  
  // Handle blocked actions
  if (route.mode === 'blocked') {
    return { 
      success: false, 
      error: route.reason 
    }
  }
  
  // Handle confirmation if needed
  if (route.requiresConfirmation && onConfirm) {
    const confirmed = await onConfirm()
    if (!confirmed) {
      return { 
        success: false, 
        error: 'Aksi dibatalkan oleh user' 
      }
    }
  }
  
  try {
    if (route.mode === 'ipc') {
      return await executeWithIPC(action)
    } else {
      return await executeWithOI(action)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Terjadi kesalahan'
    }
  }
}

/**
 * Execute action through IPC
 */
async function executeWithIPC(action: Action): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const { category, params } = action
  
  switch (category) {
    case 'app_control':
      if (params.action === 'open') {
        await computerControl.openApplication(params.appName as string)
      } else if (params.action === 'close') {
        // Close app via command - no direct closeApplication function
        await computerControl.executeCommand(`taskkill /IM "${params.appName}.exe" /F`)
      }
      break
      
    case 'volume_control':
      if (params.mute !== undefined) {
        await computerControl.toggleMute()
      } else if (params.level !== undefined) {
        await computerControl.setVolume(params.level as number)
      }
      break
      
    case 'window_control':
      if (params.action === 'minimize_all') {
        await computerControl.minimizeAllWindows()
      } else if (params.action === 'show_desktop') {
        await computerControl.showDesktop()
      }
      break
      
    case 'system_control':
      if (params.action === 'lock') {
        await computerControl.lockScreen()
      } else if (params.action === 'shutdown') {
        await computerControl.shutdownComputer(false)
      } else if (params.action === 'restart') {
        await computerControl.shutdownComputer(true) // restart = true
      } else if (params.action === 'sleep') {
        await computerControl.sleepComputer()
      }
      break
      
    case 'screenshot':
      const result = await computerControl.takeScreenshot()
      return { success: true, result }
      
    case 'command_exec':
      const cmdResult = await computerControl.executeCommand(params.command as string)
      return { success: true, result: cmdResult }
      
    default:
      return { success: false, error: `IPC tidak mendukung kategori: ${category}` }
  }
  
  return { success: true }
}

/**
 * Execute action through Open Interpreter
 */
async function executeWithOI(action: Action): Promise<{ success: boolean; result?: unknown; error?: string }> {
  // Build natural language prompt for OI
  const prompt = buildOIPrompt(action)
  
  // Execute through OI service
  const response = await openInterpreter.executePrompt({ prompt, autoConfirm: false })
  
  if (response.status === 'completed') {
    return { success: true, result: response.output }
  } else if (response.status === 'failed') {
    return { success: false, error: response.error }
  } else {
    return { success: false, error: 'OI execution status: ' + response.status }
  }
}

/**
 * Build natural language prompt for Open Interpreter
 */
function buildOIPrompt(action: Action): string {
  const { category, name, params } = action
  
  // Create descriptive prompt based on action
  let prompt = `Tolong ${name}.\n`
  
  if (category === 'file_operation') {
    prompt += `Operasi: ${params.operation}\n`
    if (params.path) prompt += `Path: ${params.path}\n`
    if (params.content) prompt += `Content: ${params.content}\n`
  }
  
  if (category === 'command_exec') {
    prompt += `Perintah yang perlu dijalankan: ${params.command}\n`
  }
  
  if (category === 'complex_task') {
    prompt += `Detail: ${params.description || JSON.stringify(params)}\n`
  }
  
  // Add safety instructions
  prompt += '\nCatatan: Jangan jalankan perintah berbahaya tanpa konfirmasi.'
  
  return prompt
}

/**
 * Get human-readable description of route decision
 */
export function getRouteDescription(action: Action): string {
  const route = routeAction(action)
  
  const modeLabel = route.mode === 'ipc' 
    ? '⚡ IPC (cepat)' 
    : route.mode === 'oi' 
      ? '🧠 Open Interpreter'
      : '❌ Diblokir'
      
  const riskEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  }[route.riskLevel]
  
  return `${modeLabel} | ${riskEmoji} ${route.riskLevel} | ${route.reason}`
}
