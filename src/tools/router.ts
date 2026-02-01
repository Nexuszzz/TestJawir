// Tool Router - Handles function calls from Gemini
// Routes to appropriate tool handlers and returns results
// Now with mode-aware routing (IPC vs Open Interpreter)

import { useIoTStore } from '@stores/iotStore'
import { useWorkspaceStore } from '@stores/workspaceStore'
import { useModeStore } from '@stores/modeStore'
import { routeAction, Action, ActionCategory, RiskLevel } from '@services/mode-router'
import * as openInterpreter from '@services/open-interpreter'

export interface ToolResult {
  success: boolean
  data?: unknown
  message: string
  error?: string
  routeInfo?: {
    mode: 'ipc' | 'oi' | 'blocked'
    reason: string
  }
}

type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>

// ============================================
// KICAD HANDLERS
// ============================================
async function handleCreateSchematic(args: Record<string, unknown>): Promise<ToolResult> {
  const template = args.template as string
  const projectName = (args.project_name as string) || `jawir_${template}_${Date.now()}`
  
  // Add card to workspace
  const { addCard } = useWorkspaceStore.getState()
  
  const schematicContent = getSchematicTemplate(template)
  
  addCard({
    type: 'kicad',
    title: `${projectName}.kicad_sch`,
    content: schematicContent,
    template,
    status: 'success',
  })
  
  return {
    success: true,
    data: { projectName, template },
    message: `Skematik ${template} berhasil dibuat dengan nama ${projectName}`,
  }
}

function getSchematicTemplate(template: string): string {
  // Return KiCad schematic templates
  const templates: Record<string, string> = {
    powerbank: `
(kicad_sch (version 20231120) (generator "jawir-os")
  (uuid "powerbank-template")
  (paper "A4")
  (title_block (title "Powerbank Module - TP4056 + DW01"))
  
  ; TP4056 Charging IC
  ; DW01 Protection IC
  ; FS8205A Dual MOSFET
  ; 18650 Battery Holder
  ; Micro USB Input
  ; Power Output with protection
)`,
    amplifier: `
(kicad_sch (version 20231120) (generator "jawir-os")
  (uuid "amplifier-template")
  (paper "A4")
  (title_block (title "5V Stereo Amplifier - PAM8403"))
  
  ; PAM8403 Stereo Amplifier IC
  ; 3.5mm Audio Jack Input
  ; Speaker Output L/R
  ; Volume Potentiometer
  ; Power Input 5V
  ; Filter Capacitors
)`,
    led_indicator: `
(kicad_sch (version 20231120) (generator "jawir-os")
  (uuid "led-indicator-template")
  (paper "A4")
  (title_block (title "LED Indicator Circuit"))
  
  ; LED (Red/Green/Blue options)
  ; Current Limiting Resistor (330Ω for 5V, 100Ω for 3.3V)
  ; GPIO Input Pin
  ; GND Connection
)`,
  }
  
  return templates[template] || templates.led_indicator
}

async function handleOpenKicadProject(args: Record<string, unknown>): Promise<ToolResult> {
  const projectPath = args.project_path as string
  
  if (window.electronAPI?.computer) {
    // Open KiCad with the project file
    await window.electronAPI.computer.openApp(`kicad "${projectPath}"`)
    return {
      success: true,
      message: `Membuka project KiCad: ${projectPath}`,
    }
  }
  
  return {
    success: false,
    error: 'Electron API not available',
    message: 'Tidak dapat membuka KiCad (Electron API tidak tersedia)',
  }
}

// ============================================
// IOT HANDLERS
// ============================================
async function handleGetIotStatus(args: Record<string, unknown>): Promise<ToolResult> {
  const device = args.device as string
  const { fireDetection, fanDimmer } = useIoTStore.getState()
  
  let data: Record<string, unknown> = {}
  
  if (device === 'fire_detection' || device === 'all') {
    data.fireDetection = {
      temperature: fireDetection.temperature,
      humidity: fireDetection.humidity,
      gasLevel: fireDetection.gasLevel,
      alarmActive: fireDetection.alarmActive,
      isOnline: fireDetection.isOnline,
    }
  }
  
  if (device === 'fan_dimmer' || device === 'all') {
    data.fanDimmer = {
      speed: fanDimmer.speed,
      isOn: fanDimmer.isOn,
      isOnline: fanDimmer.isOnline,
    }
  }
  
  return {
    success: true,
    data,
    message: formatIotStatus(data),
  }
}

function formatIotStatus(data: Record<string, unknown>): string {
  const parts: string[] = []
  
  if (data.fireDetection) {
    const fd = data.fireDetection as Record<string, unknown>
    parts.push(`🔥 Fire Detection: Suhu ${fd.temperature}°C, Kelembaban ${fd.humidity}%, Gas ${fd.gasLevel}%, Alarm ${fd.alarmActive ? 'AKTIF' : 'Mati'}, Status ${fd.isOnline ? 'Online' : 'Offline'}`)
  }
  
  if (data.fanDimmer) {
    const fan = data.fanDimmer as Record<string, unknown>
    parts.push(`💨 Kipas: ${fan.isOn ? `Nyala ${fan.speed}%` : 'Mati'}, Status ${fan.isOnline ? 'Online' : 'Offline'}`)
  }
  
  return parts.join('\n')
}

async function handleControlBuzzer(args: Record<string, unknown>): Promise<ToolResult> {
  const action = args.action as string
  const { sendCommand } = useIoTStore.getState()
  
  sendCommand('buzzer', action === 'on' ? 'ON' : 'OFF')
  
  return {
    success: true,
    message: `Buzzer ${action === 'on' ? 'dinyalakan' : 'dimatikan'}`,
  }
}

async function handleSetFanSpeed(args: Record<string, unknown>): Promise<ToolResult> {
  const speed = args.speed as number
  const { sendCommand, updateFanDimmer } = useIoTStore.getState()
  
  // Validate speed range
  const clampedSpeed = Math.max(0, Math.min(100, speed))
  
  updateFanDimmer({ speed: clampedSpeed, isOn: clampedSpeed > 0 })
  sendCommand('fan', clampedSpeed.toString())
  
  return {
    success: true,
    data: { speed: clampedSpeed },
    message: clampedSpeed === 0 
      ? 'Kipas dimatikan' 
      : `Kecepatan kipas diatur ke ${clampedSpeed}%`,
  }
}

// ============================================
// WHATSAPP HANDLERS
// ============================================
async function handleSendWhatsapp(args: Record<string, unknown>): Promise<ToolResult> {
  const contactName = args.contact_name as string
  const message = args.message as string
  
  // Add to workspace for user confirmation
  const { addCard } = useWorkspaceStore.getState()
  
  addCard({
    type: 'whatsapp',
    title: `Kirim ke ${contactName}`,
    content: message,
    status: 'pending_confirmation',
    contactName,
  })
  
  return {
    success: true,
    data: { contactName, message, status: 'pending' },
    message: `Pesan ke ${contactName} siap dikirim. Mohon konfirmasi di panel WhatsApp.`,
  }
}

// ============================================
// COMPUTER CONTROL HANDLERS
// ============================================
import * as computerControl from '@services/computer-control'

async function handleOpenApplication(args: Record<string, unknown>): Promise<ToolResult> {
  const appName = args.app_name as string
  
  const result = await computerControl.openApplication(appName)
  
  if (result.success) {
    return {
      success: true,
      message: `Membuka aplikasi ${appName}`,
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal membuka ${appName}: ${result.error}`,
  }
}

async function handleOpenFolder(args: Record<string, unknown>): Promise<ToolResult> {
  const folderPath = args.folder_path as string
  
  const result = await computerControl.openFolder(folderPath)
  
  if (result.success) {
    return {
      success: true,
      message: `Membuka folder ${folderPath}`,
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal membuka folder: ${result.error}`,
  }
}

async function handleFindFile(args: Record<string, unknown>): Promise<ToolResult> {
  const query = args.query as string
  const location = (args.location as string) || 'D:\\expo'
  
  // Use PowerShell to search for files
  const command = `Get-ChildItem -Path "${location}" -Recurse -Filter "*${query}*" -ErrorAction SilentlyContinue | Select-Object -First 10 FullName | ConvertTo-Json`
  const result = await computerControl.executeCommand(command)
  
  if (result.success && result.stdout) {
    try {
      const files = JSON.parse(result.stdout)
      return {
        success: true,
        data: { query, location, results: files },
        message: `Ditemukan file untuk "${query}" di ${location}`,
      }
    } catch {
      return {
        success: true,
        data: { query, location, results: [] },
        message: `Tidak ditemukan file "${query}" di ${location}`,
      }
    }
  }
  
  return {
    success: true,
    data: { query, location, results: [] },
    message: `Mencari file "${query}" di ${location}...`,
  }
}

async function handleOpenUrl(args: Record<string, unknown>): Promise<ToolResult> {
  const url = args.url as string
  
  const result = await computerControl.openURL(url)
  
  if (result.success) {
    return {
      success: true,
      message: `Membuka ${url} di browser`,
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal membuka URL: ${result.error}`,
  }
}

async function handleSetVolume(args: Record<string, unknown>): Promise<ToolResult> {
  const level = args.level as number
  
  const result = await computerControl.setVolume(level)
  
  if (result.success) {
    return {
      success: true,
      data: { volume: level },
      message: `Volume diatur ke ${level}%`,
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal mengatur volume: ${result.error}`,
  }
}

async function handleToggleMute(_args: Record<string, unknown>): Promise<ToolResult> {
  const result = await computerControl.toggleMute()
  
  if (result.success) {
    return {
      success: true,
      message: 'Toggle mute berhasil',
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal toggle mute: ${result.error}`,
  }
}

async function handleShowDesktop(_args: Record<string, unknown>): Promise<ToolResult> {
  const result = await computerControl.showDesktop()
  
  if (result.success) {
    return {
      success: true,
      message: 'Menampilkan desktop',
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal menampilkan desktop: ${result.error}`,
  }
}

async function handleMinimizeAll(_args: Record<string, unknown>): Promise<ToolResult> {
  const result = await computerControl.minimizeAllWindows()
  
  if (result.success) {
    return {
      success: true,
      message: 'Semua jendela diminimize',
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal minimize: ${result.error}`,
  }
}

async function handleLockScreen(_args: Record<string, unknown>): Promise<ToolResult> {
  const result = await computerControl.lockScreen()
  
  if (result.success) {
    return {
      success: true,
      message: 'Layar dikunci',
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal mengunci layar: ${result.error}`,
  }
}

async function handleScreenshot(_args: Record<string, unknown>): Promise<ToolResult> {
  const result = await computerControl.takeScreenshot()
  
  if (result.success) {
    return {
      success: true,
      data: { path: result.path },
      message: `Screenshot disimpan ke ${result.path}`,
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal mengambil screenshot: ${result.error}`,
  }
}

async function handleSystemPower(args: Record<string, unknown>): Promise<ToolResult> {
  const action = args.action as string
  
  let result
  switch (action) {
    case 'shutdown':
      result = await computerControl.shutdownComputer(false)
      break
    case 'restart':
      result = await computerControl.shutdownComputer(true)
      break
    case 'sleep':
      result = await computerControl.sleepComputer()
      break
    case 'cancel':
      result = await computerControl.cancelShutdown()
      break
    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        message: `Aksi tidak dikenal: ${action}`,
      }
  }
  
  if (result.success) {
    const messages: Record<string, string> = {
      shutdown: 'Komputer akan shutdown dalam 60 detik',
      restart: 'Komputer akan restart dalam 60 detik',
      sleep: 'Komputer akan masuk mode sleep',
      cancel: 'Shutdown/restart dibatalkan',
    }
    return {
      success: true,
      message: messages[action] || 'Perintah berhasil',
    }
  }
  
  return {
    success: false,
    error: result.error,
    message: `Gagal: ${result.error}`,
  }
}

// ============================================
// WEB RESEARCH HANDLERS
// ============================================
async function handleWebSearch(args: Record<string, unknown>): Promise<ToolResult> {
  const query = args.query as string
  const numResults = (args.num_results as number) || 5
  
  // Add browser card to workspace
  const { addCard } = useWorkspaceStore.getState()
  
  addCard({
    type: 'browser',
    title: `Pencarian: ${query}`,
    content: `Mencari "${query}"...`,
    status: 'loading',
    query,
  })
  
  return {
    success: true,
    data: { query, numResults },
    message: `Melakukan pencarian web untuk "${query}"`,
  }
}

async function handleBrowseUrl(args: Record<string, unknown>): Promise<ToolResult> {
  const url = args.url as string
  const extractType = (args.extract_type as string) || 'summary'
  
  // Add browser card to workspace
  const { addCard } = useWorkspaceStore.getState()
  
  addCard({
    type: 'browser',
    title: new URL(url).hostname,
    content: `Mengunjungi ${url}...`,
    status: 'loading',
    url,
    extractType,
  })
  
  return {
    success: true,
    data: { url, extractType },
    message: `Mengunjungi ${url}`,
  }
}

// ============================================
// GOOGLE WORKSPACE HANDLERS
// ============================================
async function handleGmailRead(args: Record<string, unknown>): Promise<ToolResult> {
  const filter = args.filter as string
  const count = (args.count as number) || 5
  
  // This would need Google API implementation
  return {
    success: true,
    data: { filter, count, emails: [] },
    message: `Membaca ${count} email ${filter}`,
  }
}

async function handleDriveList(args: Record<string, unknown>): Promise<ToolResult> {
  const folder = (args.folder as string) || 'root'
  const fileType = (args.file_type as string) || 'all'
  
  return {
    success: true,
    data: { folder, fileType, files: [] },
    message: `Menampilkan file dari Google Drive (${folder})`,
  }
}

async function handleCalendarEvents(args: Record<string, unknown>): Promise<ToolResult> {
  const range = args.range as string
  
  return {
    success: true,
    data: { range, events: [] },
    message: `Mendapatkan jadwal ${range}`,
  }
}

// ============================================
// OPEN INTERPRETER HANDLERS (Mode Bebas Only)
// ============================================
async function handleOIExecute(args: Record<string, unknown>): Promise<ToolResult> {
  const { mode } = useModeStore.getState()
  
  // Only available in advanced mode
  if (mode !== 'advanced') {
    return {
      success: false,
      error: 'Mode Aman aktif',
      message: '⚠️ oi_execute hanya tersedia di Mode Bebas. Aktifkan Mode Bebas di Settings untuk menggunakan fitur ini.',
      routeInfo: {
        mode: 'blocked',
        reason: 'Tool ini memerlukan Mode Bebas (Open Interpreter)',
      },
    }
  }
  
  const message = args.message as string
  const language = (args.language as 'auto' | 'python' | 'javascript' | 'shell' | 'powershell' | 'applescript') || 'auto'
  const autoRun = (args.auto_run as boolean) || false
  
  try {
    const response = await openInterpreter.executePrompt({
      prompt: message,
      language,
      autoConfirm: autoRun,
    })
    
    // Add result to workspace
    const { addCard } = useWorkspaceStore.getState()
    addCard({
      type: 'computer',
      title: `OI: ${message.slice(0, 50)}...`,
      content: response.output || 'Perintah dijalankan',
      status: response.status === 'completed' ? 'success' : 'error',
      data: { type: 'oi_result', response },
    })
    
    return {
      success: response.status === 'completed',
      data: response,
      message: response.output || 'Perintah dijalankan melalui Open Interpreter',
      routeInfo: {
        mode: 'oi',
        reason: 'Direct OI execution',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OI execution failed',
      message: `Gagal menjalankan melalui Open Interpreter: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

async function handleOISearchContent(args: Record<string, unknown>): Promise<ToolResult> {
  const { mode } = useModeStore.getState()
  
  if (mode !== 'advanced') {
    return {
      success: false,
      error: 'Mode Aman aktif',
      message: '⚠️ oi_search_content hanya tersedia di Mode Bebas.',
      routeInfo: {
        mode: 'blocked',
        reason: 'Tool ini memerlukan Mode Bebas',
      },
    }
  }
  
  const query = args.query as string
  const directory = (args.directory as string) || '.'
  const filePattern = (args.file_pattern as string) || '*'
  const useRegex = (args.use_regex as boolean) || false
  
  // Build OI prompt for content search
  const prompt = useRegex
    ? `Cari file yang mengandung pattern regex "${query}" di folder "${directory}" dengan pattern file ${filePattern}. Tampilkan nama file dan baris yang cocok.`
    : `Cari file yang mengandung teks "${query}" di folder "${directory}" dengan pattern file ${filePattern}. Tampilkan nama file dan baris yang cocok.`
  
  try {
    const response = await openInterpreter.executePrompt({
      prompt,
      autoConfirm: true,
    })
    
    return {
      success: response.status === 'completed',
      data: { query, directory, filePattern, results: response.output },
      message: response.output || `Pencarian "${query}" selesai`,
      routeInfo: {
        mode: 'oi',
        reason: 'Content search via OI',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      message: `Gagal mencari konten: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

async function handleOIBatchProcess(args: Record<string, unknown>): Promise<ToolResult> {
  const { mode } = useModeStore.getState()
  
  if (mode !== 'advanced') {
    return {
      success: false,
      error: 'Mode Aman aktif',
      message: '⚠️ oi_batch_process hanya tersedia di Mode Bebas.',
      routeInfo: {
        mode: 'blocked',
        reason: 'Tool ini memerlukan Mode Bebas',
      },
    }
  }
  
  const operation = args.operation as string
  const sourcePattern = args.source_pattern as string
  const destination = args.destination as string
  const customCommand = args.custom_command as string
  
  // Build OI prompt based on operation
  let prompt = ''
  switch (operation) {
    case 'rename':
      prompt = `Batch rename file dengan pattern "${sourcePattern}". Pindahkan ke "${destination || 'folder yang sama'}".`
      break
    case 'convert':
      prompt = `Convert file dengan pattern "${sourcePattern}" dan simpan ke "${destination || 'folder yang sama'}".`
      break
    case 'resize':
      prompt = `Resize gambar dengan pattern "${sourcePattern}" dan simpan ke "${destination || 'folder yang sama'}".`
      break
    case 'extract':
      prompt = `Ekstrak data dari file dengan pattern "${sourcePattern}" dan simpan ke "${destination || 'output.txt'}".`
      break
    case 'compress':
      prompt = `Compress file dengan pattern "${sourcePattern}" ke "${destination || 'archive.zip'}".`
      break
    case 'custom':
      prompt = customCommand || `Proses batch file "${sourcePattern}"`
      break
    default:
      prompt = `Proses batch untuk file "${sourcePattern}" dengan operasi "${operation}".`
  }
  
  try {
    const response = await openInterpreter.executePrompt({
      prompt,
      autoConfirm: false, // Batch operations should ask for confirmation
    })
    
    return {
      success: response.status === 'completed',
      data: { operation, sourcePattern, destination, results: response.output },
      message: response.output || `Batch ${operation} selesai`,
      routeInfo: {
        mode: 'oi',
        reason: 'Batch processing via OI',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch processing failed',
      message: `Gagal batch process: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

async function handleOIAnalyzeCode(args: Record<string, unknown>): Promise<ToolResult> {
  const { mode } = useModeStore.getState()
  
  if (mode !== 'advanced') {
    return {
      success: false,
      error: 'Mode Aman aktif',
      message: '⚠️ oi_analyze_code hanya tersedia di Mode Bebas.',
      routeInfo: {
        mode: 'blocked',
        reason: 'Tool ini memerlukan Mode Bebas',
      },
    }
  }
  
  const filePath = args.file_path as string
  const action = args.action as string
  const instructions = args.instructions as string
  
  // Build OI prompt based on action
  let prompt = ''
  switch (action) {
    case 'analyze':
      prompt = `Analisis kode di file "${filePath}". Berikan ringkasan struktur, fungsi utama, dan potensi masalah.`
      break
    case 'refactor':
      prompt = `Refactor kode di file "${filePath}". ${instructions || 'Perbaiki struktur dan readability.'}`
      break
    case 'add_feature':
      prompt = `Tambahkan fitur ke file "${filePath}": ${instructions}`
      break
    case 'fix_bugs':
      prompt = `Perbaiki bug di file "${filePath}". ${instructions || 'Identifikasi dan perbaiki masalah yang ditemukan.'}`
      break
    case 'optimize':
      prompt = `Optimasi performa kode di file "${filePath}". ${instructions || 'Tingkatkan efisiensi tanpa mengubah fungsionalitas.'}`
      break
    case 'document':
      prompt = `Tambahkan dokumentasi/komentar ke file "${filePath}". ${instructions || 'Dokumentasikan fungsi dan parameter.'}`
      break
    default:
      prompt = `${action} kode di file "${filePath}". ${instructions || ''}`
  }
  
  try {
    const response = await openInterpreter.executePrompt({
      prompt,
      autoConfirm: action === 'analyze', // Only analyze doesn't need confirmation
    })
    
    // Add result to workspace
    const { addCard } = useWorkspaceStore.getState()
    addCard({
      type: 'computer',
      title: `Code ${action}: ${filePath.split(/[\\/]/).pop()}`,
      content: response.output || 'Analisis selesai',
      status: response.status === 'completed' ? 'success' : 'error',
      data: { type: 'code_analysis', filePath, action, response },
    })
    
    return {
      success: response.status === 'completed',
      data: { filePath, action, results: response.output },
      message: response.output || `${action} selesai untuk ${filePath}`,
      routeInfo: {
        mode: 'oi',
        reason: 'Code analysis via OI',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Code analysis failed',
      message: `Gagal ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ============================================
// TOOL ROUTER
// ============================================
const toolHandlers: Record<string, ToolHandler> = {
  // KiCad
  create_schematic: handleCreateSchematic,
  open_kicad_project: handleOpenKicadProject,
  
  // IoT
  get_iot_status: handleGetIotStatus,
  control_buzzer: handleControlBuzzer,
  set_fan_speed: handleSetFanSpeed,
  
  // WhatsApp
  send_whatsapp: handleSendWhatsapp,
  
  // Computer Control
  open_application: handleOpenApplication,
  open_folder: handleOpenFolder,
  find_file: handleFindFile,
  open_url: handleOpenUrl,
  set_volume: handleSetVolume,
  toggle_mute: handleToggleMute,
  show_desktop: handleShowDesktop,
  minimize_all: handleMinimizeAll,
  lock_screen: handleLockScreen,
  take_screenshot: handleScreenshot,
  system_power: handleSystemPower,
  
  // Web Research
  web_search: handleWebSearch,
  browse_url: handleBrowseUrl,
  
  // Google Workspace
  gmail_read: handleGmailRead,
  drive_list: handleDriveList,
  calendar_events: handleCalendarEvents,

  // Open Interpreter (Mode Bebas Only)
  oi_execute: handleOIExecute,
  oi_search_content: handleOISearchContent,
  oi_batch_process: handleOIBatchProcess,
  oi_analyze_code: handleOIAnalyzeCode,
}

/**
 * Route a function call to the appropriate handler
 */
export async function routeToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const handler = toolHandlers[toolName]
  
  if (!handler) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
      message: `Tool "${toolName}" tidak ditemukan`,
    }
  }
  
  try {
    return await handler(args)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: errorMessage,
      message: `Error menjalankan ${toolName}: ${errorMessage}`,
    }
  }
}

// ============================================
// MODE-AWARE ROUTING
// ============================================

// Map tool names to action categories for mode-aware routing
const TOOL_TO_CATEGORY: Record<string, ActionCategory> = {
  // App control
  open_application: 'app_control',
  
  // Volume control
  set_volume: 'volume_control',
  toggle_mute: 'volume_control',
  
  // Window control
  show_desktop: 'window_control',
  minimize_all: 'window_control',
  
  // System control (requires confirmation)
  lock_screen: 'system_control',
  system_power: 'system_control',
  
  // Screenshots
  take_screenshot: 'screenshot',
  
  // File operations
  find_file: 'file_operation',
  open_folder: 'file_operation',
  
  // Web browsing
  open_url: 'web_browse',
  web_search: 'web_browse',
  browse_url: 'web_browse',

  // Open Interpreter tools (Mode Bebas)
  oi_execute: 'code_execution',
  oi_search_content: 'file_operation',
  oi_batch_process: 'file_operation',
  oi_analyze_code: 'code_execution',
}

// Map tool names to risk levels
const TOOL_RISK_LEVELS: Record<string, RiskLevel> = {
  system_power: 'critical',
  lock_screen: 'high',
  find_file: 'low',
  open_application: 'low',
  set_volume: 'low',
  toggle_mute: 'low',
  show_desktop: 'low',
  minimize_all: 'low',
  take_screenshot: 'low',
  open_folder: 'low',
  open_url: 'low',
  web_search: 'low',
  browse_url: 'low',
  
  // Open Interpreter tools - Higher risk by default
  oi_execute: 'high',
  oi_search_content: 'medium',
  oi_batch_process: 'high',
  oi_analyze_code: 'medium',
}

/**
 * Mode-aware tool routing
 * Checks current mode and routes to IPC or Open Interpreter
 */
export async function routeToolCallWithMode(
  toolName: string,
  args: Record<string, unknown>,
  onConfirmRequired?: (action: Action) => Promise<boolean>
): Promise<ToolResult> {
  const category = TOOL_TO_CATEGORY[toolName] || 'unknown'
  const riskLevel = TOOL_RISK_LEVELS[toolName] || 'medium'
  
  // Build action for mode router
  const action: Action = {
    category,
    name: toolName,
    params: args,
    riskLevel,
    requiresConfirmation: riskLevel === 'high' || riskLevel === 'critical',
  }
  
  // Get route decision
  const routeResult = routeAction(action)
  
  // Handle blocked actions
  if (routeResult.mode === 'blocked') {
    return {
      success: false,
      error: routeResult.reason,
      message: routeResult.reason,
      routeInfo: {
        mode: 'blocked',
        reason: routeResult.reason,
      },
    }
  }
  
  // Handle confirmation if required
  if (routeResult.requiresConfirmation && onConfirmRequired) {
    const confirmed = await onConfirmRequired(action)
    if (!confirmed) {
      return {
        success: false,
        error: 'Aksi dibatalkan oleh user',
        message: 'Aksi dibatalkan',
        routeInfo: {
          mode: routeResult.mode,
          reason: 'Dibatalkan user',
        },
      }
    }
  }
  
  // Route to appropriate handler
  if (routeResult.mode === 'ipc') {
    // Use existing IPC handlers
    const result = await routeToolCall(toolName, args)
    return {
      ...result,
      routeInfo: {
        mode: 'ipc',
        reason: routeResult.reason,
      },
    }
  } else {
    // Use Open Interpreter
    return await executeWithOpenInterpreter(toolName, args, routeResult.reason)
  }
}

/**
 * Execute a tool call through Open Interpreter
 */
async function executeWithOpenInterpreter(
  toolName: string,
  args: Record<string, unknown>,
  routeReason: string
): Promise<ToolResult> {
  // Build natural language prompt for OI
  const prompt = buildOIPrompt(toolName, args)
  
  try {
    const response = await openInterpreter.executePrompt({ prompt, autoConfirm: false })
    
    if (response.status === 'completed') {
      return {
        success: true,
        data: response.output,
        message: `✨ [OI] ${response.output || 'Perintah berhasil dijalankan'}`,
        routeInfo: {
          mode: 'oi',
          reason: routeReason,
        },
      }
    } else if (response.status === 'failed') {
      return {
        success: false,
        error: response.error,
        message: `[OI Error] ${response.error}`,
        routeInfo: {
          mode: 'oi',
          reason: routeReason,
        },
      }
    } else {
      return {
        success: false,
        error: `Unexpected status: ${response.status}`,
        message: `[OI] Status: ${response.status}`,
        routeInfo: {
          mode: 'oi',
          reason: routeReason,
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OI execution failed',
      message: `[OI Error] Gagal menjalankan perintah`,
      routeInfo: {
        mode: 'oi',
        reason: routeReason,
      },
    }
  }
}

/**
 * Build natural language prompt for Open Interpreter
 */
function buildOIPrompt(toolName: string, args: Record<string, unknown>): string {
  // Create human-readable prompts for different tools
  const prompts: Record<string, () => string> = {
    open_application: () => `Buka aplikasi "${args.app_name}"`,
    find_file: () => `Cari file "${args.query}" di folder "${args.location || 'D:\\expo'}"`,
    open_folder: () => `Buka folder "${args.folder_path}"`,
    open_url: () => `Buka URL "${args.url}" di browser default`,
    set_volume: () => `Atur volume komputer ke ${args.level}%`,
    toggle_mute: () => `Toggle mute audio komputer`,
    show_desktop: () => `Tampilkan desktop (minimize semua jendela)`,
    minimize_all: () => `Minimize semua jendela yang terbuka`,
    lock_screen: () => `Kunci layar komputer`,
    take_screenshot: () => `Ambil screenshot layar dan simpan`,
    system_power: () => {
      const action = args.action as string
      const actions: Record<string, string> = {
        shutdown: 'Shutdown komputer',
        restart: 'Restart komputer',
        sleep: 'Masukkan komputer ke mode sleep',
        cancel: 'Batalkan shutdown/restart yang tertunda',
      }
      return actions[action] || `Jalankan perintah power: ${action}`
    },
    web_search: () => `Lakukan pencarian web untuk "${args.query}"`,
    browse_url: () => `Buka dan ekstrak konten dari ${args.url}`,
  }
  
  const promptBuilder = prompts[toolName]
  if (promptBuilder) {
    return promptBuilder()
  }
  
  // Default: describe the tool call
  return `Jalankan perintah "${toolName}" dengan parameter: ${JSON.stringify(args)}`
}

/**
 * Get mode info for current session
 */
export function getCurrentModeInfo(): { mode: 'safe' | 'advanced'; label: string } {
  const { mode } = useModeStore.getState()
  return {
    mode,
    label: mode === 'safe' ? 'Mode Aman (IPC)' : 'Mode Bebas (OI Enabled)',
  }
}
