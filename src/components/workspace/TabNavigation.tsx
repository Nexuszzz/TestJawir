import { useWorkspaceStore, WorkspaceTab } from '@stores/workspaceStore'

interface Tab {
  id: WorkspaceTab
  label: string
  icon: string
  color: string
}

const tabs: Tab[] = [
  { id: 'kicad', label: 'KiCad', icon: 'memory', color: 'text-primary' },
  { id: 'browser', label: 'Browser', icon: 'travel_explore', color: 'text-info' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', color: 'text-whatsapp' },
  { id: 'google', label: 'Google', icon: 'cloud', color: 'text-google' },
  { id: 'iot', label: 'IoT', icon: 'sensors', color: 'text-success' },
  { id: 'computer', label: 'Computer', icon: 'computer', color: 'text-warning' },
]

export function TabNavigation() {
  const { activeTab, setActiveTab, cards } = useWorkspaceStore()
  
  // Count cards per tab
  const getCardCount = (tabId: WorkspaceTab) => {
    return cards.filter(c => c.type === tabId).length
  }
  
  return (
    <nav className="flex items-center gap-1 px-6 pt-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const cardCount = getCardCount(tab.id)
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-medium text-sm 
              transition-all duration-200
              ${isActive 
                ? 'bg-coffee-medium text-cream shadow-sm' 
                : 'text-cream-muted hover:text-cream hover:bg-coffee-light/50'
              }
            `}
          >
            <span className={`material-symbols-outlined text-lg transition-colors ${
              isActive ? tab.color : ''
            }`}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            
            {/* Card count badge */}
            {cardCount > 0 && (
              <span className={`
                absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full 
                flex items-center justify-center text-xs font-bold
                ${isActive ? 'bg-primary text-coffee-dark' : 'bg-coffee-light text-cream-muted'}
              `}>
                {cardCount}
              </span>
            )}
            
            {/* Active indicator line */}
            {isActive && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
