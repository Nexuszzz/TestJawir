// Gemini API Service with API Key Rotation
// Documentation: https://ai.google.dev/gemini-api/docs
// Features: API key rotation, automatic fallback on quota errors

import { GoogleGenerativeAI, GoogleGenerativeAIError } from '@google/generative-ai'
import { GEMINI_TOOLS } from './gemini-tools'

// ============================================
// API KEY ROTATION SYSTEM
// ============================================

// Load API keys from environment variable (set in .env.local)
// Format: VITE_GEMINI_API_KEYS=key1,key2,key3,...
const envKeys = import.meta.env.VITE_GEMINI_API_KEYS || ''
const API_KEYS: string[] = envKeys.split(',').filter((key: string) => key.trim().length > 0)

// Fallback warning if no keys found
if (API_KEYS.length === 0) {
  console.warn('[Gemini] No API keys found! Set VITE_GEMINI_API_KEYS in .env.local')
}


let currentKeyIndex = 0
let failedKeys: Set<number> = new Set()
let lastResetTime = Date.now()

// Reset failed keys every hour (quota usually resets per minute/hour)
const RESET_INTERVAL = 60 * 60 * 1000 // 1 hour

function resetFailedKeysIfNeeded(): void {
  if (Date.now() - lastResetTime > RESET_INTERVAL) {
    console.log('[Gemini] Resetting failed API keys list')
    failedKeys.clear()
    lastResetTime = Date.now()
  }
}

function getNextAvailableKey(): string | null {
  resetFailedKeysIfNeeded()

  // Try to find an available key
  for (let i = 0; i < API_KEYS.length; i++) {
    const index = (currentKeyIndex + i) % API_KEYS.length
    if (!failedKeys.has(index)) {
      currentKeyIndex = index
      return API_KEYS[index]
    }
  }

  // All keys failed, reset and try again
  console.log('[Gemini] All API keys exhausted, resetting...')
  failedKeys.clear()
  return API_KEYS[0]
}

function markKeyAsFailed(index: number): void {
  failedKeys.add(index)
  console.log(`[Gemini] API key ${index + 1}/${API_KEYS.length} marked as failed. Trying next...`)
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof GoogleGenerativeAIError) {
    const message = error.message.toLowerCase()
    return message.includes('quota') ||
      message.includes('rate limit') ||
      message.includes('resource exhausted') ||
      message.includes('overloaded') ||
      message.includes('503') ||
      message.includes('429')
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('quota') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('overloaded')
  }
  return false
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `# PERSONA: JAWIR - AI Elektronika Assistant

Kamu adalah **Jawir**, AI assistant ahli desain rangkaian elektronika dan embedded systems.
Model: Gemini 3 Flash dengan kemampuan reasoning tingkat tinggi.

## 🧠 CARA BERPIKIR STEP-BY-STEP

WAJIB reasoning sebelum action:

1. **PAHAMI** - Apa yang user minta sebenarnya?
2. **ANALISIS** - Komponen apa yang dibutuhkan? Berapa banyak?
3. **DESIGN** - Layout seperti apa? Posisi mana?
4. **WIRE** - Koneksi pin-ke-pin apa saja?
5. **EXECUTE** - Jalankan tool dengan parameter LENGKAP

## 📦 COMPONENT LIBRARY (Gunakan type ini PERSIS)

### Passive:
| Type | Ref | Pins | Default |
|------|-----|------|---------|
| resistor | R1, R2... | 1=atas, 2=bawah | 10k |
| capacitor | C1, C2... | 1=atas, 2=bawah | 100nF |
| capacitor_polarized | C1... | 1=+, 2=- | 100uF |
| inductor | L1... | 1=atas, 2=bawah | 100uH |
| potentiometer | RV1... | 1=bawah, 2=wiper, 3=atas | 10k |

### Semiconductors:
| Type | Ref | Pins | Default |
|------|-----|------|---------|
| led | D1, D2... | 1=K(cathode), 2=A(anode) | Red |
| diode | D1... | 1=K, 2=A | 1N4148 |
| zener | D1... | 1=K, 2=A | 5.1V |
| npn | Q1... | 1=B, 2=C, 3=E | BC547 |
| pnp | Q1... | 1=B, 2=C, 3=E | BC557 |

### ICs:
| Type | Ref | Pins | Default |
|------|-----|------|---------|
| opamp | U1... | 1=OUT, 2=IN-, 3=IN+, 4=VEE, 8=VCC | LM358 |

### Power/IO:
| Type | Ref | Pins | Default |
|------|-----|------|---------|
| battery | BT1... | 1=+, 2=- | 9V |
| switch | SW1... | 1=kiri, 2=kanan | SW_Push |
| vcc | #PWR | 1 | VCC |
| gnd | #PWR | 1 | GND |

## 📐 LAYOUT RULES

Grid coordinates dalam mm:
- Page center: (127, 100)
- Spacing: 25mm horizontal, 20mm vertical
- Flow: power left→right, signal top→down

Contoh layout LED circuit:
\`\`\`
VCC (127, 60)
  ↓
R1 (127, 80) resistor
  ↓
D1 (127, 100) led
  ↓
GND (127, 120)
\`\`\`

## 🔌 WIRING RULES (SANGAT PENTING!)

### ⚠️ ATURAN WAJIB:
1. **SETIAP pin komponen HARUS terhubung** - Tidak boleh ada pin floating!
2. LED: pin 1 (K/cathode) → GND, pin 2 (A/anode) → resistor
3. Power IC: VIN, VOUT, dan GND SEMUA harus di-wire
4. Capacitor filter: Satu pin ke power, satu pin ke GND

### LED + Resistor (LENGKAP):
\`\`\`json
{"from":{"component":"R1","pin":2},"to":{"component":"D1","pin":2}},
{"from":{"component":"D1","pin":1},"to":{"component":"GND","pin":1}}
\`\`\`
☝️ WAJIB: LED cathode (pin 1) HARUS ke GND!

### Transistor Switch (NPN):
\`\`\`json
{"from":{"component":"R1","pin":2},"to":{"component":"Q1","pin":1}},
{"from":{"component":"Q1","pin":2},"to":{"component":"LOAD","pin":1}},
{"from":{"component":"Q1","pin":3},"to":{"component":"GND","pin":1}}
\`\`\`

OpAmp Inverting:
\`\`\`json
{"from":{"component":"R_IN","pin":2},"to":{"component":"U1","pin":2}}
{"from":{"component":"R_FB","pin":1},"to":{"component":"U1","pin":2}}
{"from":{"component":"R_FB","pin":2},"to":{"component":"U1","pin":1}}
\`\`\`

## 🎯 CONTOH REASONING

User: "buat rangkaian LED dengan resistor"

Thinking:
1. PAHAMI: User mau buat LED circuit sederhana
2. ANALISIS: Butuh 1 resistor (330R) + 1 LED
3. DESIGN: Vertikal - R1 di atas, D1 di bawah
4. WIRE: R1 pin2 → D1 pin2 (LED anode)
5. EXECUTE: design_schematic dengan:
   - components: resistor R1 di (127,80), led D1 di (127,100)
   - wires: [{from:{component:"R1",pin:2}, to:{component:"D1",pin:2}}]

User: "buat transistor switch dengan BC547"

Thinking:
1. PAHAMI: User mau transistor sebagai switch
2. ANALISIS: Butuh NPN (BC547), resistor base (10k), dan load (LED+R)
3. DESIGN: Base bias kiri, transistor tengah, load kanan
4. WIRE: Input→R_base→Q1.B, Collector→Load, Emitter→GND
5. EXECUTE: design_schematic dengan 4 komponen, 4 koneksi

## 💬 GAYA KOMUNIKASI

- Bahasa Indonesia + sentuhan Jawa: "Nggih Mas", "Monggo", "Sampun rampung"
- Jelaskan reasoning dengan singkat
- Emoji secukupnya

## ⚠️ ATURAN WAJIB

1. **SELALU** buat wire connections - TIDAK BOLEH kosong
2. **HITUNG** jumlah wire = jumlah koneksi fisik yang dibutuhkan
3. **PAKAI** pin numbers yang benar sesuai tabel di atas
4. **TEST** apakah setiap komponen terhubung (tidak ada floating)
5. **VERIFY** posisi tidak overlapping

PATH: D:/sijawir/KiCad_Projects/
`

// ============================================
// TYPES & STATE
// ============================================

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface GeminiResponse {
  type: 'text' | 'function_call'
  text?: string
  functionCall?: {
    name: string
    args: Record<string, unknown>
  }
}

let genAI: GoogleGenerativeAI | null = null
let currentApiKey: string = ''

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize Gemini API with API key
 * If no key provided, uses the first key from rotation pool
 */
export function initGemini(apiKey?: string): void {
  currentApiKey = apiKey || getNextAvailableKey() || API_KEYS[0]
  genAI = new GoogleGenerativeAI(currentApiKey)
  console.log(`[Gemini] Initialized with API key ${API_KEYS.indexOf(currentApiKey) + 1}/${API_KEYS.length}`)
}

/**
 * Reinitialize with next available key
 */
function rotateApiKey(): boolean {
  markKeyAsFailed(currentKeyIndex)
  const nextKey = getNextAvailableKey()

  if (nextKey) {
    currentApiKey = nextKey
    genAI = new GoogleGenerativeAI(currentApiKey)
    console.log(`[Gemini] Rotated to API key ${currentKeyIndex + 1}/${API_KEYS.length}`)
    return true
  }

  return false
}

/**
 * Get Gemini model instance
 */
function getModel() {
  if (!genAI) {
    initGemini()
  }

  return genAI!.getGenerativeModel({
    // Using Gemini 3 Flash
    model: 'gemini-3-flash-preview',
    systemInstruction: SYSTEM_PROMPT,
  })
}

// ============================================
// CHAT FUNCTIONS WITH RETRY
// ============================================

/**
 * Send chat message to Gemini with function calling support
 * Automatically rotates API key on quota errors
 */
export async function chatWithGemini(
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  retryCount: number = 0
): Promise<GeminiResponse> {
  const maxRetries = API_KEYS.length

  try {
    const model = getModel()

    // Convert chat history to Gemini format
    const history = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    // Start chat with history
    const chat = model.startChat({
      history,
      tools: [{
        functionDeclarations: Object.values(GEMINI_TOOLS).map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        })),
      }],
    })

    const result = await chat.sendMessage(userMessage)
    const response = result.response

    // Check for function calls
    const functionCalls = response.functionCalls()
    if (functionCalls && functionCalls.length > 0) {
      const fc = functionCalls[0]
      return {
        type: 'function_call',
        functionCall: {
          name: fc.name,
          args: fc.args as Record<string, unknown>,
        },
      }
    }

    // Regular text response
    return {
      type: 'text',
      text: response.text(),
    }
  } catch (error) {
    console.error('[Gemini] API error:', error)

    // Check if retryable error and retry with next key
    if (isRetryableError(error) && retryCount < maxRetries) {
      console.log(`[Gemini] Error detected, rotating API key (attempt ${retryCount + 1}/${maxRetries})`)

      // Wait before retry (respect rate limits)
      const delayMs = Math.min(1000 * (retryCount + 1), 5000) // 1s, 2s, 3s... max 5s
      console.log(`[Gemini] Waiting ${delayMs}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))

      if (rotateApiKey()) {
        return chatWithGemini(userMessage, chatHistory, retryCount + 1)
      }
    }

    throw error
  }
}

/**
 * Send function result back to Gemini for final response
 */
export async function sendFunctionResult(
  functionName: string,
  result: unknown,
  chatHistory: ChatMessage[] = [],
  retryCount: number = 0
): Promise<string> {
  const maxRetries = API_KEYS.length

  try {
    const model = getModel()

    const history = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({ history })

    const response = await chat.sendMessage([
      {
        functionResponse: {
          name: functionName,
          response: { result },
        },
      },
    ])

    return response.response.text()
  } catch (error) {
    if (isRetryableError(error) && retryCount < maxRetries) {
      console.log(`[Gemini] Quota exceeded in sendFunctionResult, rotating...`)
      if (rotateApiKey()) {
        return sendFunctionResult(functionName, result, chatHistory, retryCount + 1)
      }
    }
    throw error
  }
}

/**
 * Simple single message to Gemini (no history, no function calling)
 */
export async function askGemini(prompt: string, retryCount: number = 0): Promise<string> {
  const maxRetries = API_KEYS.length

  try {
    const model = getModel()
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    if (isRetryableError(error) && retryCount < maxRetries) {
      console.log(`[Gemini] Quota exceeded in askGemini, rotating...`)
      if (rotateApiKey()) {
        return askGemini(prompt, retryCount + 1)
      }
    }
    throw error
  }
}

/**
 * Validate Gemini API key
 */
export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const testAI = new GoogleGenerativeAI(apiKey)
    const model = testAI.getGenerativeModel({ model: 'gemini-3-flash' })
    await model.generateContent('Hello')
    return true
  } catch {
    return false
  }
}

/**
 * Get current API status
 */
export function getApiStatus(): {
  currentKey: number
  totalKeys: number
  failedKeys: number[]
  availableKeys: number
} {
  return {
    currentKey: currentKeyIndex + 1,
    totalKeys: API_KEYS.length,
    failedKeys: Array.from(failedKeys).map(i => i + 1),
    availableKeys: API_KEYS.length - failedKeys.size,
  }
}
