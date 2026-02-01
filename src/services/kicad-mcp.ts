// KiCad MCP Client
// Connects to KiCAD-MCP-Server via MCP protocol
// Documentation: https://github.com/mixelpixx/KiCAD-MCP-Server

export interface SchematicTemplate {
  id: string
  name: string
  description: string
  components: SchematicComponent[]
  connections: SchematicConnection[]
}

export interface SchematicComponent {
  ref: string
  value: string
  footprint: string
  library: string
  position?: { x: number; y: number }
}

export interface SchematicConnection {
  from: { ref: string; pin: string }
  to: { ref: string; pin: string }
}

export interface CreateSchematicResult {
  success: boolean
  projectPath?: string
  schematicPath?: string
  error?: string
}

// Predefined templates
const TEMPLATES: Record<string, SchematicTemplate> = {
  powerbank: {
    id: 'powerbank',
    name: 'Modul Powerbank',
    description: 'TP4056 charging + DW01 protection circuit',
    components: [
      { ref: 'U1', value: 'TP4056', footprint: 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', library: 'Device' },
      { ref: 'U2', value: 'DW01', footprint: 'Package_SO:SOIC-6_1.53x1.27mm_P0.65mm', library: 'Device' },
      { ref: 'Q1', value: 'FS8205A', footprint: 'Package_SO:TSSOP-8_3x3mm_P0.65mm', library: 'Device' },
      { ref: 'J1', value: 'Micro_USB', footprint: 'Connector_USB:USB_Micro-B_Molex_105017-0001', library: 'Connector' },
      { ref: 'BT1', value: '18650', footprint: 'Battery:BatteryHolder_Keystone_1042_1x18650', library: 'Device' },
      { ref: 'R1', value: '1k2', footprint: 'Resistor_SMD:R_0603_1608Metric', library: 'Device' },
      { ref: 'R2', value: '100', footprint: 'Resistor_SMD:R_0603_1608Metric', library: 'Device' },
      { ref: 'C1', value: '10uF', footprint: 'Capacitor_SMD:C_0805_2012Metric', library: 'Device' },
      { ref: 'C2', value: '10uF', footprint: 'Capacitor_SMD:C_0805_2012Metric', library: 'Device' },
    ],
    connections: [
      { from: { ref: 'J1', pin: 'VBUS' }, to: { ref: 'U1', pin: 'VIN' } },
      { from: { ref: 'U1', pin: 'BAT' }, to: { ref: 'U2', pin: 'VDD' } },
      { from: { ref: 'U2', pin: 'CS' }, to: { ref: 'Q1', pin: 'G1' } },
      { from: { ref: 'BT1', pin: '+' }, to: { ref: 'U1', pin: 'BAT' } },
      { from: { ref: 'BT1', pin: '-' }, to: { ref: 'Q1', pin: 'S2' } },
    ],
  },
  amplifier: {
    id: 'amplifier',
    name: 'Amplifier 5V',
    description: 'PAM8403 stereo amplifier',
    components: [
      { ref: 'U1', value: 'PAM8403', footprint: 'Package_SO:SOP-16_3.9x9.9mm_P1.27mm', library: 'Audio' },
      { ref: 'J1', value: '3.5mm_Audio', footprint: 'Connector_Audio:Jack_3.5mm_Ledino_KB3SPRS', library: 'Connector' },
      { ref: 'LS1', value: 'Speaker_L', footprint: 'Connector_Wire:SolderWirePad_1x02_P3.81mm_Drill0.8mm', library: 'Device' },
      { ref: 'LS2', value: 'Speaker_R', footprint: 'Connector_Wire:SolderWirePad_1x02_P3.81mm_Drill0.8mm', library: 'Device' },
      { ref: 'RV1', value: '10k', footprint: 'Potentiometer_THT:Potentiometer_Bourns_3296W_Vertical', library: 'Device' },
      { ref: 'C1', value: '10uF', footprint: 'Capacitor_SMD:C_0805_2012Metric', library: 'Device' },
      { ref: 'C2', value: '100nF', footprint: 'Capacitor_SMD:C_0402_1005Metric', library: 'Device' },
      { ref: 'C3', value: '1uF', footprint: 'Capacitor_SMD:C_0603_1608Metric', library: 'Device' },
      { ref: 'C4', value: '1uF', footprint: 'Capacitor_SMD:C_0603_1608Metric', library: 'Device' },
    ],
    connections: [
      { from: { ref: 'J1', pin: 'TIP' }, to: { ref: 'RV1', pin: '1' } },
      { from: { ref: 'RV1', pin: '2' }, to: { ref: 'U1', pin: 'INL' } },
      { from: { ref: 'U1', pin: 'OUTL+' }, to: { ref: 'LS1', pin: '1' } },
      { from: { ref: 'U1', pin: 'OUTR+' }, to: { ref: 'LS2', pin: '1' } },
    ],
  },
  led_indicator: {
    id: 'led_indicator',
    name: 'LED Indicator',
    description: 'LED dengan resistor pembatas',
    components: [
      { ref: 'D1', value: 'LED_Red', footprint: 'LED_SMD:LED_0603_1608Metric', library: 'Device' },
      { ref: 'R1', value: '330', footprint: 'Resistor_SMD:R_0603_1608Metric', library: 'Device' },
      { ref: 'J1', value: 'Conn_01x02', footprint: 'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', library: 'Connector' },
    ],
    connections: [
      { from: { ref: 'J1', pin: '1' }, to: { ref: 'R1', pin: '1' } },
      { from: { ref: 'R1', pin: '2' }, to: { ref: 'D1', pin: 'A' } },
      { from: { ref: 'D1', pin: 'K' }, to: { ref: 'J1', pin: '2' } },
    ],
  },
}

/**
 * Get available templates
 */
export function getTemplates(): SchematicTemplate[] {
  return Object.values(TEMPLATES)
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): SchematicTemplate | null {
  return TEMPLATES[templateId] || null
}

/**
 * Generate KiCad schematic content from template
 */
export function generateSchematicContent(template: SchematicTemplate): string {
  const uuid = generateUUID()
  
  // Generate component symbols
  const symbolsContent = template.components.map((comp, idx) => {
    const x = 100 + (idx % 4) * 50
    const y = 100 + Math.floor(idx / 4) * 40
    return `
  (symbol (lib_id "${comp.library}:${comp.value}")
    (at ${x} ${y} 0)
    (unit 1)
    (uuid "${generateUUID()}")
    (property "Reference" "${comp.ref}" (at ${x} ${y - 5} 0))
    (property "Value" "${comp.value}" (at ${x} ${y + 5} 0))
    (property "Footprint" "${comp.footprint}" (at ${x} ${y + 10} 0))
  )`
  }).join('\n')
  
  return `(kicad_sch (version 20231120) (generator "jawir-os")
  (uuid "${uuid}")
  (paper "A4")
  
  (title_block
    (title "${template.name}")
    (date "${new Date().toISOString().split('T')[0]}")
    (company "Jawir OS - Generated")
    (comment 1 "${template.description}")
  )
${symbolsContent}
)`
}

/**
 * Create schematic project via MCP
 * (Simulated - actual implementation would use MCP protocol)
 */
export async function createSchematic(
  templateId: string,
  projectName: string
): Promise<CreateSchematicResult> {
  const template = getTemplate(templateId)
  
  if (!template) {
    return {
      success: false,
      error: `Template "${templateId}" tidak ditemukan`,
    }
  }
  
  // Generate schematic content
  const content = generateSchematicContent(template)
  
  // TODO: In real implementation, save content to file via MCP server
  console.log('Generated schematic content:', content.substring(0, 100) + '...')
  
  // In real implementation, this would call MCP server
  // For now, return simulated success
  return {
    success: true,
    projectPath: `~/Documents/KiCad/${projectName}`,
    schematicPath: `~/Documents/KiCad/${projectName}/${projectName}.kicad_sch`,
  }
}

/**
 * Open project in KiCad
 */
export async function openInKiCad(projectPath: string): Promise<boolean> {
  if (window.electronAPI) {
    try {
      await window.electronAPI.openApp(projectPath)
      return true
    } catch {
      return false
    }
  }
  return false
}

/**
 * Generate UUID for KiCad
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
