import { create } from 'zustand'

export type WorkspaceTab = 'kicad' | 'browser' | 'whatsapp' | 'google' | 'iot' | 'computer'

export interface WorkspaceCard {
  id: string
  type: 'kicad' | 'browser' | 'whatsapp' | 'google' | 'iot' | 'computer'
  title: string
  content?: string
  description?: string
  template?: string
  status: 'pending' | 'success' | 'error' | 'loading' | 'pending_confirmation'
  timestamp: Date
  metadata?: Record<string, unknown>
  actions?: Array<{
    label: string
    icon?: string
    variant: 'primary' | 'secondary' | 'danger'
    action: string
  }>
  // WhatsApp specific
  contactName?: string
  // Browser specific
  url?: string
  query?: string
  extractType?: string
  // Computer specific
  data?: {
    query?: string
    location?: string
    results?: Array<{ FullName?: string; path?: string; name?: string }>
    path?: string
    // OI specific
    type?: 'file_search' | 'oi_result' | 'code_analysis'
    response?: unknown
    filePath?: string
    action?: string
  }
}

interface WorkspaceState {
  activeTab: WorkspaceTab
  cards: WorkspaceCard[]
  
  // Actions
  setActiveTab: (tab: WorkspaceTab) => void
  addCard: (card: Omit<WorkspaceCard, 'id' | 'timestamp'>) => void
  updateCard: (id: string, updates: Partial<WorkspaceCard>) => void
  removeCard: (id: string) => void
  clearCards: (type?: WorkspaceTab) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTab: 'kicad',
  cards: [],
  
  setActiveTab: (activeTab) => set({ activeTab }),
  
  addCard: (card) => set((state) => ({
    cards: [
      ...state.cards,
      {
        ...card,
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      },
    ],
  })),
  
  updateCard: (id, updates) => set((state) => ({
    cards: state.cards.map((card) =>
      card.id === id ? { ...card, ...updates } : card
    ),
  })),
  
  removeCard: (id) => set((state) => ({
    cards: state.cards.filter((card) => card.id !== id),
  })),
  
  clearCards: (type) => set((state) => ({
    cards: type
      ? state.cards.filter((card) => card.type !== type)
      : [],
  })),
}))
