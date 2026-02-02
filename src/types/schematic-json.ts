// Schematic JSON Types - Format yang AI generate
// AI hanya perlu output JSON sederhana ini, converter akan handle sisanya

// ============================================
// JSON INPUT TYPES (from AI)
// ============================================

export interface SchematicJSON {
    /** Project/circuit name */
    project: string
    /** Human readable description */
    description?: string
    /** Component list */
    components: ComponentJSON[]
    /** Wire connections (semantic) */
    wires: WireJSON[]
    /** Power labels */
    labels?: LabelJSON[]
}

export interface ComponentJSON {
    /** Component type from library (resistor, led, capacitor, etc) */
    type: string
    /** Reference designator (R1, D1, C1, etc) */
    reference: string
    /** Component value (10k, Red, 100uF, etc) */
    value?: string
    /** Position on schematic */
    position: {
        x: number
        y: number
    }
    /** Optional rotation override (degrees) */
    rotation?: number
}

/**
 * Wire connection - SEMANTIC format
 * AI cukup specify component dan pin, converter hitung koordinat
 */
export interface WireJSON {
    /** Source connection */
    from: ConnectionPoint
    /** Destination connection */
    to: ConnectionPoint
}

export interface ConnectionPoint {
    /** Component reference (R1, D1, etc) */
    component: string
    /** Pin number (1, 2, etc) */
    pin: number | string
}

export interface LabelJSON {
    /** Label name (VCC, GND, INPUT_A, etc) */
    name: string
    /** Position */
    x: number
    y: number
}

// ============================================
// VALIDATION
// ============================================

export function validateSchematicJSON(json: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!json || typeof json !== 'object') {
        return { valid: false, errors: ['Input must be an object'] }
    }

    const data = json as Record<string, unknown>

    // Check required fields
    if (!data.project || typeof data.project !== 'string') {
        errors.push('Missing or invalid "project" field')
    }

    if (!Array.isArray(data.components)) {
        errors.push('Missing or invalid "components" array')
    } else {
        data.components.forEach((comp, i) => {
            if (!comp.type) errors.push(`Component ${i}: missing "type"`)
            if (!comp.reference) errors.push(`Component ${i}: missing "reference"`)
            if (!comp.position?.x || !comp.position?.y) {
                errors.push(`Component ${i}: missing or invalid "position"`)
            }
        })
    }

    if (!Array.isArray(data.wires)) {
        errors.push('Missing or invalid "wires" array')
    } else {
        data.wires.forEach((wire, i) => {
            if (!wire.from?.component || !wire.from?.pin) {
                errors.push(`Wire ${i}: missing or invalid "from"`)
            }
            if (!wire.to?.component || !wire.to?.pin) {
                errors.push(`Wire ${i}: missing or invalid "to"`)
            }
        })
    }

    return { valid: errors.length === 0, errors }
}
