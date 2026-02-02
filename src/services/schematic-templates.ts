// Schematic Templates for KiCad
// Predefined templates with components and connections

export interface ComponentPlacement {
    symbol: string        // Library:SymbolName format
    reference: string     // e.g., R1, C1, U1
    value?: string        // e.g., 10k, 100nF
    position: { x: number; y: number }
}

export interface WireConnection {
    start: { x: number; y: number }
    end: { x: number; y: number }
}

export interface PinConnection {
    sourceRef: string
    sourcePin: string
    targetRef: string
    targetPin: string
}

export interface NetLabel {
    name: string
    position: { x: number; y: number }
}

export interface SchematicTemplate {
    name: string
    description: string
    components: ComponentPlacement[]
    wires: WireConnection[]
    connections: PinConnection[]
    netLabels: NetLabel[]
}

// ============================================
// PREDEFINED TEMPLATES
// ============================================

export const SCHEMATIC_TEMPLATES: Record<string, SchematicTemplate> = {
    /**
     * LED Indicator Circuit - BASED ON D:\mcpjtd\projects\LEDBoard.kicad_sch
     * 
     * Layout (all components at x=127):
     * - VCC symbol at y=66.04
     * - R1 (330R) at y=76.2  → pin1 at 72.39, pin2 at 80.01
     * - D1 (LED, 90°) at y=91.44 → pin1 at 87.63, pin2 at 95.25
     * - GND symbol at y=101.6
     * 
     * Wiring: VCC → R1.1 → R1.2 → LED.1 → LED.2 → GND
     */
    led_indicator: {
        name: 'LED Indicator',
        description: 'Simple LED indicator circuit with current limiting resistor',
        components: [
            // Components at x=127 (centered)
            { symbol: 'Device:R', reference: 'R1', value: '330R', position: { x: 127, y: 76.2 } },
            { symbol: 'Device:LED', reference: 'D1', value: 'Red', position: { x: 127, y: 91.44 } }, // Will be rotated 90° by generator
        ],
        wires: [
            // VCC (66.04) to R1 pin1 (72.39)
            { start: { x: 127, y: 66.04 }, end: { x: 127, y: 72.39 } },
            // R1 pin2 (80.01) to LED pin1 (87.63)
            { start: { x: 127, y: 80.01 }, end: { x: 127, y: 87.63 } },
            // LED pin2 (95.25) to GND (101.6)
            { start: { x: 127, y: 95.25 }, end: { x: 127, y: 101.6 } },
        ],
        connections: [],  // Using explicit wires instead
        netLabels: [],    // Using power symbols instead
    },

    /**
     * Powerbank Module - SYSTEMATIC WIRING
     * TP4056 charging IC with DW01 protection
     * 
     * COMPONENT LAYOUT (grid: 25.4mm spacing):
     * 
     *  VUSB ----+----[R_PROG]----+                    BAT+ ----[R_PROT]----+
     *           |                |                                         |
     *      [C_IN]           [R_CHG] [R_STDBY]                         [C_OUT]
     *           |                |       |                                 |
     *  GND -----+----------[LED_CHG]-[LED_STDBY]------------------+   BAT- +
     * 
     * PIN OFFSETS (KiCad standard):
     * - R/C vertical: pin1 = y-3.81, pin2 = y+3.81
     * - LED horizontal: pin1(K) = x-3.81, pin2(A) = x+3.81
     */
    powerbank: {
        name: 'Powerbank Module',
        description: 'TP4056 Li-Ion charger with DW01 protection IC',
        components: [
            // Input section - Column 1 (x=80)
            { symbol: 'Device:C', reference: 'C_IN', value: '10uF', position: { x: 80, y: 100 } },
            // Charging section - Column 2 (x=100)
            { symbol: 'Device:R', reference: 'R_PROG', value: '1.2k', position: { x: 100, y: 80 } },
            // Status LEDs - Column 3 (x=120) and Column 4 (x=145)
            { symbol: 'Device:R', reference: 'R_CHG', value: '1k', position: { x: 120, y: 100 } },
            { symbol: 'Device:LED', reference: 'LED_CHG', value: 'Red', position: { x: 120, y: 125 } },
            { symbol: 'Device:R', reference: 'R_STDBY', value: '1k', position: { x: 145, y: 100 } },
            { symbol: 'Device:LED', reference: 'LED_STDBY', value: 'Green', position: { x: 145, y: 125 } },
            // Output section - Column 5 (x=175), Column 6 (x=195)
            { symbol: 'Device:C', reference: 'C_OUT', value: '10uF', position: { x: 175, y: 100 } },
            { symbol: 'Device:R', reference: 'R_PROT', value: '100', position: { x: 195, y: 80 } },
        ],
        wires: [
            // ========== VCC RAIL (y=60) ==========
            // VUSB label to junction
            { start: { x: 60, y: 60 }, end: { x: 80, y: 60 } },
            // Junction to C_IN pin1 (y=100-3.81=96.19)
            { start: { x: 80, y: 60 }, end: { x: 80, y: 96.19 } },
            // Junction to R_PROG
            { start: { x: 80, y: 60 }, end: { x: 100, y: 60 } },
            // To R_PROG pin1 (y=80-3.81=76.19)
            { start: { x: 100, y: 60 }, end: { x: 100, y: 76.19 } },
            // Continue VCC rail to R_CHG
            { start: { x: 100, y: 60 }, end: { x: 120, y: 60 } },
            // To R_CHG pin1 (y=100-3.81=96.19)
            { start: { x: 120, y: 60 }, end: { x: 120, y: 96.19 } },
            // Continue to R_STDBY
            { start: { x: 120, y: 60 }, end: { x: 145, y: 60 } },
            // To R_STDBY pin1 (y=100-3.81=96.19)
            { start: { x: 145, y: 60 }, end: { x: 145, y: 96.19 } },
            // Continue to output section
            { start: { x: 145, y: 60 }, end: { x: 175, y: 60 } },
            // To C_OUT pin1 (y=100-3.81=96.19)
            { start: { x: 175, y: 60 }, end: { x: 175, y: 96.19 } },
            // Continue to R_PROT/BAT+
            { start: { x: 175, y: 60 }, end: { x: 195, y: 60 } },
            // To R_PROT pin1 (y=80-3.81=76.19)
            { start: { x: 195, y: 60 }, end: { x: 195, y: 76.19 } },

            // ========== LED CONNECTIONS (R to LED) ==========
            // R_CHG pin2 (y=100+3.81=103.81) to LED_CHG pin2/anode (x=120+3.81=123.81, y=125)
            { start: { x: 120, y: 103.81 }, end: { x: 120, y: 115 } },
            { start: { x: 120, y: 115 }, end: { x: 123.81, y: 115 } },
            { start: { x: 123.81, y: 115 }, end: { x: 123.81, y: 125 } },
            // R_STDBY pin2 to LED_STDBY anode
            { start: { x: 145, y: 103.81 }, end: { x: 145, y: 115 } },
            { start: { x: 145, y: 115 }, end: { x: 148.81, y: 115 } },
            { start: { x: 148.81, y: 115 }, end: { x: 148.81, y: 125 } },

            // ========== GND RAIL (y=150) ==========
            // GND label to junction
            { start: { x: 60, y: 150 }, end: { x: 80, y: 150 } },
            // C_IN pin2 (y=100+3.81=103.81) to GND
            { start: { x: 80, y: 103.81 }, end: { x: 80, y: 150 } },
            // Junction across
            { start: { x: 80, y: 150 }, end: { x: 120, y: 150 } },
            // LED_CHG cathode (x=120-3.81=116.19, y=125) to GND
            { start: { x: 116.19, y: 125 }, end: { x: 116.19, y: 150 } },
            { start: { x: 116.19, y: 150 }, end: { x: 120, y: 150 } },
            // Continue GND rail
            { start: { x: 120, y: 150 }, end: { x: 141.19, y: 150 } },
            // LED_STDBY cathode to GND
            { start: { x: 141.19, y: 125 }, end: { x: 141.19, y: 150 } },
            // Continue to output
            { start: { x: 141.19, y: 150 }, end: { x: 175, y: 150 } },
            // C_OUT pin2 to GND
            { start: { x: 175, y: 103.81 }, end: { x: 175, y: 150 } },
            // R_PROG pin2 to GND (through main rail)
            { start: { x: 100, y: 83.81 }, end: { x: 100, y: 150 } },
            { start: { x: 100, y: 150 }, end: { x: 120, y: 150 } },
            // BAT- connection
            { start: { x: 175, y: 150 }, end: { x: 195, y: 150 } },
            // R_PROT pin2 to BAT-
            { start: { x: 195, y: 83.81 }, end: { x: 195, y: 150 } },
        ],
        connections: [],  // Using wires instead
        netLabels: [
            { name: 'VUSB', position: { x: 55, y: 60 } },
            { name: 'GND', position: { x: 55, y: 150 } },
            { name: 'BAT+', position: { x: 200, y: 60 } },
            { name: 'BAT-', position: { x: 200, y: 150 } },
        ],
    },

    /**
     * PAM8403 Stereo Amplifier
     * 5V stereo class-D amplifier
     */
    amplifier: {
        name: '5V Stereo Amplifier',
        description: 'PAM8403 based 5V stereo class-D amplifier',
        components: [
            // Input section
            { symbol: 'Device:C', reference: 'C1', value: '1uF', position: { x: 60, y: 80 } },
            { symbol: 'Device:C', reference: 'C2', value: '1uF', position: { x: 60, y: 120 } },
            { symbol: 'Device:R', reference: 'R1', value: '10k', position: { x: 80, y: 80 } },
            { symbol: 'Device:R', reference: 'R2', value: '10k', position: { x: 80, y: 120 } },
            // Power section
            { symbol: 'Device:C', reference: 'C3', value: '10uF', position: { x: 100, y: 60 } },
            { symbol: 'Device:C', reference: 'C4', value: '100nF', position: { x: 120, y: 60 } },
            // Output section
            { symbol: 'Device:C', reference: 'C5', value: '470uF', position: { x: 160, y: 80 } },
            { symbol: 'Device:C', reference: 'C6', value: '470uF', position: { x: 160, y: 120 } },
        ],
        wires: [],
        connections: [],
        netLabels: [
            { name: 'VCC', position: { x: 100, y: 40 } },
            { name: 'GND', position: { x: 100, y: 140 } },
            { name: 'AIN_L', position: { x: 40, y: 80 } },
            { name: 'AIN_R', position: { x: 40, y: 120 } },
            { name: 'SPK_L+', position: { x: 180, y: 70 } },
            { name: 'SPK_L-', position: { x: 180, y: 90 } },
            { name: 'SPK_R+', position: { x: 180, y: 110 } },
            { name: 'SPK_R-', position: { x: 180, y: 130 } },
        ],
    },

    /**
     * ESP32 Fire Detection Sensor
     * DHT11 + MQ2 + Flame sensor
     */
    fire_detection: {
        name: 'Fire Detection Sensor',
        description: 'ESP32 based fire detection with DHT11, MQ2, and flame sensor',
        components: [
            // Pull-up resistors
            { symbol: 'Device:R', reference: 'R1', value: '10k', position: { x: 80, y: 80 } },
            { symbol: 'Device:R', reference: 'R2', value: '10k', position: { x: 100, y: 80 } },
            // Filter capacitors
            { symbol: 'Device:C', reference: 'C1', value: '100nF', position: { x: 60, y: 100 } },
            { symbol: 'Device:C', reference: 'C2', value: '10uF', position: { x: 80, y: 100 } },
            // Buzzer
            { symbol: 'Device:Buzzer', reference: 'BZ1', value: 'Buzzer', position: { x: 160, y: 100 } },
            { symbol: 'Device:R', reference: 'R3', value: '100', position: { x: 140, y: 100 } },
            // LED indicators
            { symbol: 'Device:LED', reference: 'D1', value: 'Red', position: { x: 180, y: 80 } },
            { symbol: 'Device:LED', reference: 'D2', value: 'Green', position: { x: 180, y: 120 } },
            { symbol: 'Device:R', reference: 'R4', value: '330', position: { x: 160, y: 80 } },
            { symbol: 'Device:R', reference: 'R5', value: '330', position: { x: 160, y: 120 } },
        ],
        wires: [],
        connections: [],
        netLabels: [
            { name: '3V3', position: { x: 60, y: 60 } },
            { name: 'GND', position: { x: 60, y: 140 } },
            { name: 'DHT_DATA', position: { x: 80, y: 60 } },
            { name: 'MQ2_AO', position: { x: 100, y: 60 } },
            { name: 'FLAME_DO', position: { x: 120, y: 60 } },
            { name: 'BUZZER', position: { x: 140, y: 60 } },
            { name: 'LED_ALARM', position: { x: 180, y: 60 } },
            { name: 'LED_STATUS', position: { x: 180, y: 140 } },
        ],
    },
}

/**
 * Get template by name
 */
export function getTemplate(templateName: string): SchematicTemplate | undefined {
    return SCHEMATIC_TEMPLATES[templateName]
}

/**
 * Get all available template names
 */
export function getTemplateNames(): string[] {
    return Object.keys(SCHEMATIC_TEMPLATES)
}

/**
 * Get template descriptions for AI prompts
 */
export function getTemplateDescriptions(): string {
    return Object.entries(SCHEMATIC_TEMPLATES)
        .map(([key, template]) => `- ${key}: ${template.description}`)
        .join('\n')
}
