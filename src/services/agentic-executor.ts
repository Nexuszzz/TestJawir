// Agentic Executor - ReAct Loop Implementation
// Enables multi-step autonomous task execution with self-correction

import { chatWithGemini } from './gemini'
import { routeToolCall } from '../tools/router'
import type { ChatMessage } from './gemini'

// ============================================
// TYPES
// ============================================

export interface AgenticStep {
    stepNumber: number
    thought: string      // AI's reasoning
    action: string       // Tool name
    actionInput: Record<string, unknown>  // Tool arguments
    observation: string  // Tool result
    success: boolean     // Whether tool succeeded
    timestamp: number
}

export interface AgenticResult {
    success: boolean
    steps: AgenticStep[]
    finalAnswer: string
    totalIterations: number
    executionTime: number
}

export interface AgenticConfig {
    maxIterations: number
    enableLogging: boolean
    onStepComplete?: (step: AgenticStep) => void
    onThinking?: (thought: string) => void
}

const DEFAULT_CONFIG: AgenticConfig = {
    maxIterations: 5,
    enableLogging: true,
}

// ============================================
// REACT SYSTEM PROMPT
// ============================================

const REACT_SYSTEM_PROMPT = `
# AI Agent dengan ReAct Pattern (Reasoning and Acting)

Kamu adalah AI Agent yang WAJIB berpikir step-by-step sebelum bertindak.
Gunakan format berikut PERSIS untuk setiap langkah:

## FORMAT WAJIB

\`\`\`
THOUGHT: [analisis mendalam - apa goals, apa yang dibutuhkan, apa risikonya]
ACTION: [nama tool PERSIS, case-sensitive]
ACTION_INPUT: [JSON valid dengan parameter]
\`\`\`

Setelah OBSERVATION (hasil tool), lanjutkan dengan THOUGHT baru atau FINAL_ANSWER.

## UNTUK TASK SKEMATIK/ELEKTRONIKA

Ketika user minta skematik, WAJIB reasoning ini:

THOUGHT 1 - ANALISIS REQUEST:
- Apa yang user minta? (powerbank? LED? sensor?)
- Template mana yang TEPAT? (powerbank, led_indicator, amplifier, fire_detection)
- Apakah perlu klarifikasi dulu?

THOUGHT 2 - KONFIRMASI KOMPONEN:
- Komponen apa saja yang akan dibuat?
- Bagaimana wiring nya? (VCC→komponen→GND)
- Jelaskan ke user sebelum eksekusi

THOUGHT 3 - EKSEKUSI DAN VERIFIKASI:
- Jalankan create_schematic dengan template yang BENAR
- Baca OBSERVATION - apakah sukses?
- Jika error, analisis dan coba perbaiki

## TOOLS YANG TERSEDIA

| Tool | Fungsi | Parameter |
|------|--------|-----------|
| create_schematic | Buat skematik KiCad | {template: "powerbank"/"led_indicator"/"amplifier"/"fire_detection", project_name?: string, open_kicad?: "yes"/"no"} |
| launch_kicad | Buka KiCad | {project_path?: string} |
| open_kicad_project | Buka project | {project_path: string} |
| open_application | Buka app | {app_name: string} |
| execute_command | Jalankan command | {command: string} |
| search_web | Cari di web | {query: string} |

## TEMPLATE SKEMATIK

- **powerbank**: Charging Li-Ion dengan TP4056 + DW01 protection 
  → Komponen: R_PROG, C_IN, C_OUT, LED_CHG, LED_STDBY, R_PROT
- **led_indicator**: LED dengan resistor current limiting
  → Komponen: R1(330Ω), D1(LED) | Wiring: VCC→R1→LED→GND
- **amplifier**: Audio amplifier PAM8403 5V stereo
- **fire_detection**: ESP32 + DHT11 + MQ2 + Flame + Buzzer

## RULES PENTING

1. JANGAN langsung eksekusi - ANALISIS dulu
2. JELASKAN ke user apa yang akan dilakukan
3. Jika error, BACA observation dan PERBAIKI
4. Maksimal ${DEFAULT_CONFIG.maxIterations} langkah
5. Gunakan bahasa Indonesia + Jawa halus (Mas, Nggih, Monggo)

## FORMAT FINAL ANSWER

\`\`\`
FINAL_ANSWER: [rangkuman hasil dalam bahasa ramah, jelaskan apa yang dibuat]
\`\`\`
`

// ============================================
// MAIN EXECUTOR
// ============================================

/**
 * Execute a task using ReAct loop pattern
 * Allows multi-step execution with self-correction
 */
export async function executeAgenticTask(
    goal: string,
    chatHistory: ChatMessage[] = [],
    config: Partial<AgenticConfig> = {}
): Promise<AgenticResult> {
    const cfg = { ...DEFAULT_CONFIG, ...config }
    const steps: AgenticStep[] = []
    const startTime = Date.now()

    let iteration = 0
    let isComplete = false
    let finalAnswer = ''

    if (cfg.enableLogging) {
        console.log('[Agentic] Starting task:', goal)
    }

    // Build initial context
    const agenticHistory: ChatMessage[] = [
        ...chatHistory,
        {
            role: 'user',
            content: `${REACT_SYSTEM_PROMPT}\n\n---GOAL---\n${goal}\n---END GOAL---\n\nMulai dengan THOUGHT pertama.`
        }
    ]

    while (!isComplete && iteration < cfg.maxIterations) {
        iteration++

        if (cfg.enableLogging) {
            console.log(`[Agentic] Iteration ${iteration}/${cfg.maxIterations}`)
        }

        try {
            // 1. THINK - Get reasoning from Gemini
            const thinkPrompt = iteration === 1
                ? 'Mulai dengan THOUGHT pertama untuk menganalisis goal.'
                : `OBSERVATION: ${steps[steps.length - 1].observation}\n\nLanjutkan dengan THOUGHT berikutnya atau FINAL_ANSWER jika sudah selesai.`

            const response = await chatWithGemini(thinkPrompt, agenticHistory)
            const responseText = response.text || ''

            // Update history
            agenticHistory.push({ role: 'model', content: responseText })

            // 2. Check for FINAL_ANSWER
            if (responseText.includes('FINAL_ANSWER:')) {
                finalAnswer = extractAfter(responseText, 'FINAL_ANSWER:').trim()
                isComplete = true

                if (cfg.enableLogging) {
                    console.log('[Agentic] Task complete:', finalAnswer)
                }
                break
            }

            // 3. Parse THOUGHT, ACTION, ACTION_INPUT
            const thought = extractBetween(responseText, 'THOUGHT:', 'ACTION:')
            const action = extractBetween(responseText, 'ACTION:', 'ACTION_INPUT:').trim()
            const actionInputStr = extractAfter(responseText, 'ACTION_INPUT:')

            if (cfg.onThinking) {
                cfg.onThinking(thought)
            }

            // Parse JSON input
            let actionInput: Record<string, unknown> = {}
            try {
                // Clean the JSON string - handle multiline
                const jsonMatch = actionInputStr.match(/\{[\s\S]*?\}/)
                if (jsonMatch) {
                    actionInput = JSON.parse(jsonMatch[0])
                }
            } catch (e) {
                // If JSON parse fails, try to extract key-value pairs
                actionInput = { raw: actionInputStr.trim() }
            }

            if (cfg.enableLogging) {
                console.log(`[Agentic] THOUGHT: ${thought.substring(0, 100)}...`)
                console.log(`[Agentic] ACTION: ${action}`)
                console.log(`[Agentic] INPUT:`, actionInput)
            }

            // 4. ACT - Execute the tool
            let observation = ''
            let toolSuccess = false

            if (action) {
                try {
                    const toolResult = await routeToolCall(action, actionInput)
                    observation = toolResult.message
                    toolSuccess = toolResult.success

                    if (cfg.enableLogging) {
                        console.log(`[Agentic] OBSERVATION: ${observation.substring(0, 100)}...`)
                    }
                } catch (error) {
                    observation = `Error executing tool: ${error}`
                    toolSuccess = false
                }
            } else {
                observation = 'No valid ACTION found in response'
                toolSuccess = false
            }

            // 5. Record step
            const step: AgenticStep = {
                stepNumber: iteration,
                thought: thought.trim(),
                action: action,
                actionInput,
                observation,
                success: toolSuccess,
                timestamp: Date.now(),
            }
            steps.push(step)

            // Callback for UI updates
            if (cfg.onStepComplete) {
                cfg.onStepComplete(step)
            }

            // Add observation to history for next iteration
            agenticHistory.push({
                role: 'user',
                content: `OBSERVATION: ${observation}`
            })

        } catch (error) {
            if (cfg.enableLogging) {
                console.error(`[Agentic] Error in iteration ${iteration}:`, error)
            }

            // Record failed step
            steps.push({
                stepNumber: iteration,
                thought: 'Error during execution',
                action: 'error',
                actionInput: {},
                observation: `Iteration failed: ${error}`,
                success: false,
                timestamp: Date.now(),
            })
        }
    }

    // If max iterations reached without completion
    if (!isComplete) {
        finalAnswer = `Tugas tidak selesai setelah ${cfg.maxIterations} langkah. Progress terakhir: ${steps[steps.length - 1]?.observation || 'Tidak ada'}`
    }

    const result: AgenticResult = {
        success: isComplete,
        steps,
        finalAnswer,
        totalIterations: iteration,
        executionTime: Date.now() - startTime,
    }

    if (cfg.enableLogging) {
        console.log(`[Agentic] Completed in ${result.executionTime}ms, ${iteration} iterations`)
    }

    return result
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractBetween(text: string, start: string, end: string): string {
    const startIdx = text.indexOf(start)
    const endIdx = text.indexOf(end)

    if (startIdx === -1) return ''
    if (endIdx === -1 || endIdx < startIdx) {
        return text.slice(startIdx + start.length).trim()
    }
    return text.slice(startIdx + start.length, endIdx).trim()
}

function extractAfter(text: string, marker: string): string {
    const idx = text.indexOf(marker)
    if (idx === -1) return ''
    return text.slice(idx + marker.length).trim()
}

/**
 * Format steps for display in chat
 */
export function formatStepsForDisplay(steps: AgenticStep[]): string {
    return steps.map(step => {
        const status = step.success ? '✅' : '❌'
        return `**Step ${step.stepNumber}** ${status}
💭 ${step.thought}
🔧 ${step.action}
📊 ${step.observation.substring(0, 200)}${step.observation.length > 200 ? '...' : ''}`
    }).join('\n\n---\n\n')
}

/**
 * Quick check if a task needs agentic execution
 * Simple tasks can use one-shot execution
 * Complex tasks like schematics use multi-step loop
 */
export function needsAgenticExecution(userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase()

    // Multi-step keywords (original)
    const complexKeywords = [
        'kemudian', 'lalu', 'setelah itu', 'dan juga',
        'step by step', 'langkah', 'beberapa',
        'cari lalu', 'buat lalu', 'buka lalu',
        'debug', 'fix', 'perbaiki', 'coba lagi'
    ]

    // Schematic/Electronics keywords - ALWAYS use agentic for these
    // karena butuh reasoning yang proper sebelum eksekusi
    const schematicKeywords = [
        'skematik', 'schematic', 'rangkaian', 'circuit',
        'kicad', 'pcb', 'elektronik', 'electronic',
        'powerbank', 'amplifier', 'led', 'sensor',
        'komponen', 'component', 'wiring', 'koneksi'
    ]

    // Check complex keywords
    if (complexKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return true
    }

    // Check schematic keywords - trigger agentic for better reasoning
    if (schematicKeywords.some(keyword => lowerMessage.includes(keyword))) {
        console.log('[Agentic] Schematic-related request detected, using agentic mode')
        return true
    }

    return false
}
