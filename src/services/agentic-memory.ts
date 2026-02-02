// Agentic Memory - Step and Context Tracking
// Maintains execution history for backtracking and learning

import type { AgenticStep } from './agentic-executor'

// ============================================
// TYPES
// ============================================

export interface ExecutionContext {
    sessionId: string
    goal: string
    startTime: number
    steps: AgenticStep[]
    currentStepIndex: number
    status: 'running' | 'completed' | 'failed' | 'paused'
    metadata: Record<string, unknown>
}

export interface MemoryEntry {
    goal: string
    success: boolean
    stepsCount: number
    executionTime: number
    finalAnswer: string
    timestamp: number
}

// ============================================
// IN-MEMORY STORAGE
// ============================================

// Current execution context
let currentContext: ExecutionContext | null = null

// History of past executions (last 10)
const executionHistory: MemoryEntry[] = []
const MAX_HISTORY = 10

// ============================================
// CONTEXT MANAGEMENT
// ============================================

/**
 * Start a new execution context
 */
export function startContext(goal: string, metadata: Record<string, unknown> = {}): ExecutionContext {
    currentContext = {
        sessionId: generateSessionId(),
        goal,
        startTime: Date.now(),
        steps: [],
        currentStepIndex: 0,
        status: 'running',
        metadata,
    }

    console.log(`[Memory] Started context: ${currentContext.sessionId}`)
    return currentContext
}

/**
 * Get current execution context
 */
export function getCurrentContext(): ExecutionContext | null {
    return currentContext
}

/**
 * Add a step to current context
 */
export function addStep(step: AgenticStep): void {
    if (!currentContext) {
        console.warn('[Memory] No active context')
        return
    }

    currentContext.steps.push(step)
    currentContext.currentStepIndex = currentContext.steps.length - 1
}

/**
 * Update context status
 */
export function updateContextStatus(status: ExecutionContext['status']): void {
    if (currentContext) {
        currentContext.status = status
    }
}

/**
 * Complete current context and add to history
 */
export function completeContext(success: boolean, finalAnswer: string): void {
    if (!currentContext) return

    const entry: MemoryEntry = {
        goal: currentContext.goal,
        success,
        stepsCount: currentContext.steps.length,
        executionTime: Date.now() - currentContext.startTime,
        finalAnswer,
        timestamp: Date.now(),
    }

    // Add to history
    executionHistory.unshift(entry)

    // Keep only last N entries
    if (executionHistory.length > MAX_HISTORY) {
        executionHistory.pop()
    }

    currentContext.status = success ? 'completed' : 'failed'

    console.log(`[Memory] Context completed: ${currentContext.sessionId}, success: ${success}`)

    // Clear current context
    currentContext = null
}

/**
 * Get the last step from current context
 */
export function getLastStep(): AgenticStep | null {
    if (!currentContext || currentContext.steps.length === 0) {
        return null
    }
    return currentContext.steps[currentContext.steps.length - 1]
}

/**
 * Get all failed steps from current context
 */
export function getFailedSteps(): AgenticStep[] {
    if (!currentContext) return []
    return currentContext.steps.filter(s => !s.success)
}

// ============================================
// HISTORY QUERIES
// ============================================

/**
 * Get execution history
 */
export function getHistory(): MemoryEntry[] {
    return [...executionHistory]
}

/**
 * Find similar past executions
 */
export function findSimilarExecutions(goal: string): MemoryEntry[] {
    const keywords = goal.toLowerCase().split(/\s+/)

    return executionHistory.filter(entry => {
        const entryKeywords = entry.goal.toLowerCase()
        return keywords.some(kw => entryKeywords.includes(kw))
    })
}

/**
 * Get success rate from history
 */
export function getSuccessRate(): number {
    if (executionHistory.length === 0) return 0

    const successCount = executionHistory.filter(e => e.success).length
    return Math.round((successCount / executionHistory.length) * 100)
}

/**
 * Clear all history
 */
export function clearHistory(): void {
    executionHistory.length = 0
    currentContext = null
    console.log('[Memory] History cleared')
}

// ============================================
// HELPERS
// ============================================

function generateSessionId(): string {
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get context summary for display
 */
export function getContextSummary(): string {
    if (!currentContext) {
        return 'Tidak ada eksekusi aktif'
    }

    const elapsed = Math.round((Date.now() - currentContext.startTime) / 1000)
    const successSteps = currentContext.steps.filter(s => s.success).length

    return `**Session:** ${currentContext.sessionId}
**Goal:** ${currentContext.goal}
**Status:** ${currentContext.status}
**Steps:** ${successSteps}/${currentContext.steps.length} sukses
**Elapsed:** ${elapsed}s`
}
