import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Jawir OS',
    icon: join(__dirname, '../public/favicon.svg'),
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#181711', // coffee-dark
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============================================
// IPC Handlers
// ============================================

// File System
ipcMain.handle('file:open', async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath)
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('folder:open', async (_event, folderPath: string) => {
  try {
    shell.showItemInFolder(folderPath)
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// App Control
ipcMain.handle('app:open', async (_event, appPath: string) => {
  try {
    await shell.openPath(appPath)
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('url:open', async (_event, url: string) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Notifications
ipcMain.handle('notify:show', async (_event, options: { title: string; body: string; icon?: string }) => {
  try {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon || join(__dirname, '../public/favicon.svg'),
    })
    notification.show()
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// System Info
ipcMain.handle('system:info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
  }
})

// ============================================
// Computer Control Handlers
// ============================================
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)

// Windows app name to executable mapping
const WINDOWS_APPS: Record<string, string> = {
  // Browsers
  'chrome': 'chrome.exe',
  'google chrome': 'chrome.exe',
  'firefox': 'firefox.exe',
  'edge': 'msedge.exe',
  'microsoft edge': 'msedge.exe',
  
  // Office
  'word': 'WINWORD.EXE',
  'microsoft word': 'WINWORD.EXE',
  'excel': 'EXCEL.EXE',
  'microsoft excel': 'EXCEL.EXE',
  'powerpoint': 'POWERPNT.EXE',
  'microsoft powerpoint': 'POWERPNT.EXE',
  
  // Development
  'vscode': 'code.exe',
  'visual studio code': 'code.exe',
  'code': 'code.exe',
  'notepad': 'notepad.exe',
  'terminal': 'wt.exe',
  'windows terminal': 'wt.exe',
  'cmd': 'cmd.exe',
  'command prompt': 'cmd.exe',
  'powershell': 'powershell.exe',
  
  // Media
  'spotify': 'Spotify.exe',
  'vlc': 'vlc.exe',
  
  // System
  'explorer': 'explorer.exe',
  'file explorer': 'explorer.exe',
  'calculator': 'calc.exe',
  'kalkulator': 'calc.exe',
  'settings': 'ms-settings:',
  'pengaturan': 'ms-settings:',
  
  // Communication
  'whatsapp': 'WhatsApp.exe',
  'telegram': 'Telegram.exe',
  'discord': 'Discord.exe',
  
  // Electronics
  'kicad': 'kicad.exe',
  'ltspice': 'LTspice.exe',
}

// Open app by name
ipcMain.handle('computer:openApp', async (_event, appName: string) => {
  try {
    const normalizedName = appName.toLowerCase().trim()
    
    // Check if it's a known app
    if (WINDOWS_APPS[normalizedName]) {
      const appExe = WINDOWS_APPS[normalizedName]
      
      // Handle ms-settings: protocol
      if (appExe.startsWith('ms-')) {
        await shell.openExternal(appExe)
        return { success: true, app: appExe }
      }
      
      // Try to start the app
      spawn(appExe, [], { 
        detached: true, 
        stdio: 'ignore',
        shell: true 
      }).unref()
      
      return { success: true, app: appExe }
    }
    
    // Try to find in Start Menu or run directly
    try {
      await execAsync(`start "" "${appName}"`, { shell: 'cmd.exe' })
      return { success: true, app: appName }
    } catch {
      // If that fails, try shell.openPath
      const result = await shell.openPath(appName)
      if (result) {
        return { success: false, error: result }
      }
      return { success: true, app: appName }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Execute shell command
ipcMain.handle('computer:execute', async (_event, command: string) => {
  try {
    const { stdout, stderr } = await execAsync(command, { shell: 'powershell.exe' })
    return { 
      success: true, 
      stdout: stdout.trim(), 
      stderr: stderr.trim() 
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    }
  }
})

// Volume control (Windows)
ipcMain.handle('computer:setVolume', async (_event, level: number) => {
  try {
    // Clamp level between 0 and 100
    const vol = Math.max(0, Math.min(100, level))
    
    // Using PowerShell to set volume
    const script = `
      $vol = ${vol}
      $wshell = New-Object -ComObject WScript.Shell
      # Mute first, then set volume
      1..50 | ForEach-Object { $wshell.SendKeys([char]174) }
      1..($vol / 2) | ForEach-Object { $wshell.SendKeys([char]175) }
    `
    await execAsync(script, { shell: 'powershell.exe' })
    return { success: true, volume: vol }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Mute/unmute toggle
ipcMain.handle('computer:toggleMute', async () => {
  try {
    const script = `
      $wshell = New-Object -ComObject WScript.Shell
      $wshell.SendKeys([char]173)
    `
    await execAsync(script, { shell: 'powershell.exe' })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Window management
ipcMain.handle('computer:minimizeAll', async () => {
  try {
    const script = `
      $shell = New-Object -ComObject Shell.Application
      $shell.MinimizeAll()
    `
    await execAsync(script, { shell: 'powershell.exe' })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('computer:showDesktop', async () => {
  try {
    const script = `
      $shell = New-Object -ComObject Shell.Application
      $shell.ToggleDesktop()
    `
    await execAsync(script, { shell: 'powershell.exe' })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Lock screen
ipcMain.handle('computer:lockScreen', async () => {
  try {
    await execAsync('rundll32.exe user32.dll,LockWorkStation')
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Shutdown/restart
ipcMain.handle('computer:shutdown', async (_event, restart: boolean = false) => {
  try {
    const cmd = restart ? 'shutdown /r /t 60' : 'shutdown /s /t 60'
    await execAsync(cmd)
    return { success: true, message: `System will ${restart ? 'restart' : 'shutdown'} in 60 seconds` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Cancel shutdown
ipcMain.handle('computer:cancelShutdown', async () => {
  try {
    await execAsync('shutdown /a')
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Sleep mode
ipcMain.handle('computer:sleep', async () => {
  try {
    await execAsync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0')
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Get running processes
ipcMain.handle('computer:getProcesses', async () => {
  try {
    const { stdout } = await execAsync(
      'Get-Process | Select-Object -First 20 Name, CPU, WorkingSet | ConvertTo-Json',
      { shell: 'powershell.exe' }
    )
    return { success: true, processes: JSON.parse(stdout) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Kill process
ipcMain.handle('computer:killProcess', async (_event, processName: string) => {
  try {
    await execAsync(`taskkill /IM "${processName}" /F`)
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// Screenshot
ipcMain.handle('computer:screenshot', async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `screenshot-${timestamp}.png`
    const filepath = join(app.getPath('pictures'), filename)
    
    // Using PowerShell to capture screenshot
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.Screen]::PrimaryScreen | ForEach-Object {
        $bitmap = New-Object System.Drawing.Bitmap($_.Bounds.Width, $_.Bounds.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($_.Bounds.Location, [System.Drawing.Point]::Empty, $_.Bounds.Size)
        $bitmap.Save('${filepath.replace(/\\/g, '\\\\')}')
        $graphics.Dispose()
        $bitmap.Dispose()
      }
    `
    await execAsync(script, { shell: 'powershell.exe' })
    return { success: true, path: filepath }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// ============================================
// Open Interpreter Server Management
// ============================================
import { ChildProcess } from 'child_process'

let oiServerProcess: ChildProcess | null = null
let oiServerStatus: 'stopped' | 'starting' | 'running' | 'error' = 'stopped'

// Start OI Server
ipcMain.handle('oi:start', async () => {
  if (oiServerProcess && oiServerStatus === 'running') {
    return { success: true, message: 'OI Server already running', status: 'running' }
  }
  
  try {
    oiServerStatus = 'starting'
    
    // Path to the OI server
    const serverPath = join(__dirname, '../python/oi-server')
    const venvPython = join(serverPath, 'venv/Scripts/python.exe')
    
    // Check if venv exists, otherwise use system python
    const pythonPath = await checkFileExists(venvPython) ? venvPython : 'python'
    
    console.log(`Starting OI Server with: ${pythonPath}`)
    
    oiServerProcess = spawn(pythonPath, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8765'], {
      cwd: serverPath,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    
    oiServerProcess.stdout?.on('data', (data) => {
      console.log(`[OI Server] ${data}`)
      // Check if server started successfully
      if (data.toString().includes('Uvicorn running') || data.toString().includes('Application startup complete')) {
        oiServerStatus = 'running'
        mainWindow?.webContents.send('oi:status', { status: 'running' })
      }
    })
    
    oiServerProcess.stderr?.on('data', (data) => {
      console.error(`[OI Server Error] ${data}`)
      // Uvicorn logs to stderr normally
      if (data.toString().includes('Uvicorn running') || data.toString().includes('Application startup complete')) {
        oiServerStatus = 'running'
        mainWindow?.webContents.send('oi:status', { status: 'running' })
      }
    })
    
    oiServerProcess.on('close', (code) => {
      console.log(`[OI Server] Process exited with code ${code}`)
      oiServerStatus = code === 0 ? 'stopped' : 'error'
      oiServerProcess = null
      mainWindow?.webContents.send('oi:status', { status: oiServerStatus })
    })
    
    oiServerProcess.on('error', (err) => {
      console.error(`[OI Server] Failed to start:`, err)
      oiServerStatus = 'error'
      oiServerProcess = null
      mainWindow?.webContents.send('oi:status', { status: 'error', error: err.message })
    })
    
    // Wait a bit and check if started
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return { 
      success: oiServerStatus !== 'error', 
      status: oiServerStatus,
      message: oiServerStatus === 'starting' ? 'OI Server starting...' : 
               oiServerStatus === 'running' ? 'OI Server started' : 'Failed to start OI Server'
    }
  } catch (error) {
    oiServerStatus = 'error'
    return { success: false, error: String(error), status: 'error' }
  }
})

// Stop OI Server
ipcMain.handle('oi:stop', async () => {
  if (!oiServerProcess) {
    oiServerStatus = 'stopped'
    return { success: true, message: 'OI Server not running', status: 'stopped' }
  }
  
  try {
    oiServerProcess.kill('SIGTERM')
    oiServerProcess = null
    oiServerStatus = 'stopped'
    return { success: true, message: 'OI Server stopped', status: 'stopped' }
  } catch (error) {
    return { success: false, error: String(error), status: 'error' }
  }
})

// Get OI Server Status
ipcMain.handle('oi:status', async () => {
  return { status: oiServerStatus, running: oiServerProcess !== null }
})

// Check OI Server Health
ipcMain.handle('oi:health', async () => {
  try {
    const response = await fetch('http://127.0.0.1:8765/health')
    if (response.ok) {
      const data = await response.json()
      oiServerStatus = 'running'
      return { success: true, status: 'running', data }
    }
    return { success: false, status: oiServerStatus }
  } catch {
    return { success: false, status: oiServerStatus }
  }
})

// Helper function to check if file exists
async function checkFileExists(filepath: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises')
    await fs.access(filepath)
    return true
  } catch {
    return false
  }
}

// Cleanup on app quit
app.on('before-quit', () => {
  if (oiServerProcess) {
    console.log('Stopping OI Server on app quit...')
    oiServerProcess.kill('SIGTERM')
    oiServerProcess = null
  }
})

console.log('Jawir OS Main Process Started')
