// KiCad Component Library - Pin Definitions & Symbol Templates
// This file contains all component definitions that AI can reference
// AI hanya perlu specify component type, converter akan handle sisanya

// ============================================
// TYPES
// ============================================

export interface PinDefinition {
  number: number | string
  name: string
  /** Offset from component center (mm) */
  offset: { dx: number; dy: number }
  /** Direction pin faces at rotation 0 */
  direction: 'up' | 'down' | 'left' | 'right'
}

export interface ComponentDefinition {
  /** Component type ID for AI reference */
  type: string
  /** KiCad library:symbol format */
  symbol: string
  /** Human readable name */
  name: string
  /** Default value if not specified */
  defaultValue: string
  /** Reference prefix (R, C, D, U, etc) */
  refPrefix: string
  /** Pin definitions */
  pins: PinDefinition[]
  /** Default rotation (degrees) - untuk orientasi paling natural */
  defaultRotation: number
  /** S-expression template for lib_symbols */
  libSymbolDef: string
}

// ============================================
// PIN OFFSET CONSTANTS (based on KiCad standards)
// ============================================

/** Standard pin length is 2.54mm, offset from center is 3.81mm */
const PIN_OFFSET = 3.81

// ============================================
// COMPONENT DEFINITIONS
// ============================================

export const COMPONENT_LIBRARY: Record<string, ComponentDefinition> = {
  // ----------------------------------------
  // PASSIVE COMPONENTS
  // ----------------------------------------

  resistor: {
    type: 'resistor',
    symbol: 'Device:R',
    name: 'Resistor',
    defaultValue: '10k',
    refPrefix: 'R',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: 0, dy: -PIN_OFFSET }, direction: 'up' },
      { number: 2, name: '2', offset: { dx: 0, dy: PIN_OFFSET }, direction: 'down' },
    ],
    libSymbolDef: `
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
  },

  capacitor: {
    type: 'capacitor',
    symbol: 'Device:C',
    name: 'Capacitor',
    defaultValue: '100nF',
    refPrefix: 'C',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: 0, dy: -PIN_OFFSET }, direction: 'up' },
      { number: 2, name: '2', offset: { dx: 0, dy: PIN_OFFSET }, direction: 'down' },
    ],
    libSymbolDef: `
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
  },

  capacitor_polarized: {
    type: 'capacitor_polarized',
    symbol: 'Device:CP',
    name: 'Polarized Capacitor',
    defaultValue: '100uF',
    refPrefix: 'C',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '+', offset: { dx: 0, dy: -PIN_OFFSET }, direction: 'up' },
      { number: 2, name: '-', offset: { dx: 0, dy: PIN_OFFSET }, direction: 'down' },
    ],
    libSymbolDef: `
    (symbol "Device:CP" (pin_numbers hide) (pin_names (offset 0.254)) (in_bom yes) (on_board yes)
      (property "Reference" "C" (at 0.635 2.54 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "CP" (at 0.635 -2.54 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 0.9652 -3.81 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "CP_0_1"
        (rectangle (start -2.286 0.508) (end 2.286 1.016) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.778 2.286) (xy -0.762 2.286)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 2.794) (xy -1.27 1.778)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -2.032 -0.762) (xy 2.032 -0.762)) (stroke (width 0.508) (type default)) (fill (type none)))
      )
      (symbol "CP_1_1"
        (pin passive line (at 0 3.81 270) (length 2.794) (name "~" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 2.794) (name "~" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  inductor: {
    type: 'inductor',
    symbol: 'Device:L',
    name: 'Inductor',
    defaultValue: '10uH',
    refPrefix: 'L',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: 0, dy: -PIN_OFFSET }, direction: 'up' },
      { number: 2, name: '2', offset: { dx: 0, dy: PIN_OFFSET }, direction: 'down' },
    ],
    libSymbolDef: `
    (symbol "Device:L" (pin_numbers hide) (pin_names (offset 1.016)) (in_bom yes) (on_board yes)
      (property "Reference" "L" (at -1.016 0 90) (effects (font (size 1.27 1.27))))
      (property "Value" "L" (at 1.524 0 90) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "L_0_1"
        (arc (start 0 -2.54) (mid 0.6323 -1.905) (end 0 -1.27) (stroke (width 0) (type default)) (fill (type none)))
        (arc (start 0 -1.27) (mid 0.6323 -0.635) (end 0 0) (stroke (width 0) (type default)) (fill (type none)))
        (arc (start 0 0) (mid 0.6323 0.635) (end 0 1.27) (stroke (width 0) (type default)) (fill (type none)))
        (arc (start 0 1.27) (mid 0.6323 1.905) (end 0 2.54) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "L_1_1"
        (pin passive line (at 0 3.81 270) (length 1.27) (name "~" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 1.27) (name "~" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // SEMICONDUCTOR - DIODES
  // ----------------------------------------

  led: {
    type: 'led',
    symbol: 'Device:LED',
    name: 'LED',
    defaultValue: 'Red',
    refPrefix: 'D',
    defaultRotation: 90, // Vertical orientation
    // LED pins are HORIZONTAL in KiCad Device:LED symbol
    // Pin 1 (Cathode K) at LEFT, Pin 2 (Anode A) at RIGHT
    pins: [
      { number: 1, name: 'K', offset: { dx: -PIN_OFFSET, dy: 0 }, direction: 'left' },   // Cathode at left
      { number: 2, name: 'A', offset: { dx: PIN_OFFSET, dy: 0 }, direction: 'right' },   // Anode at right
    ],
    libSymbolDef: `
    (symbol "Device:LED" (pin_numbers hide) (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
      (property "Reference" "D" (at 0 2.54 0) (effects (font (size 1.27 1.27))))
      (property "Value" "LED" (at 0 -2.54 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "LED_0_1"
        (polyline (pts (xy -1.27 -1.27) (xy -1.27 1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 0) (xy 1.27 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 1.27 -1.27) (xy 1.27 1.27) (xy -1.27 0) (xy 1.27 -1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy -3.048 -1.524) (xy -1.778 -2.794)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.524 -1.524) (xy -0.254 -2.794)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "LED_1_1"
        (pin passive line (at -3.81 0 0) (length 2.54) (name "K" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 3.81 0 180) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  diode: {
    type: 'diode',
    symbol: 'Device:D',
    name: 'Diode',
    defaultValue: '1N4148',
    refPrefix: 'D',
    defaultRotation: 90,
    // Diode pins are HORIZONTAL in KiCad Device:D symbol
    pins: [
      { number: 1, name: 'K', offset: { dx: -PIN_OFFSET, dy: 0 }, direction: 'left' },   // Cathode at left
      { number: 2, name: 'A', offset: { dx: PIN_OFFSET, dy: 0 }, direction: 'right' },   // Anode at right
    ],
    libSymbolDef: `
    (symbol "Device:D" (pin_numbers hide) (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
      (property "Reference" "D" (at 0 2.54 0) (effects (font (size 1.27 1.27))))
      (property "Value" "D" (at 0 -2.54 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "D_0_1"
        (polyline (pts (xy -1.27 1.27) (xy -1.27 -1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 1.27 0) (xy -1.27 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 1.27 1.27) (xy 1.27 -1.27) (xy -1.27 0) (xy 1.27 1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "D_1_1"
        (pin passive line (at -3.81 0 0) (length 2.54) (name "K" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 3.81 0 180) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  zener: {
    type: 'zener',
    symbol: 'Device:D_Zener',
    name: 'Zener Diode',
    defaultValue: '5.1V',
    refPrefix: 'D',
    defaultRotation: 90,
    // Zener pins are HORIZONTAL in KiCad Device:D_Zener symbol
    pins: [
      { number: 1, name: 'K', offset: { dx: -PIN_OFFSET, dy: 0 }, direction: 'left' },   // Cathode at left
      { number: 2, name: 'A', offset: { dx: PIN_OFFSET, dy: 0 }, direction: 'right' },   // Anode at right
    ],
    libSymbolDef: `
    (symbol "Device:D_Zener" (pin_numbers hide) (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
      (property "Reference" "D" (at 0 2.54 0) (effects (font (size 1.27 1.27))))
      (property "Value" "D_Zener" (at 0 -2.54 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "D_Zener_0_1"
        (polyline (pts (xy 1.27 0) (xy -1.27 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 -1.27) (xy -1.27 1.27) (xy -0.762 1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 1.27 -1.27) (xy 1.27 1.27) (xy -1.27 0) (xy 1.27 -1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "D_Zener_1_1"
        (pin passive line (at -3.81 0 0) (length 2.54) (name "K" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 3.81 0 180) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // POWER SYMBOLS
  // ----------------------------------------

  vcc: {
    type: 'vcc',
    symbol: 'power:VCC',
    name: 'VCC Power',
    defaultValue: 'VCC',
    refPrefix: '#PWR',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'VCC', offset: { dx: 0, dy: 0 }, direction: 'down' },
    ],
    libSymbolDef: `
    (symbol "power:VCC" (power) (pin_names (offset 0)) (in_bom yes) (on_board yes)
      (property "Reference" "#PWR" (at 0 -3.81 0) (effects (font (size 1.27 1.27)) hide))
      (property "Value" "VCC" (at 0 3.556 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "VCC_0_1"
        (polyline (pts (xy -0.762 1.27) (xy 0 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 0) (xy 0 1.27)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 1.27) (xy 0.762 1.27)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 1.27) (xy 0 2.54) (xy -0.762 1.27)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "VCC_1_1"
        (pin power_in line (at 0 0 90) (length 0) (name "VCC" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  gnd: {
    type: 'gnd',
    symbol: 'power:GND',
    name: 'Ground',
    defaultValue: 'GND',
    refPrefix: '#PWR',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'GND', offset: { dx: 0, dy: 0 }, direction: 'up' },
    ],
    libSymbolDef: `
    (symbol "power:GND" (power) (pin_names (offset 0)) (in_bom yes) (on_board yes)
      (property "Reference" "#PWR" (at 0 -6.35 0) (effects (font (size 1.27 1.27)) hide))
      (property "Value" "GND" (at 0 -3.81 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "GND_0_1"
        (polyline (pts (xy 0 0) (xy 0 -1.27) (xy 1.27 -1.27) (xy 0 -2.54) (xy -1.27 -1.27) (xy 0 -1.27)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "GND_1_1"
        (pin power_in line (at 0 0 270) (length 0) (name "GND" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // ACTIVE COMPONENTS - OpAmps
  // ----------------------------------------

  opamp: {
    type: 'opamp',
    symbol: 'Amplifier_Operational:LM358',
    name: 'OpAmp LM358',
    defaultValue: 'LM358',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'OUT1', offset: { dx: 5.08, dy: 2.54 }, direction: 'right' },
      { number: 2, name: 'IN1-', offset: { dx: -5.08, dy: 0 }, direction: 'left' },
      { number: 3, name: 'IN1+', offset: { dx: -5.08, dy: 2.54 }, direction: 'left' },
      { number: 4, name: 'VEE', offset: { dx: 0, dy: -5.08 }, direction: 'down' },
      { number: 5, name: 'IN2+', offset: { dx: -5.08, dy: -2.54 }, direction: 'left' },
      { number: 6, name: 'IN2-', offset: { dx: -5.08, dy: -5.08 }, direction: 'left' },
      { number: 7, name: 'OUT2', offset: { dx: 5.08, dy: -2.54 }, direction: 'right' },
      { number: 8, name: 'VCC', offset: { dx: 0, dy: 5.08 }, direction: 'up' },
    ],
    libSymbolDef: `
    (symbol "Amplifier_Operational:LM358" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 5.08 0) (effects (font (size 1.27 1.27))))
      (property "Value" "LM358" (at 0 -5.08 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "http://www.ti.com/lit/ds/symlink/lm358.pdf" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "LM358_1_1"
        (polyline (pts (xy -5.08 5.08) (xy 5.08 0) (xy -5.08 -5.08) (xy -5.08 5.08)) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin output line (at 7.62 0 180) (length 2.54) (name "~" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin input line (at -7.62 -2.54 0) (length 2.54) (name "-" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin input line (at -7.62 2.54 0) (length 2.54) (name "+" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at 0 -7.62 90) (length 2.54) (name "V-" (effects (font (size 1.27 1.27)))) (number "4" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at 0 7.62 270) (length 2.54) (name "V+" (effects (font (size 1.27 1.27)))) (number "8" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // TRANSISTORS
  // ----------------------------------------

  npn: {
    type: 'npn',
    symbol: 'Device:Q_NPN_BCE',
    name: 'NPN Transistor',
    defaultValue: 'BC547',
    refPrefix: 'Q',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'B', offset: { dx: -2.54, dy: 0 }, direction: 'left' },
      { number: 2, name: 'C', offset: { dx: 2.54, dy: 2.54 }, direction: 'up' },
      { number: 3, name: 'E', offset: { dx: 2.54, dy: -2.54 }, direction: 'down' },
    ],
    libSymbolDef: `
    (symbol "Device:Q_NPN_BCE" (pin_names (offset 0) hide) (in_bom yes) (on_board yes)
      (property "Reference" "Q" (at 5.08 1.905 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "Q_NPN_BCE" (at 5.08 0 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 5.08 -1.905 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "Q_NPN_BCE_0_1"
        (polyline (pts (xy 0.635 0.635) (xy 2.54 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 -0.635) (xy 2.54 -2.54) (xy 2.54 -2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 1.905) (xy 0.635 -1.905) (xy 0.635 -1.905)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 1.27 -1.778) (xy 1.778 -1.27) (xy 2.286 -2.286) (xy 1.27 -1.778) (xy 1.27 -1.778)) (stroke (width 0) (type default)) (fill (type outline)))
        (circle (center 1.27 0) (radius 2.8194) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "Q_NPN_BCE_1_1"
        (pin passive line (at -5.08 0 0) (length 5.715) (name "B" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 5.08 270) (length 2.54) (name "C" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 -5.08 90) (length 2.54) (name "E" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  pnp: {
    type: 'pnp',
    symbol: 'Device:Q_PNP_BCE',
    name: 'PNP Transistor',
    defaultValue: 'BC557',
    refPrefix: 'Q',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'B', offset: { dx: -2.54, dy: 0 }, direction: 'left' },
      { number: 2, name: 'C', offset: { dx: 2.54, dy: -2.54 }, direction: 'down' },
      { number: 3, name: 'E', offset: { dx: 2.54, dy: 2.54 }, direction: 'up' },
    ],
    libSymbolDef: `
    (symbol "Device:Q_PNP_BCE" (pin_names (offset 0) hide) (in_bom yes) (on_board yes)
      (property "Reference" "Q" (at 5.08 1.905 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "Q_PNP_BCE" (at 5.08 0 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 5.08 -1.905 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "Q_PNP_BCE_0_1"
        (polyline (pts (xy 0.635 0.635) (xy 2.54 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 -0.635) (xy 2.54 -2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 1.905) (xy 0.635 -1.905)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 2.286 0.508) (xy 1.778 1.016) (xy 1.27 0) (xy 2.286 0.508)) (stroke (width 0) (type default)) (fill (type outline)))
        (circle (center 1.27 0) (radius 2.8194) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "Q_PNP_BCE_1_1"
        (pin passive line (at -5.08 0 0) (length 5.715) (name "B" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 -5.08 90) (length 2.54) (name "C" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 5.08 270) (length 2.54) (name "E" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // POTENTIOMETER
  // ----------------------------------------

  potentiometer: {
    type: 'potentiometer',
    symbol: 'Device:R_Potentiometer',
    name: 'Potentiometer',
    defaultValue: '10k',
    refPrefix: 'RV',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: 0, dy: -3.81 }, direction: 'down' },
      { number: 2, name: '2', offset: { dx: 3.81, dy: 0 }, direction: 'right' },
      { number: 3, name: '3', offset: { dx: 0, dy: 3.81 }, direction: 'up' },
    ],
    libSymbolDef: `
    (symbol "Device:R_Potentiometer" (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
      (property "Reference" "RV" (at -4.445 0 90) (effects (font (size 1.27 1.27))))
      (property "Value" "R_Potentiometer" (at -2.54 0 90) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "R_Potentiometer_0_1"
        (polyline (pts (xy 2.54 0) (xy 1.524 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 1.143 0) (xy 2.286 0.508) (xy 2.286 -0.508) (xy 1.143 0)) (stroke (width 0) (type default)) (fill (type none)))
        (rectangle (start 1.016 2.54) (end -1.016 -2.54) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "R_Potentiometer_1_1"
        (pin passive line (at 0 -5.08 90) (length 2.54) (name "1" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 5.08 0 180) (length 2.54) (name "2" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 5.08 270) (length 2.54) (name "3" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // BATTERY
  // ----------------------------------------

  battery: {
    type: 'battery',
    symbol: 'Device:Battery',
    name: 'Battery',
    defaultValue: '9V',
    refPrefix: 'BT',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '+', offset: { dx: 0, dy: -2.54 }, direction: 'down' },
      { number: 2, name: '-', offset: { dx: 0, dy: 2.54 }, direction: 'up' },
    ],
    libSymbolDef: `
    (symbol "Device:Battery" (pin_numbers hide) (pin_names (offset 0)) (in_bom yes) (on_board yes)
      (property "Reference" "BT" (at 2.54 2.54 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "Battery" (at 2.54 0 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 0 1.524 90) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 1.524 90) (effects (font (size 1.27 1.27)) hide))
      (symbol "Battery_0_1"
        (rectangle (start -2.286 -1.27) (end 2.286 -1.016) (stroke (width 0) (type default)) (fill (type outline)))
        (rectangle (start -1.016 1.27) (end 1.016 1.016) (stroke (width 0) (type default)) (fill (type outline)))
        (polyline (pts (xy 0 0.762) (xy 0 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 -2.54) (xy 0 -1.27)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 2.286) (xy 0.762 1.778) (xy 0.762 1.778)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 1.016 2.032) (xy 0.508 2.032)) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "Battery_1_1"
        (pin passive line (at 0 5.08 270) (length 2.54) (name "+" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -5.08 90) (length 2.54) (name "-" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // SWITCH
  // ----------------------------------------

  switch: {
    type: 'switch',
    symbol: 'Switch:SW_Push',
    name: 'Push Button Switch',
    defaultValue: 'SW_Push',
    refPrefix: 'SW',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: -2.54, dy: 0 }, direction: 'left' },
      { number: 2, name: '2', offset: { dx: 2.54, dy: 0 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "Switch:SW_Push" (pin_numbers hide) (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
      (property "Reference" "SW" (at 1.27 2.54 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "SW_Push" (at 0 -1.524 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 5.08 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 5.08 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "SW_Push_0_1"
        (circle (center -2.032 0) (radius 0.508) (stroke (width 0) (type default)) (fill (type none)))
        (circle (center 2.032 0) (radius 0.508) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 1.27) (xy 0 3.048)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -2.54 0) (xy 2.54 0) (xy 2.54 0)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "SW_Push_1_1"
        (pin passive line (at -5.08 0 0) (length 2.54) (name "1" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 5.08 0 180) (length 2.54) (name "2" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // TIMER ICs
  // ----------------------------------------

  ne555: {
    type: 'ne555',
    symbol: 'Timer:NE555',
    name: '555 Timer',
    defaultValue: 'NE555',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'GND', offset: { dx: -7.62, dy: -5.08 }, direction: 'left' },
      { number: 2, name: 'TR', offset: { dx: -7.62, dy: -2.54 }, direction: 'left' },
      { number: 3, name: 'Q', offset: { dx: 7.62, dy: -2.54 }, direction: 'right' },
      { number: 4, name: 'R', offset: { dx: -7.62, dy: 5.08 }, direction: 'left' },
      { number: 5, name: 'CV', offset: { dx: 7.62, dy: 0 }, direction: 'right' },
      { number: 6, name: 'THR', offset: { dx: -7.62, dy: 0 }, direction: 'left' },
      { number: 7, name: 'DIS', offset: { dx: -7.62, dy: 2.54 }, direction: 'left' },
      { number: 8, name: 'VCC', offset: { dx: 7.62, dy: 5.08 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "Timer:NE555" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at -7.62 8.89 0) (effects (font (size 1.27 1.27))))
      (property "Value" "NE555" (at 5.08 8.89 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "http://www.ti.com/lit/ds/symlink/ne555.pdf" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "NE555_0_0"
        (rectangle (start -7.62 7.62) (end 7.62 -7.62) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin power_in line (at 0 -10.16 90) (length 2.54) (name "GND" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin input line (at -10.16 -2.54 0) (length 2.54) (name "TR" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin output line (at 10.16 -2.54 180) (length 2.54) (name "Q" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
        (pin input line (at -10.16 5.08 0) (length 2.54) (name "R" (effects (font (size 1.27 1.27)))) (number "4" (effects (font (size 1.27 1.27)))))
        (pin input line (at 10.16 0 180) (length 2.54) (name "CV" (effects (font (size 1.27 1.27)))) (number "5" (effects (font (size 1.27 1.27)))))
        (pin input line (at -10.16 0 0) (length 2.54) (name "THR" (effects (font (size 1.27 1.27)))) (number "6" (effects (font (size 1.27 1.27)))))
        (pin input line (at -10.16 2.54 0) (length 2.54) (name "DIS" (effects (font (size 1.27 1.27)))) (number "7" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at 0 10.16 270) (length 2.54) (name "VCC" (effects (font (size 1.27 1.27)))) (number "8" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // VOLTAGE REGULATORS
  // ----------------------------------------

  lm7805: {
    type: 'lm7805',
    symbol: 'Regulator_Linear:L7805',
    name: '5V Voltage Regulator',
    defaultValue: 'LM7805',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'VI', offset: { dx: -5.08, dy: 0 }, direction: 'left' },
      { number: 2, name: 'GND', offset: { dx: 0, dy: -5.08 }, direction: 'down' },
      { number: 3, name: 'VO', offset: { dx: 5.08, dy: 0 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "Regulator_Linear:L7805" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 3.81 0) (effects (font (size 1.27 1.27))))
      (property "Value" "L7805" (at 0 1.27 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "Package_TO_SOT_THT:TO-220-3_Vertical" (at 0 -5.08 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "L7805_0_1"
        (rectangle (start -5.08 -2.54) (end 5.08 2.54) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin power_in line (at -7.62 0 0) (length 2.54) (name "VI" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at 0 -5.08 90) (length 2.54) (name "GND" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin power_out line (at 7.62 0 180) (length 2.54) (name "VO" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  lm7812: {
    type: 'lm7812',
    symbol: 'Regulator_Linear:L7812',
    name: '12V Voltage Regulator',
    defaultValue: 'LM7812',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'VI', offset: { dx: -5.08, dy: 0 }, direction: 'left' },
      { number: 2, name: 'GND', offset: { dx: 0, dy: -5.08 }, direction: 'down' },
      { number: 3, name: 'VO', offset: { dx: 5.08, dy: 0 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "Regulator_Linear:L7812" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 3.81 0) (effects (font (size 1.27 1.27))))
      (property "Value" "L7812" (at 0 1.27 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "Package_TO_SOT_THT:TO-220-3_Vertical" (at 0 -5.08 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "L7812_0_1"
        (rectangle (start -5.08 -2.54) (end 5.08 2.54) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin power_in line (at -7.62 0 0) (length 2.54) (name "VI" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at 0 -5.08 90) (length 2.54) (name "GND" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin power_out line (at 7.62 0 180) (length 2.54) (name "VO" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  ams1117: {
    type: 'ams1117',
    symbol: 'Regulator_Linear:AMS1117-3.3',
    name: '3.3V LDO Regulator',
    defaultValue: 'AMS1117-3.3',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'GND', offset: { dx: 0, dy: -5.08 }, direction: 'down' },
      { number: 2, name: 'VOUT', offset: { dx: 5.08, dy: 0 }, direction: 'right' },
      { number: 3, name: 'VIN', offset: { dx: -5.08, dy: 0 }, direction: 'left' },
    ],
    libSymbolDef: `
    (symbol "Regulator_Linear:AMS1117-3.3" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 3.81 0) (effects (font (size 1.27 1.27))))
      (property "Value" "AMS1117-3.3" (at 0 1.27 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "Package_TO_SOT_SMD:SOT-223-3_TabPin2" (at 0 -5.08 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "AMS1117-3.3_0_1"
        (rectangle (start -5.08 -2.54) (end 5.08 2.54) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin power_in line (at 0 -5.08 90) (length 2.54) (name "GND" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin power_out line (at 7.62 0 180) (length 2.54) (name "VOUT" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at -7.62 0 0) (length 2.54) (name "VIN" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  lm317: {
    type: 'lm317',
    symbol: 'Regulator_Linear:LM317_TO-220',
    name: 'Adjustable Voltage Regulator',
    defaultValue: 'LM317',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'ADJ', offset: { dx: 0, dy: -5.08 }, direction: 'down' },
      { number: 2, name: 'VOUT', offset: { dx: 5.08, dy: 0 }, direction: 'right' },
      { number: 3, name: 'VIN', offset: { dx: -5.08, dy: 0 }, direction: 'left' },
    ],
    libSymbolDef: `
    (symbol "Regulator_Linear:LM317_TO-220" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 3.81 0) (effects (font (size 1.27 1.27))))
      (property "Value" "LM317" (at 0 1.27 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "Package_TO_SOT_THT:TO-220-3_Vertical" (at 0 -5.08 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "LM317_0_1"
        (rectangle (start -5.08 -2.54) (end 5.08 2.54) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin input line (at 0 -5.08 90) (length 2.54) (name "ADJ" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin power_out line (at 7.62 0 180) (length 2.54) (name "VOUT" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at -7.62 0 0) (length 2.54) (name "VIN" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // SENSORS
  // ----------------------------------------

  dht11: {
    type: 'dht11',
    symbol: 'Sensor:DHT11',
    name: 'DHT11 Temperature/Humidity Sensor',
    defaultValue: 'DHT11',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'VCC', offset: { dx: -5.08, dy: 2.54 }, direction: 'left' },
      { number: 2, name: 'DATA', offset: { dx: -5.08, dy: 0 }, direction: 'left' },
      { number: 3, name: 'NC', offset: { dx: 5.08, dy: 0 }, direction: 'right' },
      { number: 4, name: 'GND', offset: { dx: -5.08, dy: -2.54 }, direction: 'left' },
    ],
    libSymbolDef: `
    (symbol "Sensor:DHT11" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 6.35 0) (effects (font (size 1.27 1.27))))
      (property "Value" "DHT11" (at 0 -6.35 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "DHT11_0_1"
        (rectangle (start -5.08 5.08) (end 5.08 -5.08) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin power_in line (at -7.62 2.54 0) (length 2.54) (name "VCC" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin bidirectional line (at -7.62 0 0) (length 2.54) (name "DATA" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin no_connect line (at 7.62 0 180) (length 2.54) (name "NC" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at -7.62 -2.54 0) (length 2.54) (name "GND" (effects (font (size 1.27 1.27)))) (number "4" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  ldr: {
    type: 'ldr',
    symbol: 'Device:R_Photo',
    name: 'Light Dependent Resistor',
    defaultValue: 'LDR',
    refPrefix: 'R',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: 0, dy: -PIN_OFFSET }, direction: 'up' },
      { number: 2, name: '2', offset: { dx: 0, dy: PIN_OFFSET }, direction: 'down' },
    ],
    libSymbolDef: `
    (symbol "Device:R_Photo" (pin_numbers hide) (pin_names (offset 0)) (in_bom yes) (on_board yes)
      (property "Reference" "R" (at 2.032 0 90) (effects (font (size 1.27 1.27))))
      (property "Value" "LDR" (at 0 0 90) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "~" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "R_Photo_0_1"
        (rectangle (start -1.016 -2.54) (end 1.016 2.54) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy -2.286 -1.778) (xy -1.27 -0.762)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -2.286 -0.508) (xy -1.27 0.508)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.778 -0.254) (xy -2.286 -0.762) (xy -2.032 -0.762)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -1.778 1.016) (xy -2.286 0.508) (xy -2.032 0.508)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "R_Photo_1_1"
        (pin passive line (at 0 3.81 270) (length 1.27) (name "~" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 1.27) (name "~" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  pir: {
    type: 'pir',
    symbol: 'Sensor:PIR',
    name: 'PIR Motion Sensor',
    defaultValue: 'HC-SR501',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'VCC', offset: { dx: -5.08, dy: 2.54 }, direction: 'left' },
      { number: 2, name: 'OUT', offset: { dx: 5.08, dy: 0 }, direction: 'right' },
      { number: 3, name: 'GND', offset: { dx: -5.08, dy: -2.54 }, direction: 'left' },
    ],
    libSymbolDef: `
    (symbol "Sensor:PIR" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 5.08 0) (effects (font (size 1.27 1.27))))
      (property "Value" "PIR" (at 0 -5.08 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "PIR_0_1"
        (rectangle (start -5.08 3.81) (end 5.08 -3.81) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin power_in line (at -7.62 2.54 0) (length 2.54) (name "VCC" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin output line (at 7.62 0 180) (length 2.54) (name "OUT" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at -7.62 -2.54 0) (length 2.54) (name "GND" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  // ----------------------------------------
  // MICROCONTROLLERS
  // ----------------------------------------

  // ESP32-WROOM-32 Module (38-pin)
  // Based on Espressif ESP32-WROOM-32 Datasheet
  // KiCad Symbol: RF_Module:ESP32-WROOM-32
  esp32: {
    type: 'esp32',
    symbol: 'RF_Module:ESP32-WROOM-32',
    name: 'ESP32-WROOM-32',
    defaultValue: 'ESP32-WROOM-32',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      // Based on official datasheet pinout (38 pins)
      // Left side (pins 1-19, top to bottom)
      { number: 1, name: 'GND', offset: { dx: -15.24, dy: 22.86 }, direction: 'left' },
      { number: 2, name: '3V3', offset: { dx: -15.24, dy: 20.32 }, direction: 'left' },
      { number: 3, name: 'EN', offset: { dx: -15.24, dy: 17.78 }, direction: 'left' },
      { number: 4, name: 'SENSOR_VP', offset: { dx: -15.24, dy: 15.24 }, direction: 'left' },
      { number: 5, name: 'SENSOR_VN', offset: { dx: -15.24, dy: 12.7 }, direction: 'left' },
      { number: 6, name: 'IO34', offset: { dx: -15.24, dy: 10.16 }, direction: 'left' },
      { number: 7, name: 'IO35', offset: { dx: -15.24, dy: 7.62 }, direction: 'left' },
      { number: 8, name: 'IO32', offset: { dx: -15.24, dy: 5.08 }, direction: 'left' },
      { number: 9, name: 'IO33', offset: { dx: -15.24, dy: 2.54 }, direction: 'left' },
      { number: 10, name: 'IO25', offset: { dx: -15.24, dy: 0 }, direction: 'left' },
      { number: 11, name: 'IO26', offset: { dx: -15.24, dy: -2.54 }, direction: 'left' },
      { number: 12, name: 'IO27', offset: { dx: -15.24, dy: -5.08 }, direction: 'left' },
      { number: 13, name: 'IO14', offset: { dx: -15.24, dy: -7.62 }, direction: 'left' },
      { number: 14, name: 'IO12', offset: { dx: -15.24, dy: -10.16 }, direction: 'left' },
      { number: 15, name: 'GND2', offset: { dx: -15.24, dy: -12.7 }, direction: 'left' },
      { number: 16, name: 'IO13', offset: { dx: -15.24, dy: -15.24 }, direction: 'left' },
      { number: 17, name: 'SD2', offset: { dx: -15.24, dy: -17.78 }, direction: 'left' },
      { number: 18, name: 'SD3', offset: { dx: -15.24, dy: -20.32 }, direction: 'left' },
      { number: 19, name: 'CMD', offset: { dx: -15.24, dy: -22.86 }, direction: 'left' },
      // Right side (pins 20-38, bottom to top)
      { number: 20, name: 'CLK', offset: { dx: 15.24, dy: -22.86 }, direction: 'right' },
      { number: 21, name: 'SD0', offset: { dx: 15.24, dy: -20.32 }, direction: 'right' },
      { number: 22, name: 'SD1', offset: { dx: 15.24, dy: -17.78 }, direction: 'right' },
      { number: 23, name: 'IO15', offset: { dx: 15.24, dy: -15.24 }, direction: 'right' },
      { number: 24, name: 'IO2', offset: { dx: 15.24, dy: -12.7 }, direction: 'right' },
      { number: 25, name: 'IO0', offset: { dx: 15.24, dy: -10.16 }, direction: 'right' },
      { number: 26, name: 'IO4', offset: { dx: 15.24, dy: -7.62 }, direction: 'right' },
      { number: 27, name: 'IO16', offset: { dx: 15.24, dy: -5.08 }, direction: 'right' },
      { number: 28, name: 'IO17', offset: { dx: 15.24, dy: -2.54 }, direction: 'right' },
      { number: 29, name: 'IO5', offset: { dx: 15.24, dy: 0 }, direction: 'right' },
      { number: 30, name: 'IO18', offset: { dx: 15.24, dy: 2.54 }, direction: 'right' },
      { number: 31, name: 'IO19', offset: { dx: 15.24, dy: 5.08 }, direction: 'right' },
      { number: 32, name: 'NC', offset: { dx: 15.24, dy: 7.62 }, direction: 'right' },
      { number: 33, name: 'IO21', offset: { dx: 15.24, dy: 10.16 }, direction: 'right' },
      { number: 34, name: 'RXD0', offset: { dx: 15.24, dy: 12.7 }, direction: 'right' },
      { number: 35, name: 'TXD0', offset: { dx: 15.24, dy: 15.24 }, direction: 'right' },
      { number: 36, name: 'IO22', offset: { dx: 15.24, dy: 17.78 }, direction: 'right' },
      { number: 37, name: 'IO23', offset: { dx: 15.24, dy: 20.32 }, direction: 'right' },
      { number: 38, name: 'GND3', offset: { dx: 15.24, dy: 22.86 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "RF_Module:ESP32-WROOM-32" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 26.67 0) (effects (font (size 1.27 1.27))))
      (property "Value" "ESP32-WROOM-32" (at 0 -26.67 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "RF_Module:ESP32-WROOM-32" (at 0 -30 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "ESP32-WROOM-32_0_1"
        (rectangle (start -12.7 25.4) (end 12.7 -25.4) (stroke (width 0.254) (type default)) (fill (type background)))
      )
    )`,
  },

  esp8266: {
    type: 'esp8266',
    symbol: 'MCU_Espressif:ESP-12E',
    name: 'ESP8266 ESP-12',
    defaultValue: 'ESP-12E',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'RST', offset: { dx: -10.16, dy: 7.62 }, direction: 'left' },
      { number: 2, name: 'ADC', offset: { dx: -10.16, dy: 5.08 }, direction: 'left' },
      { number: 3, name: 'EN', offset: { dx: -10.16, dy: 2.54 }, direction: 'left' },
      { number: 4, name: 'IO16', offset: { dx: -10.16, dy: 0 }, direction: 'left' },
      { number: 5, name: 'IO14', offset: { dx: -10.16, dy: -2.54 }, direction: 'left' },
      { number: 6, name: 'IO12', offset: { dx: -10.16, dy: -5.08 }, direction: 'left' },
      { number: 7, name: 'IO13', offset: { dx: -10.16, dy: -7.62 }, direction: 'left' },
      { number: 8, name: 'VCC', offset: { dx: 10.16, dy: 7.62 }, direction: 'right' },
      { number: 9, name: 'GND', offset: { dx: 10.16, dy: -7.62 }, direction: 'right' },
      { number: 10, name: 'IO15', offset: { dx: 10.16, dy: -5.08 }, direction: 'right' },
      { number: 11, name: 'IO2', offset: { dx: 10.16, dy: -2.54 }, direction: 'right' },
      { number: 12, name: 'IO0', offset: { dx: 10.16, dy: 0 }, direction: 'right' },
      { number: 13, name: 'IO4', offset: { dx: 10.16, dy: 2.54 }, direction: 'right' },
      { number: 14, name: 'IO5', offset: { dx: 10.16, dy: 5.08 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "MCU_Espressif:ESP-12E" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 11.43 0) (effects (font (size 1.27 1.27))))
      (property "Value" "ESP-12E" (at 0 -11.43 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "ESP-12E_0_1"
        (rectangle (start -7.62 10.16) (end 7.62 -10.16) (stroke (width 0.254) (type default)) (fill (type background)))
      )
    )`,
  },

  arduino_nano: {
    type: 'arduino_nano',
    symbol: 'MCU_Module:Arduino_Nano_v3.x',
    name: 'Arduino Nano',
    defaultValue: 'Arduino Nano',
    refPrefix: 'A',
    defaultRotation: 0,
    pins: [
      // Left side
      { number: 1, name: 'D1/TX', offset: { dx: -10.16, dy: 17.78 }, direction: 'left' },
      { number: 2, name: 'D0/RX', offset: { dx: -10.16, dy: 15.24 }, direction: 'left' },
      { number: 3, name: 'RST', offset: { dx: -10.16, dy: 12.7 }, direction: 'left' },
      { number: 4, name: 'GND', offset: { dx: -10.16, dy: 10.16 }, direction: 'left' },
      { number: 5, name: 'D2', offset: { dx: -10.16, dy: 7.62 }, direction: 'left' },
      { number: 6, name: 'D3', offset: { dx: -10.16, dy: 5.08 }, direction: 'left' },
      { number: 7, name: 'D4', offset: { dx: -10.16, dy: 2.54 }, direction: 'left' },
      { number: 8, name: 'D5', offset: { dx: -10.16, dy: 0 }, direction: 'left' },
      { number: 9, name: 'D6', offset: { dx: -10.16, dy: -2.54 }, direction: 'left' },
      { number: 10, name: 'D7', offset: { dx: -10.16, dy: -5.08 }, direction: 'left' },
      { number: 11, name: 'D8', offset: { dx: -10.16, dy: -7.62 }, direction: 'left' },
      { number: 12, name: 'D9', offset: { dx: -10.16, dy: -10.16 }, direction: 'left' },
      { number: 13, name: 'D10', offset: { dx: -10.16, dy: -12.7 }, direction: 'left' },
      { number: 14, name: 'D11', offset: { dx: -10.16, dy: -15.24 }, direction: 'left' },
      { number: 15, name: 'D12', offset: { dx: -10.16, dy: -17.78 }, direction: 'left' },
      // Right side
      { number: 16, name: 'VIN', offset: { dx: 10.16, dy: 17.78 }, direction: 'right' },
      { number: 17, name: 'GND2', offset: { dx: 10.16, dy: 15.24 }, direction: 'right' },
      { number: 18, name: 'RST2', offset: { dx: 10.16, dy: 12.7 }, direction: 'right' },
      { number: 19, name: '5V', offset: { dx: 10.16, dy: 10.16 }, direction: 'right' },
      { number: 20, name: 'A7', offset: { dx: 10.16, dy: 7.62 }, direction: 'right' },
      { number: 21, name: 'A6', offset: { dx: 10.16, dy: 5.08 }, direction: 'right' },
      { number: 22, name: 'A5', offset: { dx: 10.16, dy: 2.54 }, direction: 'right' },
      { number: 23, name: 'A4', offset: { dx: 10.16, dy: 0 }, direction: 'right' },
      { number: 24, name: 'A3', offset: { dx: 10.16, dy: -2.54 }, direction: 'right' },
      { number: 25, name: 'A2', offset: { dx: 10.16, dy: -5.08 }, direction: 'right' },
      { number: 26, name: 'A1', offset: { dx: 10.16, dy: -7.62 }, direction: 'right' },
      { number: 27, name: 'A0', offset: { dx: 10.16, dy: -10.16 }, direction: 'right' },
      { number: 28, name: 'AREF', offset: { dx: 10.16, dy: -12.7 }, direction: 'right' },
      { number: 29, name: '3V3', offset: { dx: 10.16, dy: -15.24 }, direction: 'right' },
      { number: 30, name: 'D13', offset: { dx: 10.16, dy: -17.78 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "MCU_Module:Arduino_Nano_v3.x" (in_bom yes) (on_board yes)
      (property "Reference" "A" (at 0 21.59 0) (effects (font (size 1.27 1.27))))
      (property "Value" "Arduino_Nano" (at 0 -21.59 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "Module:Arduino_Nano" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "Arduino_Nano_0_1"
        (rectangle (start -7.62 20.32) (end 7.62 -20.32) (stroke (width 0.254) (type default)) (fill (type background)))
      )
    )`,
  },

  attiny85: {
    type: 'attiny85',
    symbol: 'MCU_Microchip_ATtiny:ATtiny85-20PU',
    name: 'ATtiny85',
    defaultValue: 'ATtiny85',
    refPrefix: 'U',
    defaultRotation: 0,
    pins: [
      { number: 1, name: 'PB5/RST', offset: { dx: -7.62, dy: 3.81 }, direction: 'left' },
      { number: 2, name: 'PB3', offset: { dx: -7.62, dy: 1.27 }, direction: 'left' },
      { number: 3, name: 'PB4', offset: { dx: -7.62, dy: -1.27 }, direction: 'left' },
      { number: 4, name: 'GND', offset: { dx: -7.62, dy: -3.81 }, direction: 'left' },
      { number: 5, name: 'PB0', offset: { dx: 7.62, dy: -3.81 }, direction: 'right' },
      { number: 6, name: 'PB1', offset: { dx: 7.62, dy: -1.27 }, direction: 'right' },
      { number: 7, name: 'PB2', offset: { dx: 7.62, dy: 1.27 }, direction: 'right' },
      { number: 8, name: 'VCC', offset: { dx: 7.62, dy: 3.81 }, direction: 'right' },
    ],
    libSymbolDef: `
    (symbol "MCU_Microchip_ATtiny:ATtiny85-20PU" (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 6.35 0) (effects (font (size 1.27 1.27))))
      (property "Value" "ATtiny85" (at 0 -6.35 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "Package_DIP:DIP-8_W7.62mm" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "ATtiny85_0_1"
        (rectangle (start -5.08 5.08) (end 5.08 -5.08) (stroke (width 0.254) (type default)) (fill (type background)))
      )
    )`,
  },

  // ----------------------------------------
  // CONNECTORS
  // ----------------------------------------

  conn_2pin: {
    type: 'conn_2pin',
    symbol: 'Connector:Conn_01x02',
    name: '2-Pin Connector',
    defaultValue: 'Conn_2',
    refPrefix: 'J',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: -5.08, dy: 1.27 }, direction: 'left' },
      { number: 2, name: '2', offset: { dx: -5.08, dy: -1.27 }, direction: 'left' },
    ],
    libSymbolDef: `
    (symbol "Connector:Conn_01x02" (pin_names (offset 1.016)) (in_bom yes) (on_board yes)
      (property "Reference" "J" (at 0 2.54 0) (effects (font (size 1.27 1.27))))
      (property "Value" "Conn_01x02" (at 0 -5.08 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "Conn_01x02_0_1"
        (rectangle (start -2.54 -2.413) (end 0 -2.667) (stroke (width 0.1524) (type default)) (fill (type none)))
        (rectangle (start -2.54 0.127) (end 0 -0.127) (stroke (width 0.1524) (type default)) (fill (type none)))
        (rectangle (start -2.54 2.54) (end 2.54 -5.08) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin passive line (at -5.08 0 0) (length 2.54) (name "1" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at -5.08 -2.54 0) (length 2.54) (name "2" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },

  conn_3pin: {
    type: 'conn_3pin',
    symbol: 'Connector:Conn_01x03',
    name: '3-Pin Connector',
    defaultValue: 'Conn_3',
    refPrefix: 'J',
    defaultRotation: 0,
    pins: [
      { number: 1, name: '1', offset: { dx: -5.08, dy: 2.54 }, direction: 'left' },
      { number: 2, name: '2', offset: { dx: -5.08, dy: 0 }, direction: 'left' },
      { number: 3, name: '3', offset: { dx: -5.08, dy: -2.54 }, direction: 'left' },
    ],
    libSymbolDef: `
    (symbol "Connector:Conn_01x03" (pin_names (offset 1.016)) (in_bom yes) (on_board yes)
      (property "Reference" "J" (at 0 5.08 0) (effects (font (size 1.27 1.27))))
      (property "Value" "Conn_01x03" (at 0 -5.08 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
      (symbol "Conn_01x03_0_1"
        (rectangle (start -2.54 3.81) (end 2.54 -3.81) (stroke (width 0.254) (type default)) (fill (type background)))
        (pin passive line (at -5.08 2.54 0) (length 2.54) (name "1" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at -5.08 0 0) (length 2.54) (name "2" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at -5.08 -2.54 0) (length 2.54) (name "3" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
    )`,
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get component definition by type
 */
export function getComponentDef(type: string): ComponentDefinition | undefined {
  return COMPONENT_LIBRARY[type.toLowerCase()]
}

/**
 * Get pin position after rotation
 * KiCad rotation is counter-clockwise in degrees
 */
export function getPinPositionWithRotation(
  componentX: number,
  componentY: number,
  pin: PinDefinition,
  rotationDegrees: number
): { x: number; y: number } {
  const rad = (rotationDegrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // Rotate the offset
  const rotatedDx = pin.offset.dx * cos - pin.offset.dy * sin
  const rotatedDy = pin.offset.dx * sin + pin.offset.dy * cos

  return {
    x: componentX + rotatedDx,
    y: componentY + rotatedDy,
  }
}

/**
 * Get all available component types for AI reference
 */
export function getAvailableComponentTypes(): string[] {
  return Object.keys(COMPONENT_LIBRARY)
}

/**
 * Get component info for AI prompt
 */
export function getComponentInfoForAI(): string {
  const lines: string[] = ['KOMPONEN TERSEDIA:']

  for (const [type, def] of Object.entries(COMPONENT_LIBRARY)) {
    const pinInfo = def.pins.map(p => `pin${p.number}=${p.name}`).join(', ')
    lines.push(`- ${type}: ${def.name} (${def.symbol}) [${pinInfo}]`)
  }

  return lines.join('\n')
}
