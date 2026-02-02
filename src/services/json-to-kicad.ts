// JSON to KiCad Converter
// Converts simple JSON from AI to valid KiCad S-expression format

import {
    SchematicJSON,
    ComponentJSON,
    WireJSON,
    LabelJSON,
    validateSchematicJSON
} from '../types/schematic-json'
import {
    COMPONENT_LIBRARY,
    getComponentDef,
    getPinPositionWithRotation,
    ComponentDefinition,
    PinDefinition
} from './kicad-library'

// ============================================
// UUID GENERATION
// ============================================

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

// Debug logging
const DEBUG = true
function log(...args: unknown[]) {
    if (DEBUG) console.log('[JSON-to-KiCad]', ...args)
}

// ============================================
// MAIN CONVERTER
// ============================================

export interface ConversionResult {
    success: boolean
    content?: string
    errors?: string[]
    debug?: string[]
}

/**
 * Convert JSON schematic to KiCad S-expression format
 */
export function convertJSONToKiCad(json: SchematicJSON): ConversionResult {
    const debugLog: string[] = []

    // Validate input
    const validation = validateSchematicJSON(json)
    if (!validation.valid) {
        return { success: false, errors: validation.errors }
    }

    try {
        const rootUUID = generateUUID()
        const projectName = json.project

        log('Starting conversion for project:', projectName)
        debugLog.push(`Project: ${projectName}`)

        // Build component map for wire routing
        const componentMap = buildComponentMap(json.components, debugLog)
        debugLog.push(`Components mapped: ${componentMap.size}`)

        // Collect unique lib symbols needed
        const libSymbols = collectLibSymbols(json.components)
        debugLog.push(`Lib symbols: ${Array.from(libSymbols).join(', ')}`)

        // Generate sections
        const libSymbolsSection = generateLibSymbolsSection(libSymbols)
        const componentsSection = generateComponentsSection(json.components, projectName, rootUUID)
        const wiresSection = generateWiresSection(json.wires, componentMap, json.components, debugLog)
        const labelsSection = generateLabelsSection(json.labels || [])

        debugLog.push(`Generated wires section length: ${wiresSection.length}`)

        // Assemble complete schematic
        const content = `(kicad_sch (version 20231120) (generator "jawir-json-converter") (generator_version "2.0")
  (uuid ${rootUUID})
  (paper "A4")
  
  (lib_symbols
${libSymbolsSection}
  )
  
${componentsSection}
  
${wiresSection}
  
${labelsSection}
  
  (sheet_instances
    (path "/" (page "1"))
  )
)`

        log('Conversion complete, content length:', content.length)
        return { success: true, content, debug: debugLog }
    } catch (error) {
        log('Conversion error:', error)
        return { success: false, errors: [`Conversion error: ${error}`], debug: debugLog }
    }
}

// ============================================
// COMPONENT MAP (for wire routing)
// ============================================

interface ComponentLocation {
    x: number
    y: number
    rotation: number
    definition: ComponentDefinition
    type: string
}

function buildComponentMap(components: ComponentJSON[], debugLog: string[]): Map<string, ComponentLocation> {
    const map = new Map<string, ComponentLocation>()

    for (const comp of components) {
        const def = getComponentDef(comp.type)
        if (def) {
            map.set(comp.reference, {
                x: comp.position.x,
                y: comp.position.y,
                rotation: comp.rotation ?? def.defaultRotation,
                definition: def,
                type: comp.type,
            })
            log(`Mapped component ${comp.reference} (${comp.type}) at (${comp.position.x}, ${comp.position.y})`)
        } else {
            debugLog.push(`WARNING: Unknown component type '${comp.type}' for ${comp.reference}`)
            log(`WARNING: Unknown component type: ${comp.type}`)
        }
    }

    return map
}

// ============================================
// LIB SYMBOLS SECTION
// ============================================

function collectLibSymbols(components: ComponentJSON[]): Set<string> {
    const symbols = new Set<string>()

    for (const comp of components) {
        const def = getComponentDef(comp.type)
        if (def) {
            symbols.add(comp.type)
        }
    }

    return symbols
}

/**
 * Generate direction rotation for pin based on position
 * Left pins: 0 (pointing right), Right pins: 180 (pointing left)
 */
function getPinRotation(direction: string): number {
    switch (direction) {
        case 'left': return 0     // Pin pointing right (→)
        case 'right': return 180  // Pin pointing left (←)
        case 'up': return 90      // Pin pointing down (↓)
        case 'down': return 270   // Pin pointing up (↑)
        default: return 0
    }
}

/**
 * Determine pin type based on pin name
 */
function inferPinType(pinName: string): string {
    const name = pinName.toUpperCase()

    // Power pins
    if (name === 'VCC' || name === '3V3' || name === '5V' || name === 'VIN' ||
        name === 'VI' || name === 'VOUT' || name === 'VO') {
        return 'power_in'
    }
    if (name === 'GND' || name === 'GND2' || name === 'GND3' || name.startsWith('GND')) {
        return 'power_in'
    }

    // Input pins
    if (name === 'EN' || name === 'RST' || name === 'RESET' || name.includes('IN')) {
        return 'input'
    }

    // Output pins
    if (name === 'Q' || name === 'OUT' || name.startsWith('OUT')) {
        return 'output'
    }

    // No connect
    if (name === 'NC') {
        return 'no_connect'
    }

    // Default: bidirectional for GPIOs
    return 'bidirectional'
}

/**
 * Generate a single pin S-expression
 */
function generatePinSExpression(pin: PinDefinition, pinLength: number = 2.54): string {
    const pinType = inferPinType(pin.name)
    const rotation = getPinRotation(pin.direction)
    const x = pin.offset.dx
    const y = pin.offset.dy

    return `        (pin ${pinType} line (at ${x.toFixed(2)} ${y.toFixed(2)} ${rotation}) (length ${pinLength})
          (name "${pin.name}" (effects (font (size 1.27 1.27))))
          (number "${pin.number}" (effects (font (size 1.27 1.27)))))`
}

/**
 * Generate complete lib_symbols section with dynamic pin generation
 */
function generateLibSymbolsSection(symbolTypes: Set<string>): string {
    const sections: string[] = []

    for (const type of symbolTypes) {
        const def = COMPONENT_LIBRARY[type]
        if (def) {
            // Generate symbol with pins
            const symbolSection = generateCompleteSymbol(def)
            sections.push(symbolSection)
        }
    }

    return sections.join('\n')
}

/**
 * Generate complete symbol definition with body and pins
 */
function generateCompleteSymbol(def: ComponentDefinition): string {
    const symbolName = def.symbol  // e.g., "RF_Module:ESP32-WROOM-32"

    // Extract only the symbol name part (after colon) for subsymbol names
    // KiCad expects: "ESP32-WROOM-32_0_1" not "RF_Module_ESP32-WROOM-32_0_1"
    const parts = symbolName.split(':')
    const bareSymbolName = parts.length > 1 ? parts[1] : parts[0]

    // Calculate body bounds from pins
    const bounds = calculateSymbolBounds(def.pins)

    // Generate pin S-expressions
    const pinDefs = def.pins.map(pin => generatePinSExpression(pin)).join('\n')

    return `    (symbol "${symbolName}" (pin_names (offset 1.016)) (exclude_from_sim no) (in_bom yes) (on_board yes)
      (property "Reference" "${def.refPrefix}" (at 0 ${bounds.maxY + 3} 0)
        (effects (font (size 1.27 1.27))))
      (property "Value" "${def.name}" (at 0 ${bounds.minY - 3} 0)
        (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0)
        (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0)
        (effects (font (size 1.27 1.27)) hide))
      (symbol "${bareSymbolName}_0_1"
        (rectangle (start ${bounds.minX + 2.54} ${bounds.maxY}) (end ${bounds.maxX - 2.54} ${bounds.minY})
          (stroke (width 0.254) (type default))
          (fill (type background)))
      )
      (symbol "${bareSymbolName}_1_1"
${pinDefs}
      )
    )`
}

/**
 * Calculate symbol body bounds from pin positions
 */
function calculateSymbolBounds(pins: PinDefinition[]): { minX: number; maxX: number; minY: number; maxY: number } {
    if (pins.length === 0) {
        return { minX: -5, maxX: 5, minY: -5, maxY: 5 }
    }

    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    for (const pin of pins) {
        minX = Math.min(minX, pin.offset.dx)
        maxX = Math.max(maxX, pin.offset.dx)
        minY = Math.min(minY, pin.offset.dy)
        maxY = Math.max(maxY, pin.offset.dy)
    }

    return { minX, maxX, minY, maxY }
}

// ============================================
// COMPONENTS SECTION
// ============================================

function generateComponentsSection(
    components: ComponentJSON[],
    projectName: string,
    rootUUID: string
): string {
    return components
        .map(comp => generateSingleComponent(comp, projectName, rootUUID))
        .join('\n')
}

function generateSingleComponent(
    comp: ComponentJSON,
    projectName: string,
    rootUUID: string
): string {
    const def = getComponentDef(comp.type)
    if (!def) {
        console.warn(`Unknown component type: ${comp.type}`)
        return ''
    }

    const compUUID = generateUUID()
    const rotation = comp.rotation ?? def.defaultRotation
    const value = comp.value || def.defaultValue

    // Calculate reference position (above component)
    const refX = comp.position.x + 2
    const refY = comp.position.y - 5

    // Calculate value position (below component)
    const valX = comp.position.x + 2
    const valY = comp.position.y + 5

    return `  (symbol (lib_id "${def.symbol}") (at ${comp.position.x} ${comp.position.y} ${rotation}) (unit 1)
    (exclude_from_sim no) (in_bom yes) (on_board yes) (dnp no)
    (uuid ${compUUID})
    (property "Reference" "${comp.reference}" (at ${refX} ${refY} 0)
      (effects (font (size 1.27 1.27))))
    (property "Value" "${value}" (at ${valX} ${valY} 0)
      (effects (font (size 1.27 1.27))))
    (property "Footprint" "" (at ${comp.position.x} ${comp.position.y} 0)
      (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "~" (at ${comp.position.x} ${comp.position.y} 0)
      (effects (font (size 1.27 1.27)) hide))
    (instances (project "${projectName}" (path "/${rootUUID}" (reference "${comp.reference}") (unit 1))))
  )`
}

// ============================================
// WIRES SECTION (with automatic pin calculation)
// ============================================

const PIN_OFFSET = 3.81 // Standard KiCad pin offset

function generateWiresSection(
    wires: WireJSON[],
    componentMap: Map<string, ComponentLocation>,
    components: ComponentJSON[],
    debugLog: string[]
): string {
    const generatedWires: string[] = []

    log(`Generating ${wires.length} wires`)
    debugLog.push(`Processing ${wires.length} wires`)

    for (let i = 0; i < wires.length; i++) {
        const wire = wires[i]
        const wireResult = generateSingleWire(wire, componentMap, components, debugLog, i)
        if (wireResult) {
            generatedWires.push(wireResult)
        }
    }

    log(`Generated ${generatedWires.length} wire segments`)
    debugLog.push(`Generated ${generatedWires.length} wire segments`)

    return generatedWires.join('\n')
}

function generateSingleWire(
    wire: WireJSON,
    componentMap: Map<string, ComponentLocation>,
    components: ComponentJSON[],
    debugLog: string[],
    wireIndex: number
): string {
    log(`Wire ${wireIndex}: ${wire.from.component}:${wire.from.pin} -> ${wire.to.component}:${wire.to.pin}`)

    // Try semantic wire generation first
    const fromPos = getPinWorldPosition(wire.from.component, wire.from.pin, componentMap, debugLog)
    const toPos = getPinWorldPosition(wire.to.component, wire.to.pin, componentMap, debugLog)

    if (fromPos && toPos) {
        debugLog.push(`Wire ${wireIndex}: (${fromPos.x}, ${fromPos.y}) -> (${toPos.x}, ${toPos.y})`)
        return generateWireRoute(fromPos, toPos)
    }

    // Fallback: use component positions with pin offset estimation
    debugLog.push(`Wire ${wireIndex}: Using fallback position calculation`)
    log(`Wire ${wireIndex}: Using fallback`)

    const fromComp = components.find(c => c.reference === wire.from.component)
    const toComp = components.find(c => c.reference === wire.to.component)

    if (fromComp && toComp) {
        // Estimate pin positions based on standard offsets
        const fromPinOffset = wire.from.pin === 1 ? -PIN_OFFSET : PIN_OFFSET
        const toPinOffset = wire.to.pin === 1 ? -PIN_OFFSET : PIN_OFFSET

        const fallbackFrom = {
            x: fromComp.position.x,
            y: fromComp.position.y + fromPinOffset
        }
        const fallbackTo = {
            x: toComp.position.x,
            y: toComp.position.y + toPinOffset
        }

        debugLog.push(`Wire ${wireIndex} fallback: (${fallbackFrom.x}, ${fallbackFrom.y}) -> (${fallbackTo.x}, ${fallbackTo.y})`)
        return generateWireRoute(fallbackFrom, fallbackTo)
    }

    debugLog.push(`Wire ${wireIndex}: FAILED - components not found`)
    log(`Wire ${wireIndex}: FAILED`)
    return ''
}

function getPinWorldPosition(
    componentRef: string,
    pinId: number | string,
    componentMap: Map<string, ComponentLocation>,
    debugLog: string[]
): { x: number; y: number } | null {
    const compLoc = componentMap.get(componentRef)
    if (!compLoc) {
        debugLog.push(`Component not found in map: ${componentRef}`)
        return null
    }

    // Find pin definition - try multiple matching strategies
    let pin: PinDefinition | undefined

    // Strategy 1: Exact number match
    pin = compLoc.definition.pins.find(p => p.number === pinId)

    // Strategy 2: Number as string/number conversion
    if (!pin) {
        pin = compLoc.definition.pins.find(p => Number(p.number) === Number(pinId))
    }

    // Strategy 3: Pin name match
    if (!pin) {
        pin = compLoc.definition.pins.find(p => p.name === String(pinId))
    }

    // Strategy 4: Just use first/second pin based on pinId
    if (!pin && compLoc.definition.pins.length >= 2) {
        const idx = Number(pinId) === 1 ? 0 : 1
        pin = compLoc.definition.pins[idx]
        debugLog.push(`Using fallback pin index ${idx} for ${componentRef}:${pinId}`)
    }

    if (!pin) {
        debugLog.push(`Pin ${pinId} not found on ${componentRef} (${compLoc.type})`)
        return null
    }

    // Calculate world position with rotation
    return getPinPositionWithRotation(compLoc.x, compLoc.y, pin, compLoc.rotation)
}

function generateWireRoute(
    from: { x: number; y: number },
    to: { x: number; y: number }
): string {
    const wireUUID = generateUUID()

    // Check if direct connection or need intermediate point
    if (Math.abs(from.x - to.x) < 0.01 || Math.abs(from.y - to.y) < 0.01) {
        // Direct horizontal or vertical line
        return `  (wire (pts (xy ${from.x} ${from.y}) (xy ${to.x} ${to.y}))
    (stroke (width 0) (type default)) (uuid ${wireUUID}))`
    } else {
        // Need L-shaped routing - go vertical first (better for KiCad), then horizontal
        const midX = from.x
        const midY = to.y
        const wireUUID2 = generateUUID()

        return `  (wire (pts (xy ${from.x} ${from.y}) (xy ${midX} ${midY}))
    (stroke (width 0) (type default)) (uuid ${wireUUID}))
  (wire (pts (xy ${midX} ${midY}) (xy ${to.x} ${to.y}))
    (stroke (width 0) (type default)) (uuid ${wireUUID2}))`
    }
}

// ============================================
// LABELS SECTION
// ============================================

function generateLabelsSection(labels: LabelJSON[]): string {
    return labels
        .map(label => {
            const labelUUID = generateUUID()
            return `  (label "${label.name}" (at ${label.x} ${label.y} 0)
    (effects (font (size 1.27 1.27)) (justify left bottom)) (uuid ${labelUUID}))`
        })
        .join('\n')
}

// ============================================
// EXPORTS
// ============================================

export { validateSchematicJSON }

