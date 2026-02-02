// Planner Service - Task Decomposition
// Breaks complex goals into executable sub-tasks

import { askGemini } from './gemini'

// ============================================
// TYPES
// ============================================

export interface PlanStep {
    stepNumber: number
    description: string
    expectedTool: string | null
    dependencies: number[]  // Step numbers this depends on
}

export interface TaskPlan {
    goal: string
    steps: PlanStep[]
    estimatedDuration: string
    complexity: 'simple' | 'medium' | 'complex'
}

// ============================================
// PLANNER
// ============================================

const PLANNING_PROMPT = `
Kamu adalah AI Planner. Tugasmu adalah memecah goal menjadi langkah-langkah kecil yang bisa dieksekusi.

Format output HARUS seperti ini:
COMPLEXITY: [simple/medium/complex]
ESTIMATED_TIME: [estimasi waktu]
STEPS:
1. [langkah 1] | TOOL: [nama tool atau 'none']
2. [langkah 2] | TOOL: [nama tool atau 'none']
...

Tools yang tersedia:
- open_application: Buka aplikasi
- execute_command: Jalankan command terminal
- find_file: Cari file
- create_schematic: Buat skematik KiCad
- oi_execute: Jalankan kode kompleks
- search_web: Cari di internet
- none: Langkah tidak memerlukan tool

RULES:
- Setiap langkah harus spesifik dan actionable
- Urutkan berdasarkan dependencies
- Maksimal 5 langkah untuk tugas simple, 10 untuk kompleks
`

/**
 * Create a plan for a complex task
 */
export async function createPlan(goal: string): Promise<TaskPlan> {
    const prompt = `${PLANNING_PROMPT}\n\nGOAL: ${goal}\n\nBuat rencana eksekusi:`

    const response = await askGemini(prompt)

    // Parse the response
    const plan = parsePlanResponse(response, goal)

    console.log('[Planner] Created plan:', plan)

    return plan
}

/**
 * Parse Gemini response into TaskPlan
 */
function parsePlanResponse(response: string, goal: string): TaskPlan {
    const lines = response.split('\n').filter(l => l.trim())

    // Extract complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'simple'
    const complexityMatch = response.match(/COMPLEXITY:\s*(simple|medium|complex)/i)
    if (complexityMatch) {
        complexity = complexityMatch[1].toLowerCase() as 'simple' | 'medium' | 'complex'
    }

    // Extract estimated time
    let estimatedDuration = 'beberapa detik'
    const timeMatch = response.match(/ESTIMATED_TIME:\s*(.+)/i)
    if (timeMatch) {
        estimatedDuration = timeMatch[1].trim()
    }

    // Extract steps
    const steps: PlanStep[] = []
    const stepRegex = /(\d+)\.\s*(.+?)\s*\|\s*TOOL:\s*(\w+)/gi
    let match

    while ((match = stepRegex.exec(response)) !== null) {
        steps.push({
            stepNumber: parseInt(match[1]),
            description: match[2].trim(),
            expectedTool: match[3].toLowerCase() === 'none' ? null : match[3],
            dependencies: [],  // Could be enhanced to parse dependencies
        })
    }

    // If no steps found with regex, try simpler parsing
    if (steps.length === 0) {
        const stepLines = lines.filter(l => /^\d+\./.test(l.trim()))
        stepLines.forEach((line, idx) => {
            const desc = line.replace(/^\d+\.\s*/, '').split('|')[0].trim()
            steps.push({
                stepNumber: idx + 1,
                description: desc,
                expectedTool: null,
                dependencies: [],
            })
        })
    }

    return {
        goal,
        steps,
        estimatedDuration,
        complexity,
    }
}

/**
 * Validate if a plan is executable
 */
export function validatePlan(plan: TaskPlan): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    if (plan.steps.length === 0) {
        issues.push('Plan has no steps')
    }

    if (plan.steps.length > 10) {
        issues.push('Plan has too many steps (max 10)')
    }

    // Check for forward dependencies
    for (const step of plan.steps) {
        if (step.dependencies.some(d => d >= step.stepNumber)) {
            issues.push(`Step ${step.stepNumber} has forward dependency`)
        }
    }

    return {
        valid: issues.length === 0,
        issues,
    }
}

/**
 * Determine if a task needs planning
 */
export function needsPlanning(userMessage: string): boolean {
    const planningKeywords = [
        'project', 'proyek', 'aplikasi lengkap',
        'sistem', 'buatkan', 'develop',
        'from scratch', 'dari awal',
        'arsitektur', 'design'
    ]

    const lowerMessage = userMessage.toLowerCase()
    const wordCount = userMessage.split(/\s+/).length

    // Long messages or containing planning keywords
    return wordCount > 20 || planningKeywords.some(kw => lowerMessage.includes(kw))
}

/**
 * Format plan for display
 */
export function formatPlanForDisplay(plan: TaskPlan): string {
    const header = `## 📋 Rencana Eksekusi\n\n**Goal:** ${plan.goal}\n**Kompleksitas:** ${plan.complexity}\n**Estimasi:** ${plan.estimatedDuration}\n\n`

    const steps = plan.steps.map(step => {
        const tool = step.expectedTool ? ` 🔧 \`${step.expectedTool}\`` : ''
        return `${step.stepNumber}. ${step.description}${tool}`
    }).join('\n')

    return header + steps
}
