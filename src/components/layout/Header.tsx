import { StatusBadge } from './StatusBadge'
import { ModeIndicator } from './ModeIndicator'
import { useSettingsStore } from '@stores/settingsStore'
import { useChatStore } from '@stores/chatStore'
import { useWorkspaceStore } from '@stores/workspaceStore'
import { useIoTStore } from '@stores/iotStore'
import { useState } from 'react'

export function Header() {
  const openSettings = useSettingsStore((state) => state.openSettings)
  const clearMessages = useChatStore((state) => state.clearMessages)
  const clearCards = useWorkspaceStore((state) => state.clearCards)
  const clearLogs = useIoTStore((state) => state.clearLogs)
  const [showDemoMenu, setShowDemoMenu] = useState(false)
  
  return (
    <header className="h-header bg-coffee-dark border-b border-coffee-medium relative flex-shrink-0">
      {/* Batik Trim - Animated gradient pattern at top */}
      <div className="batik-trim absolute top-0 left-0 right-0" />
      
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">spa</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-cream tracking-tight">Jawir OS</h1>
            <p className="text-xs text-cream-muted -mt-0.5">AI Assistant</p>
          </div>
        </div>
        
        {/* Status Badge - Center */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <StatusBadge />
        </div>
        
        {/* Actions - Right */}
        <div className="flex items-center gap-2">
          {/* Mode Indicator */}
          <ModeIndicator />
          
          {/* Demo Mode Button */}
          <div className="relative">
            <button 
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="btn-ghost p-2.5 rounded-xl hover:bg-coffee-light transition-colors group"
              title="Demo Mode"
            >
              <span className="material-symbols-outlined text-primary text-xl group-hover:animate-pulse">
                play_circle
              </span>
            </button>
            
            {/* Demo Menu Dropdown */}
            {showDemoMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-coffee-medium border border-coffee-light/20 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2">
                  <p className="text-xs text-cream-muted px-3 py-2 font-medium">Demo Mode</p>
                  <button
                    onClick={() => {
                      clearMessages()
                      clearCards()
                      clearLogs()
                      setShowDemoMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-cream rounded-lg hover:bg-coffee-light transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-error">restart_alt</span>
                    Reset Semua
                  </button>
                  <button
                    onClick={() => {
                      clearMessages()
                      setShowDemoMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-cream rounded-lg hover:bg-coffee-light transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-warning">chat_bubble</span>
                    Bersihkan Chat
                  </button>
                  <button
                    onClick={() => {
                      clearCards()
                      setShowDemoMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-cream rounded-lg hover:bg-coffee-light transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-info">dashboard</span>
                    Bersihkan Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* History Button */}
          <button 
            className="btn-ghost p-2.5 rounded-xl hover:bg-coffee-light transition-colors"
            title="Riwayat Chat"
          >
            <span className="material-symbols-outlined text-cream-muted text-xl">history</span>
          </button>
          
          {/* Settings Button */}
          <button 
            onClick={openSettings}
            className="btn-ghost p-2.5 rounded-xl hover:bg-coffee-light transition-colors"
            title="Pengaturan"
          >
            <span className="material-symbols-outlined text-cream-muted text-xl">settings</span>
          </button>
          
          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center ml-2 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <span className="text-coffee-dark font-bold text-sm">J</span>
          </div>
        </div>
      </div>
    </header>
  )
}
