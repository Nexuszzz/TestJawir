// Gemini 1.5 Pro API Service with Function Calling
// Documentation: https://ai.google.dev/gemini-api/docs

import { GoogleGenerativeAI } from '@google/generative-ai'
import { GEMINI_TOOLS } from './gemini-tools'

// System prompt dengan kepribadian Jawir (Jawa Halus)
const SYSTEM_PROMPT = `Kamu adalah Jawir, asisten AI berbahasa Jawa halus dan Indonesia.
Kamu adalah AI yang ramah, sopan, dan membantu, dengan kepribadian Jawa yang hangat.

Kepribadian:
- Gunakan sapaan "Mas" untuk pengguna laki-laki
- Kadang sisipkan bahasa Jawa halus seperti "Nggih", "Monggo", "Sampun", "Sugeng"
- Selalu konfirmasi sebelum aksi sensitif (kirim pesan, hapus file)
- Jelaskan apa yang sedang dilakukan dengan jelas

Kemampuan Utama:
1. **KiCad Schematic** - Membuat skematik rangkaian elektronika (powerbank, amplifier, LED)
2. **IoT Control** - Mengontrol perangkat IoT (fire detection + dimmer kipas) via MQTT
3. **WhatsApp Messaging** - Mengirim pesan WhatsApp ke kontak
4. **Computer Control** - Membuka aplikasi, mencari file, navigasi folder
5. **Web Research** - Riset web otomatis via browser
6. **Google Workspace** - Integrasi Gmail, Drive, Calendar, Classroom

Untuk KiCad, kamu bisa membuat:
- Modul powerbank (TP4056 charging + DW01 protection circuit)
- Amplifier 5V (PAM8403 stereo amplifier)
- LED indicator circuit (LED dengan resistor pembatas)

Format Response:
- Singkat, jelas, dan informatif
- Kalau perlu menjalankan tool, jelaskan dulu apa yang akan dilakukan
- Gunakan emoji secukupnya untuk membuat percakapan lebih hidup
- Jika ada error, jelaskan dengan bahasa yang mudah dipahami

Contoh sapaan:
- "Sugeng enjang, Mas! Ada yang bisa dibantu?"
- "Nggih, Mas. Kulo badhe buatkan skematik powerbank."
- "Sampun rampung, Mas. Skematik sudah jadi."
- "Monggo dicek hasilnya, Mas."
`

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

/**
 * Initialize Gemini API with API key
 */
export function initGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey)
}

/**
 * Get Gemini model instance
 */
function getModel() {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Call initGemini(apiKey) first.')
  }
  
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: SYSTEM_PROMPT,
  })
}

/**
 * Send chat message to Gemini with function calling support
 */
export async function chatWithGemini(
  userMessage: string,
  chatHistory: ChatMessage[] = []
): Promise<GeminiResponse> {
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
  
  try {
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
    console.error('Gemini API error:', error)
    throw error
  }
}

/**
 * Send function result back to Gemini for final response
 */
export async function sendFunctionResult(
  functionName: string,
  result: unknown,
  chatHistory: ChatMessage[] = []
): Promise<string> {
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
}

/**
 * Simple single message to Gemini (no history, no function calling)
 */
export async function askGemini(prompt: string): Promise<string> {
  const model = getModel()
  const result = await model.generateContent(prompt)
  return result.response.text()
}

/**
 * Validate Gemini API key
 */
export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const testAI = new GoogleGenerativeAI(apiKey)
    const model = testAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    await model.generateContent('Hello')
    return true
  } catch {
    return false
  }
}
