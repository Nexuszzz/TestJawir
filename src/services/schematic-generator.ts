// Complete Schematic Generator - LEARNED FROM REAL KICAD PROJECTS
// Generates valid KiCad .kicad_sch files with proper wiring
// Based on analysis of D:\mcpjtd\projects\ schematics

import { SchematicTemplate, getTemplate } from './schematic-templates'

// ============================================
// COMPONENT PIN CALCULATIONS
// ============================================

/**
 * KiCad Pin Offset Constants (in mm)
 * These are derived from actual KiCad symbol definitions
 */
const PIN_OFFSETS = {
  // Resistor/Capacitor/Inductor (vertical orientation, 0°)
  'Device:R': { pin1: { dx: 0, dy: -3.81 }, pin2: { dx: 0, dy: 3.81 } },
  'Device:C': { pin1: { dx: 0, dy: -3.81 }, pin2: { dx: 0, dy: 3.81 } },
  'Device:L': { pin1: { dx: 0, dy: -3.81 }, pin2: { dx: 0, dy: 3.81 } },

  // LED at 0° rotation (horizontal) - pin1 left(K), pin2 right(A)
  'Device:LED_0': { pin1: { dx: -3.81, dy: 0 }, pin2: { dx: 3.81, dy: 0 } },

  // LED at 90° rotation (vertical) - pin1 top, pin2 bottom
  // After 90° CCW rotation: pin1 becomes top, pin2 becomes bottom
  'Device:LED_90': { pin1: { dx: 0, dy: -3.81 }, pin2: { dx: 0, dy: 3.81 } },

  // LED at 270° rotation (vertical flipped) - pin1 bottom, pin2 top  
  'Device:LED_270': { pin1: { dx: 0, dy: 3.81 }, pin2: { dx: 0, dy: -3.81 } },
}

/**
 * Calculate absolute pin position for a component
 */
function getPinPosition(
  componentX: number,
  componentY: number,
  symbol: string,
  pin: 1 | 2,
  rotation: number = 0
): { x: number; y: number } {
  // Determine offset key based on symbol and rotation
  let offsetKey = symbol
  if (symbol === 'Device:LED') {
    offsetKey = `Device:LED_${rotation}`
  }

  const offsets = PIN_OFFSETS[offsetKey as keyof typeof PIN_OFFSETS] ||
    PIN_OFFSETS['Device:R'] // Default to R/C style

  const offset = pin === 1 ? offsets.pin1 : offsets.pin2

  return {
    x: componentX + offset.dx,
    y: componentY + offset.dy
  }
}

// ============================================
// SYMBOL LIBRARY DEFINITIONS (from real KiCad)
// ============================================

const SYMBOL_DEFINITIONS: Record<string, string> = {
  'Device:R': `
    (symbol "Device:R" (pin_numbers hide) (pin_names (offset 0)) (in_bom yes) (on_board yes)
      (property "Reference" "R" (at 2.032 0 90) (effects (font (size 1.27 1.27))))
      (property "Value" "R" (at 0 0 90) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at -1.778 0 90) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "R_0_1"
        (rectangle (start -1.016 -2.54) (end 1.016 2.54) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "R_1_1"
        (pin passive line (at 0 3.81 270) (length 1.27) (name "~" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 1.27) (name "~" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  'Device:C': `
    (symbol "Device:C" (pin_numbers hide) (pin_names (offset 0.254)) (in_bom yes) (on_board yes)
      (property "Reference" "C" (at 0.635 2.54 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "C" (at 0.635 -2.54 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 0.9652 -3.81 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "C_0_1"
        (polyline (pts (xy -2.032 -0.762) (xy 2.032 -0.762)) (stroke (width 0.508) (type default)) (fill (type none)))
        (polyline (pts (xy -2.032 0.762) (xy 2.032 0.762)) (stroke (width 0.508) (type default)) (fill (type none)))
      )
      (symbol "C_1_1"
        (pin passive line (at 0 3.81 270) (length 2.794) (name "~" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 2.794) (name "~" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  'Device:LED': `
    (symbol "Device:LED" (pin_numbers hide) (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
      (property "Reference" "D" (at 0 2.54 0) (effects (font (size 1.27 1.27))))
      (property "Value" "LED" (at 0 -2.54 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "LED_0_1"
        (polyline (pts (xy -1.27 -1.27) (xy -1.27 1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 0) (xy 1.27 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 1.27 -1.27) (xy 1.27 1.27) (xy -1.27 0) (xy 1.27 -1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy -3.048 -1.524) (xy -1.27 0.254)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.778 -0.762) (xy 0 1.016)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 0.254) (xy -1.778 0.254) (xy -1.778 -0.254)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 1.016) (xy -0.508 1.016) (xy -0.508 0.508)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "LED_1_1"
        (pin passive line (at -3.81 0 0) (length 2.54) (name "K" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 3.81 0 180) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  'power:GND': `
    (symbol "power:GND" (power) (pin_numbers hide) (pin_names (offset 0) hide) (in_bom yes) (on_board yes)
      (property "Reference" "#PWR" (at 0 -6.35 0) (effects (font (size 1.27 1.27)) hide))
      (property "Value" "GND" (at 0 -3.81 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "GND_0_1" (polyline (pts (xy 0 0) (xy 0 -1.27) (xy 1.27 -1.27) (xy 0 -2.54) (xy -1.27 -1.27) (xy 0 -1.27)) (stroke (width 0) (type default)) (fill (type none))))
      (symbol "GND_1_1" (pin power_in line (at 0 0 270) (length 0) (name "GND" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27))))))
    )`,
  'power:VCC': `
    (symbol "power:VCC" (power) (pin_numbers hide) (pin_names (offset 0) hide) (in_bom yes) (on_board yes)
      (property "Reference" "#PWR" (at 0 -3.81 0) (effects (font (size 1.27 1.27)) hide))
      (property "Value" "VCC" (at 0 3.81 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "VCC_0_1"
        (polyline (pts (xy -0.762 1.27) (xy 0 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 0) (xy 0 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 2.54) (xy 0.762 1.27)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "VCC_1_1" (pin power_in line (at 0 0 90) (length 0) (name "VCC" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27))))))
    )`,
}

// ============================================
// SCHEMATIC GENERATION
// ============================================

function generateUUID(): string {
  return crypto.randomUUID()
}

function generateSymbolInstance(
  libId: string,
  reference: string,
  value: string,
  x: number,
  y: number,
  rotation: number = 0,
  uuid: string
): string {
  // For reference position, adjust based on rotation
  const refOffsetY = rotation === 90 || rotation === 270 ? 0 : -5.08
  const refOffsetX = rotation === 90 ? 3.81 : (rotation === 270 ? -3.81 : 0)

  return `
  (symbol (lib_id "${libId}") (at ${x} ${y} ${rotation}) (unit 1)
    (in_bom yes) (on_board yes) (dnp no)
    (uuid ${uuid})
    (property "Reference" "${reference}" (at ${x + refOffsetX} ${y + refOffsetY} 0) (effects (font (size 1.27 1.27))))
    (property "Value" "${value}" (at ${x + refOffsetX} ${y - refOffsetY} 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "" (at ${x} ${y} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "~" (at ${x} ${y} 0) (effects (font (size 1.27 1.27)) hide))
    (pin "1" (uuid ${generateUUID()}))
    (pin "2" (uuid ${generateUUID()}))
    (instances (project "jawir" (path "/" (reference "${reference}") (unit 1))))
  )`
}

function generateWire(start: { x: number; y: number }, end: { x: number; y: number }, uuid: string): string {
  return `
  (wire (pts (xy ${start.x} ${start.y}) (xy ${end.x} ${end.y}))
    (stroke (width 0) (type default))
    (uuid ${uuid})
  )`
}

function generateLabel(name: string, x: number, y: number, uuid: string): string {
  return `
  (label "${name}" (at ${x} ${y} 0) (fields_autoplaced)
    (effects (font (size 1.27 1.27)) (justify left bottom))
    (uuid ${uuid})
  )`
}

/**
 * SMART SCHEMATIC TEMPLATE - LED Board Style
 * Based on actual D:\mcpjtd\projects\LEDBoard.kicad_sch
 * 
 * Layout: VCC (top) → R (vertical) → D (rotated 90°, vertical) → GND (bottom)
 */
function generateLEDBoardSchematic(): string {
  const schematicUUID = generateUUID()

  // Component positions (learned from real LEDBoard)
  const centerX = 127
  const vccY = 66.04
  const r1Y = 76.2      // R1 at center
  const ledY = 91.44    // LED rotated 90°
  const gndY = 101.6

  // Calculate exact pin positions
  const r1Pin1 = getPinPosition(centerX, r1Y, 'Device:R', 1)      // 127, 72.39
  const r1Pin2 = getPinPosition(centerX, r1Y, 'Device:R', 2)      // 127, 80.01
  const ledPin1 = getPinPosition(centerX, ledY, 'Device:LED', 1, 90) // 127, 87.63
  const ledPin2 = getPinPosition(centerX, ledY, 'Device:LED', 2, 90) // 127, 95.25

  const libSymbols = [
    SYMBOL_DEFINITIONS['Device:R'],
    SYMBOL_DEFINITIONS['Device:LED'],
    SYMBOL_DEFINITIONS['power:VCC'],
    SYMBOL_DEFINITIONS['power:GND'],
  ].join('\n')

  const symbols = [
    generateSymbolInstance('Device:R', 'R1', '330R', centerX, r1Y, 0, generateUUID()),
    generateSymbolInstance('Device:LED', 'D1', 'Red', centerX, ledY, 90, generateUUID()),
    // Power symbols
    `
  (symbol (lib_id "power:VCC") (at ${centerX} ${vccY} 0) (unit 1)
    (in_bom yes) (on_board yes) (dnp no)
    (uuid ${generateUUID()})
    (property "Reference" "#PWR01" (at ${centerX} ${vccY + 3.81} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Value" "VCC" (at ${centerX} ${vccY - 3.81} 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "" (at ${centerX} ${vccY} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "" (at ${centerX} ${vccY} 0) (effects (font (size 1.27 1.27)) hide))
    (pin "1" (uuid ${generateUUID()}))
    (instances (project "jawir" (path "/" (reference "#PWR01") (unit 1))))
  )`,
    `
  (symbol (lib_id "power:GND") (at ${centerX} ${gndY} 0) (unit 1)
    (in_bom yes) (on_board yes) (dnp no)
    (uuid ${generateUUID()})
    (property "Reference" "#PWR02" (at ${centerX} ${gndY + 6.35} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Value" "GND" (at ${centerX} ${gndY + 3.81} 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "" (at ${centerX} ${gndY} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "" (at ${centerX} ${gndY} 0) (effects (font (size 1.27 1.27)) hide))
    (pin "1" (uuid ${generateUUID()}))
    (instances (project "jawir" (path "/" (reference "#PWR02") (unit 1))))
  )`,
  ].join('\n')

  const wires = [
    // VCC to R1 pin1
    generateWire({ x: centerX, y: vccY }, { x: centerX, y: r1Pin1.y }, generateUUID()),
    // R1 pin2 to LED pin1
    generateWire({ x: r1Pin2.x, y: r1Pin2.y }, { x: ledPin1.x, y: ledPin1.y }, generateUUID()),
    // LED pin2 to GND
    generateWire({ x: ledPin2.x, y: ledPin2.y }, { x: centerX, y: gndY }, generateUUID()),
  ].join('\n')

  return `(kicad_sch (version 20231120) (generator "jawir-os") (generator_version "1.0")
  (uuid ${schematicUUID})
  (paper "A4")
  
  (lib_symbols
    ${libSymbols}
  )
  ${symbols}
  ${wires}
  
  (sheet_instances (path "/" (page "1")))
)`
}

/**
 * Generate a complete KiCad schematic file from a template
 * Uses proper pin calculations for wiring
 */
export function generateCompleteSchematic(template: SchematicTemplate): string {
  // For LED indicator, use the specialized generator
  if (template.name === 'LED Indicator') {
    return generateLEDBoardSchematic()
  }

  const schematicUUID = generateUUID()

  // Collect unique symbol libraries needed
  const libSymbols: Set<string> = new Set()
  template.components.forEach(comp => libSymbols.add(comp.symbol))

  // Generate lib_symbols section
  const libSymbolsContent = Array.from(libSymbols)
    .map(libId => SYMBOL_DEFINITIONS[libId] || '')
    .filter(s => s.length > 0)
    .join('\n')

  // Generate symbol instances  
  // For LED components, default to 90° rotation for vertical orientation
  const symbolInstances = template.components
    .map(comp => {
      const rotation = comp.symbol === 'Device:LED' ? 90 : 0
      return generateSymbolInstance(
        comp.symbol,
        comp.reference,
        comp.value || '',
        comp.position.x,
        comp.position.y,
        rotation,
        generateUUID()
      )
    })
    .join('\n')

  // Generate wires with proper pin calculations
  const wires = template.wires
    .map(wire => generateWire(wire.start, wire.end, generateUUID()))
    .join('\n')

  // Generate labels
  const labels = template.netLabels
    .map(label => generateLabel(label.name, label.position.x, label.position.y, generateUUID()))
    .join('\n')

  // Generate complete schematic
  return `(kicad_sch (version 20231120) (generator "jawir-os") (generator_version "1.0")
  (uuid ${schematicUUID})
  (paper "A4")
  
  (lib_symbols
    ${libSymbolsContent}
  )
  
  ${symbolInstances}
  
  ${wires}
  
  ${labels}
  
  (sheet_instances
    (path "/" (page "1"))
  )
)`
}

/**
 * Generate schematic file from template name
 */
export function generateSchematicFromTemplateName(templateName: string): { success: boolean; content?: string; error?: string } {
  const template = getTemplate(templateName)

  if (!template) {
    return {
      success: false,
      error: `Template '${templateName}' tidak ditemukan`
    }
  }

  try {
    const content = generateCompleteSchematic(template)
    return {
      success: true,
      content
    }
  } catch (error) {
    return {
      success: false,
      error: String(error)
    }
  }
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(getTemplate('led_indicator') ? { led_indicator: true, powerbank: true, amplifier: true, fire_detection: true } : {})
}

// ============================================
// DYNAMIC SCHEMATIC GENERATION
// ============================================

interface DynamicSchematicSpec {
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
 * Generate a complete KiCad schematic from dynamic specification
 * This allows Gemini to design ANY circuit, not limited to templates
 */
export function generateDynamicSchematic(spec: DynamicSchematicSpec): string {
  const schematicUUID = generateUUID()

  // Collect unique symbol libraries needed
  const libSymbols: Set<string> = new Set()
  spec.components.forEach(comp => libSymbols.add(comp.symbol))

  // Generate lib_symbols section
  const libSymbolsContent = Array.from(libSymbols)
    .map(libId => SYMBOL_DEFINITIONS[libId] || '')
    .filter(s => s.length > 0)
    .join('\n')

  // Generate symbol instances with rotation support
  const symbolInstances = spec.components
    .map(comp => {
      // For LED components, default to 90° rotation for vertical orientation if not specified
      const rotation = comp.rotation !== undefined ? comp.rotation :
        (comp.symbol === 'Device:LED' || comp.symbol === 'Device:D' ? 90 : 0)
      return generateSymbolInstance(
        comp.symbol,
        comp.reference,
        comp.value || '',
        comp.x,
        comp.y,
        rotation,
        generateUUID()
      )
    })
    .join('\n')

  // Generate wires from dynamic spec
  const wires = spec.wires
    .map(wire => generateWire(
      { x: wire.start_x, y: wire.start_y },
      { x: wire.end_x, y: wire.end_y },
      generateUUID()
    ))
    .join('\n')

  // Generate labels
  const labels = (spec.labels || [])
    .map(label => generateLabel(label.name, label.x, label.y, generateUUID()))
    .join('\n')

  // Generate complete schematic
  return `(kicad_sch (version 20231120) (generator "jawir-os") (generator_version "1.0")
  (uuid ${schematicUUID})
  (paper "A4")
  
  (lib_symbols
    ${libSymbolsContent}
  )
  
  ${symbolInstances}
  
  ${wires}
  
  ${labels}
  
  (sheet_instances
    (path "/" (page "1"))
  )
)`
}

// Export pin position calculator for use by templates
export { getPinPosition, PIN_OFFSETS }

