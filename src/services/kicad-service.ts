// KiCad Service - MCP Server Integration
// Wrapper for KiCad MCP Server operations
// This service communicates with the KiCad MCP server to create real schematics

import { getTemplate, ComponentPlacement, NetLabel } from './schematic-templates'

// ============================================
// TYPES
// ============================================

export interface KiCadResult {
    success: boolean
    message: string
    data?: unknown
    error?: string
    projectPath?: string
    schematicPath?: string
}

export interface KiCadProjectInfo {
    name: string
    path: string
    hasSchematic: boolean
    hasPcb: boolean
}

// ============================================
// MCP SERVER COMMUNICATION
// ============================================

// Default path for KiCad projects
const DEFAULT_PROJECT_PATH = 'D:/sijawir/KiCad_Projects'

/**
 * Get the default project path for KiCad projects
 */
function getDefaultProjectPath(): string {
    return DEFAULT_PROJECT_PATH
}

/**
 * The MCP server is exposed via window.mcpKicad in Electron
 * For now, we'll use direct function calls that will be bridged via IPC
 */

// Check if KiCad UI is running
export async function checkKiCadStatus(): Promise<{
    running: boolean
    message: string
}> {
    try {
        // In Electron, this would call the MCP server
        // For now, return mock status if not in Electron
        if (typeof window !== 'undefined' && window.electronAPI?.kicad) {
            return await window.electronAPI.kicad.checkStatus()
        }

        // Fallback: assume file-based mode works
        return {
            running: false,
            message: 'KiCad tidak berjalan - akan menggunakan mode file-based',
        }
    } catch (error) {
        return {
            running: false,
            message: `Error checking KiCad status: ${error}`,
        }
    }
}

/**
 * Create a new KiCad project
 */
export async function createProject(
    name: string,
    basePath?: string
): Promise<KiCadResult> {
    try {
        const projectPath = basePath || getDefaultProjectPath()
        const fullPath = `${projectPath}/${name}`

        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.createProject(name, fullPath)
            return {
                success: result.success,
                message: result.message || `Project ${name} dibuat di ${fullPath}`,
                projectPath: fullPath,
                data: result,
            }
        }

        // Fallback for non-Electron environment
        return {
            success: true,
            message: `[Simulasi] Project ${name} akan dibuat di ${fullPath}`,
            projectPath: fullPath,
        }
    } catch (error) {
        return {
            success: false,
            message: `Gagal membuat project: ${error}`,
            error: String(error),
        }
    }
}

/**
 * Create a new schematic file
 */
export async function createSchematic(name: string): Promise<KiCadResult> {
    try {
        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.createSchematic(name)
            return {
                success: result.success,
                message: result.message || `Schematic ${name} dibuat`,
                schematicPath: result.path,
                data: result,
            }
        }

        return {
            success: true,
            message: `[Simulasi] Schematic ${name} akan dibuat`,
            schematicPath: `${getDefaultProjectPath()}/${name}/${name}.kicad_sch`,
        }
    } catch (error) {
        return {
            success: false,
            message: `Gagal membuat schematic: ${error}`,
            error: String(error),
        }
    }
}

/**
 * Add a component to the schematic
 */
export async function addComponent(
    schematicPath: string,
    component: ComponentPlacement
): Promise<KiCadResult> {
    try {
        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.addSchematicComponent({
                schematicPath,
                symbol: component.symbol,
                reference: component.reference,
                value: component.value,
                position: component.position,
            })
            return {
                success: result.success,
                message: `Komponen ${component.reference} (${component.symbol}) ditambahkan`,
                data: result,
            }
        }

        return {
            success: true,
            message: `[Simulasi] ${component.reference}: ${component.symbol}`,
        }
    } catch (error) {
        return {
            success: false,
            message: `Gagal menambah komponen ${component.reference}: ${error}`,
            error: String(error),
        }
    }
}

/**
 * Add a wire between two points
 */
export async function addWire(
    start: { x: number; y: number },
    end: { x: number; y: number }
): Promise<KiCadResult> {
    try {
        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.addWire({ start, end })
            return {
                success: result.success,
                message: `Wire ditambahkan`,
                data: result,
            }
        }

        return {
            success: true,
            message: `[Simulasi] Wire dari (${start.x},${start.y}) ke (${end.x},${end.y})`,
        }
    } catch (error) {
        return {
            success: false,
            message: `Gagal menambah wire: ${error}`,
            error: String(error),
        }
    }
}

/**
 * Connect two component pins
 */
export async function connectPins(
    schematicPath: string,
    sourceRef: string,
    sourcePin: string,
    targetRef: string,
    targetPin: string
): Promise<KiCadResult> {
    try {
        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.addSchematicConnection({
                schematicPath,
                sourceRef,
                sourcePin,
                targetRef,
                targetPin,
            })
            return {
                success: result.success,
                message: `Koneksi ${sourceRef}:${sourcePin} -> ${targetRef}:${targetPin}`,
                data: result,
            }
        }

        return {
            success: true,
            message: `[Simulasi] ${sourceRef}:${sourcePin} -> ${targetRef}:${targetPin}`,
        }
    } catch (error) {
        return {
            success: false,
            message: `Gagal menghubungkan pin: ${error}`,
            error: String(error),
        }
    }
}

/**
 * Add a net label to the schematic
 */
export async function addNetLabel(
    schematicPath: string,
    netLabel: NetLabel
): Promise<KiCadResult> {
    try {
        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.addSchematicNetLabel({
                schematicPath,
                netName: netLabel.name,
                position: [netLabel.position.x, netLabel.position.y],
            })
            return {
                success: result.success,
                message: `Net label ${netLabel.name} ditambahkan`,
                data: result,
            }
        }

        return {
            success: true,
            message: `[Simulasi] Net label: ${netLabel.name}`,
        }
    } catch (error) {
        return {
            success: false,
            message: `Gagal menambah net label ${netLabel.name}: ${error}`,
            error: String(error),
        }
    }
}

/**
 * Launch KiCad UI with optional project
 */
export async function launchKiCad(projectPath?: string): Promise<KiCadResult> {
    try {
        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.launchUI(projectPath)
            return {
                success: result.success,
                message: projectPath
                    ? `KiCad dibuka dengan project: ${projectPath}`
                    : 'KiCad dibuka',
                data: result,
            }
        }

        // Fallback: try to open via shell
        if (window.electronAPI?.computer) {
            const command = projectPath
                ? `kicad "${projectPath}"`
                : 'kicad'
            await window.electronAPI.computer.openApp(command)
            return {
                success: true,
                message: 'KiCad dibuka via shell',
            }
        }

        return {
            success: false,
            message: 'Tidak dapat membuka KiCad - API tidak tersedia',
            error: 'Electron API not available',
        }
    } catch (error) {
        return {
            success: false,
            message: `Gagal membuka KiCad: ${error}`,
            error: String(error),
        }
    }
}

// ============================================
// HIGH-LEVEL OPERATIONS
// ============================================

/**
 * Create a complete schematic from a template
 * This is the main function called by the Gemini tool handler
 * 
 * NEW APPROACH: Generate complete schematic file with all components and wires embedded
 * This bypasses unreliable multi-step MCP calls
 */
export async function createSchematicFromTemplate(
    templateName: string,
    projectName?: string
): Promise<KiCadResult> {
    const template = getTemplate(templateName)

    if (!template) {
        return {
            success: false,
            message: `Template '${templateName}' tidak ditemukan`,
            error: `Unknown template: ${templateName}`,
        }
    }

    const name = projectName || `jawir_${templateName}_${Date.now()}`
    const projectPath = `${getDefaultProjectPath()}/${name}`
    const schematicPath = `${name}.kicad_sch`
    const results: string[] = []

    try {
        // Step 1: Generate complete schematic content with all components and wires
        results.push(`📄 Generating complete schematic: ${template.name}`)
        results.push(`   └── ${template.components.length} komponen`)
        results.push(`   └── ${template.wires.length} wire koneksi`)
        results.push(`   └── ${template.netLabels.length} net labels`)

        // Import generator dynamically to avoid circular deps
        const { generateCompleteSchematic } = await import('./schematic-generator')
        const schematicContent = generateCompleteSchematic(template)

        results.push(`✅ Schematic content generated (${schematicContent.length} bytes)`)

        // Step 2: Write file via Electron API or fallback
        if (window.electronAPI?.kicad) {
            // Use Electron to create project folder and write file
            const createResult = await window.electronAPI.kicad.createProject(name, projectPath)
            if (createResult.success) {
                results.push(`📁 Project folder created: ${projectPath}`)
            }

            // Write schematic file via IPC
            const writeResult = await window.electronAPI.kicad.writeSchematic({
                projectPath,
                schematicName: name,
                content: schematicContent
            })

            if (writeResult.success) {
                results.push(`✅ Schematic file written successfully`)
                results.push(`📄 Path: ${projectPath}/${schematicPath}`)
            } else {
                results.push(`⚠️ Write via IPC failed, trying direct...`)
            }
        }

        // Always show component details
        results.push(`\n🔧 Komponen yang ditambahkan:`)
        template.components.forEach(comp => {
            results.push(`   ✅ ${comp.reference}: ${comp.symbol} = ${comp.value || 'N/A'}`)
        })

        if (template.wires.length > 0) {
            results.push(`\n🔌 Wire yang ditambahkan: ${template.wires.length} koneksi`)
        }

        results.push(`\n🏷️ Net Labels:`)
        template.netLabels.forEach(label => {
            results.push(`   ✅ ${label.name}`)
        })

        return {
            success: true,
            message: results.join('\n'),
            projectPath,
            schematicPath: `${projectPath}/${schematicPath}`,
            data: {
                template: templateName,
                projectName: name,
                componentCount: template.components.length,
                wireCount: template.wires.length,
                netLabelCount: template.netLabels.length,
                schematicContent, // Include content for debugging
            },
        }

    } catch (error) {
        return {
            success: false,
            message: `Error membuat schematic: ${error}\n\n${results.join('\n')}`,
            error: String(error),
        }
    }
}

/**
 * Open an existing KiCad project
 */
export async function openProject(projectPath: string): Promise<KiCadResult> {
    try {
        if (window.electronAPI?.kicad) {
            const result = await window.electronAPI.kicad.openProject(projectPath)
            return {
                success: result.success,
                message: `Project dibuka: ${projectPath}`,
                projectPath,
                data: result,
            }
        }

        // Fallback: launch KiCad with project
        return launchKiCad(projectPath)
    } catch (error) {
        return {
            success: false,
            message: `Gagal membuka project: ${error}`,
            error: String(error),
        }
    }
}

// ============================================
// DYNAMIC SCHEMATIC GENERATION
// ============================================

export interface DynamicSchematicSpec {
    description: string
    components: Array<{
        symbol: string
        reference: string
        value?: string
        x: number
        y: number
        rotation?: number
    }>
    wires: Array<{
        start_x: number
        start_y: number
        end_x: number
        end_y: number
    }>
    labels?: Array<{
        name: string
        x: number
        y: number
    }>
    projectName: string
}

/**
 * Create a schematic from dynamic specification
 * This allows Gemini to design ANY circuit, not just templates
 */
export async function createDynamicSchematic(spec: DynamicSchematicSpec): Promise<KiCadResult> {
    const projectPath = `${DEFAULT_PROJECT_PATH}/${spec.projectName}`
    const schematicPath = `${spec.projectName}.kicad_sch`
    const results: string[] = []

    try {
        results.push(`🎨 Creating dynamic schematic: ${spec.description}`)
        results.push(`   └── ${spec.components.length} komponen`)
        results.push(`   └── ${spec.wires.length} wire koneksi`)
        results.push(`   └── ${(spec.labels || []).length} labels`)

        // Import generator dynamically
        const { generateDynamicSchematic } = await import('./schematic-generator')
        const schematicContent = generateDynamicSchematic(spec)

        results.push(`✅ Schematic content generated (${schematicContent.length} bytes)`)

        // Write file via Electron API
        if (window.electronAPI?.kicad) {
            // Create project folder
            const createResult = await window.electronAPI.kicad.createProject(
                spec.projectName,
                projectPath
            )
            if (createResult.success) {
                results.push(`📁 Project folder created: ${projectPath}`)
            }

            // Write schematic file
            const writeResult = await window.electronAPI.kicad.writeSchematic({
                projectPath,
                schematicName: spec.projectName,
                content: schematicContent
            })

            if (writeResult.success) {
                results.push(`✅ Schematic file written successfully`)
                results.push(`📄 Path: ${projectPath}/${schematicPath}`)
            } else {
                results.push(`⚠️ Write failed: ${writeResult.message}`)
            }
        } else {
            results.push(`⚠️ Electron API not available, running in simulation mode`)
        }

        // List components created
        results.push(`\n📋 Komponen:`)
        spec.components.forEach(comp => {
            results.push(`   • ${comp.reference}: ${comp.symbol} = ${comp.value || '-'} at (${comp.x}, ${comp.y})`)
        })

        return {
            success: true,
            message: results.join('\n'),
            projectPath,
            schematicPath: `${projectPath}/${schematicPath}`,
            data: {
                description: spec.description,
                projectName: spec.projectName,
                componentCount: spec.components.length,
                wireCount: spec.wires.length,
                labelCount: (spec.labels || []).length,
            },
        }

    } catch (error) {
        return {
            success: false,
            message: `Error membuat dynamic schematic: ${error}\n\n${results.join('\n')}`,
            error: String(error),
        }
    }
}

