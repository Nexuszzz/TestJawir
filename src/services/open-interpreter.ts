// Open Interpreter Client Service
// Connects to OI FastAPI server for computer control
// Features: execute prompts, handle confirmations, stream output

export interface OIExecuteRequest {
  prompt: string
  autoConfirm?: boolean
  sessionId?: string
  language?: 'auto' | 'python' | 'javascript' | 'shell' | 'powershell' | 'applescript'
}

export interface OIExecuteResponse {
  success: boolean
  actionId: string
  status: 'pending_confirmation' | 'executing' | 'completed' | 'failed' | 'cancelled'
  output?: string
  error?: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresConfirmation: boolean
  actionDescription?: string
}

export interface OIConfirmRequest {
  actionId: string
  approved: boolean
}

export interface OIStatusResponse {
  server: string
  interpreterAvailable: boolean
  version: string
  pendingActions: number
}

// Default OI server URL
const DEFAULT_OI_URL = 'http://localhost:8765'

let oiServerUrl = import.meta.env.VITE_OI_SERVER_URL || DEFAULT_OI_URL

/**
 * Configure OI server URL
 */
export function configureOI(url: string): void {
  oiServerUrl = url
}

/**
 * Get OI server URL
 */
export function getOIUrl(): string {
  return oiServerUrl
}

/**
 * Check if OI server is running
 */
export async function isOIServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${oiServerUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    const data = await response.json()
    return data.status === 'healthy' && data.interpreter === true
  } catch {
    return false
  }
}

/**
 * Get OI server status
 */
export async function getOIStatus(): Promise<OIStatusResponse | null> {
  try {
    const response = await fetch(`${oiServerUrl}/`)
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      server: data.server,
      interpreterAvailable: data.interpreter_available,
      version: data.version,
      pendingActions: data.pending_actions,
    }
  } catch (error) {
    console.error('Failed to get OI status:', error)
    return null
  }
}

/**
 * Execute a prompt via Open Interpreter
 */
export async function executePrompt(request: OIExecuteRequest): Promise<OIExecuteResponse> {
  try {
    const response = await fetch(`${oiServerUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        auto_confirm: request.autoConfirm ?? false,
        session_id: request.sessionId,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: data.success,
      actionId: data.action_id,
      status: data.status,
      output: data.output,
      error: data.error,
      riskLevel: data.risk_level,
      requiresConfirmation: data.requires_confirmation,
      actionDescription: data.action_description,
    }
  } catch (error) {
    console.error('OI execute failed:', error)
    return {
      success: false,
      actionId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      riskLevel: 'low',
      requiresConfirmation: false,
    }
  }
}

/**
 * Confirm or reject a pending action
 */
export async function confirmAction(request: OIConfirmRequest): Promise<OIExecuteResponse> {
  try {
    const response = await fetch(`${oiServerUrl}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_id: request.actionId,
        approved: request.approved,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: data.success,
      actionId: data.action_id,
      status: data.status,
      output: data.output,
      error: data.error,
      riskLevel: data.risk_level || 'low',
      requiresConfirmation: false,
    }
  } catch (error) {
    console.error('OI confirm failed:', error)
    return {
      success: false,
      actionId: request.actionId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      riskLevel: 'low',
      requiresConfirmation: false,
    }
  }
}

/**
 * Cancel a pending action
 */
export async function cancelAction(actionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${oiServerUrl}/pending/${actionId}`, {
      method: 'DELETE',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get pending actions
 */
export async function getPendingActions(): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(`${oiServerUrl}/pending`)
    if (!response.ok) return []
    const data = await response.json()
    return Object.values(data.pending || {})
  } catch {
    return []
  }
}

/**
 * Get action history
 */
export async function getActionHistory(): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(`${oiServerUrl}/history`)
    if (!response.ok) return []
    const data = await response.json()
    return data.history || []
  } catch {
    return []
  }
}

// ============== STREAMING VIA WEBSOCKET ==============

export interface OIStreamCallbacks {
  onStart?: (prompt: string) => void
  onChunk?: (content: string) => void
  onComplete?: () => void
  onError?: (error: string) => void
  onConfirmationRequired?: (risk: string, prompt: string) => Promise<boolean>
}

/**
 * Execute prompt with streaming output
 */
export async function executeWithStream(
  prompt: string,
  callbacks: OIStreamCallbacks
): Promise<void> {
  const wsUrl = oiServerUrl.replace('http', 'ws') + '/ws/execute'
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ prompt }))
    }
    
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'start':
          callbacks.onStart?.(data.prompt)
          break
          
        case 'chunk':
          callbacks.onChunk?.(data.content)
          break
          
        case 'complete':
          callbacks.onComplete?.()
          ws.close()
          resolve()
          break
          
        case 'error':
          callbacks.onError?.(data.message)
          ws.close()
          reject(new Error(data.message))
          break
          
        case 'confirmation_required':
          if (callbacks.onConfirmationRequired) {
            const confirmed = await callbacks.onConfirmationRequired(data.risk, data.prompt)
            ws.send(JSON.stringify({ confirmed }))
          } else {
            ws.send(JSON.stringify({ confirmed: false }))
          }
          break
          
        case 'cancelled':
          callbacks.onComplete?.()
          ws.close()
          resolve()
          break
      }
    }
    
    ws.onerror = (error) => {
      callbacks.onError?.('WebSocket error')
      reject(error)
    }
    
    ws.onclose = () => {
      resolve()
    }
  })
}

// ============== CONVENIENCE FUNCTIONS ==============

/**
 * Search for files on the computer
 */
export async function searchFiles(query: string, folder?: string): Promise<OIExecuteResponse> {
  const prompt = folder
    ? `Cari file yang mengandung "${query}" di folder ${folder}`
    : `Cari file yang mengandung "${query}" di komputer ini`
  
  return executePrompt({ prompt, autoConfirm: true })
}

/**
 * Open an application
 */
export async function openApplication(appName: string): Promise<OIExecuteResponse> {
  return executePrompt({
    prompt: `Buka aplikasi ${appName}`,
    autoConfirm: true,
  })
}

/**
 * Read and summarize a document
 */
export async function readDocument(filePath: string, summarize: boolean = true): Promise<OIExecuteResponse> {
  const prompt = summarize
    ? `Baca file "${filePath}" dan buat ringkasan 5 poin utama`
    : `Baca file "${filePath}" dan tampilkan isinya`
  
  return executePrompt({ prompt, autoConfirm: false }) // Require confirmation
}

/**
 * Organize files in a folder
 */
export async function organizeFolder(folderPath: string, rules?: string): Promise<OIExecuteResponse> {
  const prompt = rules
    ? `Rapihin folder "${folderPath}" dengan aturan: ${rules}`
    : `Rapihin folder "${folderPath}" berdasarkan tipe file (gambar, dokumen, video, dll)`
  
  return executePrompt({ prompt, autoConfirm: false }) // Require confirmation
}

/**
 * Create a backup of a folder
 */
export async function createBackup(folderPath: string): Promise<OIExecuteResponse> {
  const date = new Date().toISOString().split('T')[0]
  const prompt = `Buat backup zip dari folder "${folderPath}" dengan nama backup-${date}.zip`
  
  return executePrompt({ prompt, autoConfirm: false }) // Require confirmation
}
