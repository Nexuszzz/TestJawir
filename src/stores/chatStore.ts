import { create } from 'zustand'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  role: 'user' | 'model'  // For Gemini API compatibility
  content: string
  timestamp: Date
  isVoice?: boolean
  toolCalls?: Array<{
    name: string
    status: 'pending' | 'success' | 'error'
    result?: unknown
  }>
}

interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  clearMessages: () => void
  setTyping: (isTyping: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  
  addMessage: (message) => set((state) => ({
    messages: [
      ...state.messages,
      {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      },
    ],
  })),
  
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    ),
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setTyping: (isTyping) => set({ isTyping }),
}))
