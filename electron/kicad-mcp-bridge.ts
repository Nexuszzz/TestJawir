// KiCad MCP Bridge - Electron Main Process
// Manages KiCad MCP Server as a child process and handles IPC communication
// Uses MCP Protocol (JSON-RPC 2.0) over STDIO

import { spawn, ChildProcess } from 'child_process'
import { ipcMain } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

// ============================================
// TYPES
// ============================================

interface MCPToolCallRequest {
    jsonrpc: '2.0'
    id: number
    method: 'tools/call'
    params: {
        name: string
        arguments: Record<string, unknown>
    }
}

interface MCPResponse {
    jsonrpc: '2.0'
    id: number
    result?: {
        content?: Array<{
            type: string
            text?: string
        }>
        isError?: boolean
    }
    error?: {
        code: number
        message: string
    }
}

interface BridgeResult {
    success: boolean
    data?: unknown
    error?: string
    message?: string
}

// ============================================
// MCP SERVER MANAGEMENT
// ============================================

let mcpProcess: ChildProcess | null = null
let mcpStatus: 'stopped' | 'starting' | 'running' | 'error' = 'stopped'
let responseBuffer = ''
let requestId = 0
let pendingRequests: Map<number, {
    resolve: (value: BridgeResult) => void
    timeout: NodeJS.Timeout
}> = new Map()

// Configuration
function getConfig() {
    return {
        MCP_SERVER_PATH: process.env.KICAD_MCP_SERVER_PATH ||
            join(__dirname, '../../KiCAD-MCP-Server/dist/index.js'),
        KICAD_PYTHON_PATH: process.env.KICAD_PYTHON_PATH ||
            'D:\\el download semua\\kicad\\bin\\python.exe',
        PYTHONPATH: process.env.PYTHONPATH ||
            'D:\\el download semua\\kicad\\bin\\Lib\\site-packages',
        KICAD_PROJECTS_PATH: process.env.KICAD_PROJECTS_PATH ||
            'D:/sijawir/KiCad_Projects'
    }
}

/**
 * Start the KiCad MCP Server process
 */
async function startMCPServer(): Promise<BridgeResult> {
    if (mcpProcess && mcpStatus === 'running') {
        return { success: true, message: 'MCP Server already running' }
    }

    const config = getConfig()

    // Check if MCP server exists
    if (!existsSync(config.MCP_SERVER_PATH)) {
        console.error(`[KiCad MCP] Server not found at: ${config.MCP_SERVER_PATH}`)
        mcpStatus = 'error'
        return {
            success: false,
            error: `MCP Server not found at: ${config.MCP_SERVER_PATH}`
        }
    }

    console.log(`[KiCad MCP] Starting server: ${config.MCP_SERVER_PATH}`)
    console.log(`[KiCad MCP] Python: ${config.KICAD_PYTHON_PATH}`)
    console.log(`[KiCad MCP] PYTHONPATH: ${config.PYTHONPATH}`)
    mcpStatus = 'starting'

    return new Promise((resolve) => {
        try {
            mcpProcess = spawn('node', [config.MCP_SERVER_PATH], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: config.KICAD_PROJECTS_PATH, // Set working directory for schematic creation
                env: {
                    ...process.env,
                    PYTHONPATH: config.PYTHONPATH,
                    KICAD_PYTHON: config.KICAD_PYTHON_PATH,
                },
                shell: true,
            })

            // Handle stdout - MCP responses (line-delimited JSON)
            mcpProcess.stdout?.on('data', (data: Buffer) => {
                handleMCPData(data)
            })

            // Handle stderr - logs
            mcpProcess.stderr?.on('data', (data: Buffer) => {
                const message = data.toString().trim()
                if (message) {
                    console.log(`[KiCad MCP] ${message}`)
                }
            })

            mcpProcess.on('close', (code) => {
                console.log(`[KiCad MCP] Process exited with code ${code}`)
                mcpStatus = 'stopped'
                mcpProcess = null
                // Reject all pending requests
                pendingRequests.forEach((pending, id) => {
                    clearTimeout(pending.timeout)
                    pending.resolve({ success: false, error: 'MCP Server closed' })
                })
                pendingRequests.clear()
            })

            mcpProcess.on('error', (err) => {
                console.error(`[KiCad MCP] Process error:`, err)
                mcpStatus = 'error'
                resolve({ success: false, error: err.message })
            })

            // Wait for server to be ready
            setTimeout(() => {
                if (mcpProcess && !mcpProcess.killed) {
                    mcpStatus = 'running'
                    console.log(`[KiCad MCP] Server started successfully`)
                    resolve({ success: true, message: 'MCP Server started' })
                } else {
                    resolve({ success: false, error: 'Server failed to start' })
                }
            }, 2000)

        } catch (error) {
            console.error(`[KiCad MCP] Failed to start:`, error)
            mcpStatus = 'error'
            resolve({ success: false, error: String(error) })
        }
    })
}

/**
 * Stop the MCP Server
 */
function stopMCPServer(): BridgeResult {
    if (!mcpProcess) {
        mcpStatus = 'stopped'
        return { success: true, message: 'MCP Server not running' }
    }

    try {
        mcpProcess.kill('SIGTERM')
        mcpProcess = null
        mcpStatus = 'stopped'
        return { success: true, message: 'MCP Server stopped' }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

/**
 * Handle incoming data from MCP server
 */
function handleMCPData(data: Buffer): void {
    responseBuffer += data.toString()

    // Try to parse line-delimited JSON
    const lines = responseBuffer.split('\n')
    responseBuffer = lines.pop() || '' // Keep incomplete line in buffer

    for (const line of lines) {
        if (!line.trim()) continue

        try {
            const response = JSON.parse(line) as MCPResponse

            if (response.id !== undefined && pendingRequests.has(response.id)) {
                const pending = pendingRequests.get(response.id)!
                pendingRequests.delete(response.id)
                clearTimeout(pending.timeout)

                if (response.error) {
                    pending.resolve({
                        success: false,
                        error: response.error.message
                    })
                } else if (response.result) {
                    // Extract text from content array
                    const textContent = response.result.content
                        ?.filter(c => c.type === 'text')
                        ?.map(c => c.text)
                        ?.join('\n')

                    pending.resolve({
                        success: !response.result.isError,
                        data: response.result,
                        message: textContent || 'Operation completed'
                    })
                } else {
                    pending.resolve({ success: true })
                }
            }
        } catch (e) {
            // Not valid JSON, ignore
            console.log(`[KiCad MCP] Non-JSON output: ${line.substring(0, 100)}`)
        }
    }
}

/**
 * Call an MCP tool
 */
async function callMCPTool(toolName: string, args: Record<string, unknown>): Promise<BridgeResult> {
    // Ensure server is running
    if (!mcpProcess || mcpStatus !== 'running') {
        const startResult = await startMCPServer()
        if (!startResult.success) {
            return startResult
        }
    }

    if (!mcpProcess?.stdin) {
        return { success: false, error: 'MCP Server stdin not available' }
    }

    const id = ++requestId

    const request: MCPToolCallRequest = {
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: {
            name: toolName,
            arguments: args
        }
    }

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            pendingRequests.delete(id)
            resolve({ success: false, error: 'Request timeout (30s)' })
        }, 30000)

        pendingRequests.set(id, { resolve, timeout })

        const requestStr = JSON.stringify(request) + '\n'
        console.log(`[KiCad MCP] Calling tool: ${toolName}`)
        mcpProcess!.stdin!.write(requestStr)
    })
}

// ============================================
// IPC HANDLERS
// ============================================

export function initKiCadMCPBridge(): void {
    console.log('[KiCad MCP Bridge] Initializing...')

    // Check server status
    ipcMain.handle('kicad:checkStatus', async () => {
        return {
            success: true,
            running: mcpStatus === 'running',
            status: mcpStatus,
            message: `KiCad MCP Server is ${mcpStatus}`,
        }
    })

    // Start MCP Server
    ipcMain.handle('kicad:startServer', async () => {
        return await startMCPServer()
    })

    // Stop MCP Server  
    ipcMain.handle('kicad:stopServer', async () => {
        return stopMCPServer()
    })

    // Create project
    ipcMain.handle('kicad:createProject', async (_event, name: string, path: string) => {
        return await callMCPTool('create_project', { name, path })
    })

    // Create schematic
    ipcMain.handle('kicad:createSchematic', async (_event, name: string) => {
        return await callMCPTool('create_schematic', { name })
    })

    // Add component to schematic
    ipcMain.handle('kicad:addSchematicComponent', async (_event, params: {
        schematicPath: string
        symbol: string
        reference: string
        value?: string
        position: { x: number; y: number }
    }) => {
        return await callMCPTool('add_schematic_component', {
            schematicPath: params.schematicPath,
            symbol: params.symbol,
            reference: params.reference,
            value: params.value,
            position: params.position,
        })
    })

    // Add wire
    ipcMain.handle('kicad:addWire', async (_event, params: {
        start: { x: number; y: number }
        end: { x: number; y: number }
    }) => {
        return await callMCPTool('add_wire', params)
    })

    // Add connection between pins
    ipcMain.handle('kicad:addSchematicConnection', async (_event, params: {
        schematicPath: string
        sourceRef: string
        sourcePin: string
        targetRef: string
        targetPin: string
    }) => {
        return await callMCPTool('add_schematic_connection', params)
    })

    // Add net label
    ipcMain.handle('kicad:addSchematicNetLabel', async (_event, params: {
        schematicPath: string
        netName: string
        position: number[]
    }) => {
        return await callMCPTool('add_schematic_net_label', params)
    })

    // Launch KiCad UI
    ipcMain.handle('kicad:launchUI', async (_event, projectPath?: string) => {
        return await callMCPTool('launch_kicad_ui', { projectPath })
    })

    // Open project
    ipcMain.handle('kicad:openProject', async (_event, path: string) => {
        return await callMCPTool('open_project', { filename: path })
    })

    // Generic MCP tool call (for direct tool access)
    ipcMain.handle('kicad:call', async (_event, toolName: string, params: Record<string, unknown>) => {
        return await callMCPTool(toolName, params)
    })

    // Write schematic file directly (bypasses MCP for reliability)
    ipcMain.handle('kicad:writeSchematic', async (_event, params: {
        projectPath: string
        schematicName: string
        content: string
    }) => {
        const fs = require('fs')
        const path = require('path')

        try {
            // Ensure project directory exists
            if (!fs.existsSync(params.projectPath)) {
                fs.mkdirSync(params.projectPath, { recursive: true })
            }

            // Write schematic file
            const schematicPath = path.join(params.projectPath, `${params.schematicName}.kicad_sch`)
            fs.writeFileSync(schematicPath, params.content, 'utf8')

            // Also create empty .kicad_pro file if doesn't exist
            const proPath = path.join(params.projectPath, `${params.schematicName}.kicad_pro`)
            if (!fs.existsSync(proPath)) {
                const proContent = `{
  "board": {
    "3dviewports": [],
    "design_settings": {},
    "layer_presets": [],
    "viewports": []
  },
  "boards": [],
  "cvpcb": {
    "equivalence_files": []
  },
  "libraries": {
    "pinned_footprint_libs": [],
    "pinned_symbol_libs": []
  },
  "meta": {
    "filename": "${params.schematicName}.kicad_pro",
    "version": 1
  },
  "net_settings": {
    "classes": []
  },
  "pcbnew": {
    "last_paths": {}
  },
  "schematic": {
    "annotate_start_num": 0,
    "drawing": {},
    "legacy_lib_dir": "",
    "legacy_lib_list": [],
    "ngspice": {},
    "page_layout_descr_file": ""
  },
  "sheets": [
    [
      "e63e39d7-6ac0-4ffd-8aa3-1841a4541b55",
      "Root"
    ]
  ],
  "text_variables": {}
}`
                fs.writeFileSync(proPath, proContent, 'utf8')
            }

            console.log(`[KiCad MCP Bridge] Schematic written to: ${schematicPath}`)
            return {
                success: true,
                message: `Schematic saved to ${schematicPath}`,
                schematicPath,
            }
        } catch (error) {
            console.error('[KiCad MCP Bridge] Error writing schematic:', error)
            return {
                success: false,
                message: String(error),
            }
        }
    })

    console.log('[KiCad MCP Bridge] Initialized successfully')
}

// Cleanup function
export function cleanupKiCadMCPBridge(): void {
    if (mcpProcess) {
        console.log('[KiCad MCP Bridge] Stopping server on cleanup...')
        mcpProcess.kill('SIGTERM')
        mcpProcess = null
    }
}
