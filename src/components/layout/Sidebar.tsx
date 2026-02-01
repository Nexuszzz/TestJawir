import { useChatStore } from '@stores/chatStore'
import { useVoiceStore } from '@stores/voiceStore'
import { ChatBubble } from '@components/chat/ChatBubble'
import { ChatInput } from '@components/chat/ChatInput'
import { VoiceVisualizer } from '@components/chat/VoiceVisualizer'

export function Sidebar() {
  const messages = useChatStore((state) => state.messages)
  const status = useVoiceStore((state) => state.status)
  
  return (
    <aside className="w-sidebar bg-coffee-dark border-r border-coffee-medium flex flex-col flex-shrink-0">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Day Divider */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-coffee-medium" />
          <span className="text-xs text-cream-muted font-medium">Hari ini</span>
          <div className="flex-1 h-px bg-coffee-medium" />
        </div>
        
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-coffee-dark text-lg">spa</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-coffee-light rounded-2xl rounded-tl-md p-4">
                <p className="text-cream text-sm leading-relaxed">
                  Sugeng rawuh, Mas! 👋
                </p>
                <p className="text-cream text-sm leading-relaxed mt-2">
                  Kulo <span className="text-primary font-semibold">Jawir</span>, asisten AI kangge elektronika. 
                  Kulo saged mbantu panjenengan:
                </p>
                <ul className="text-cream text-sm mt-3 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">memory</span>
                    <span>Buatkan skematik KiCad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-success text-lg">sensors</span>
                    <span>Kontrol perangkat IoT</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-whatsapp text-lg">chat</span>
                    <span>Kirim pesan WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-info text-lg">folder_open</span>
                    <span>Buka aplikasi & cari file</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-google text-lg">travel_explore</span>
                    <span>Riset web otomatis</span>
                  </li>
                </ul>
                <p className="text-cream-muted text-xs mt-4">
                  Monggo, langsung mawon ngomong atau ketik perintah...
                </p>
              </div>
              <span className="text-xs text-cream-muted mt-1 block ml-1">
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        
        {/* Voice Visualizer when listening */}
        {status === 'listening' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-coffee-light flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-cream-muted text-lg">person</span>
            </div>
            <div className="flex-1">
              <div className="bg-primary/10 border border-primary/30 rounded-2xl rounded-tl-md p-4">
                <VoiceVisualizer />
              </div>
            </div>
          </div>
        )}
        
        {/* Processing indicator */}
        {(status === 'processing' || status === 'transcribing') && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-coffee-dark text-lg">spa</span>
            </div>
            <div className="flex-1">
              <div className="bg-coffee-light rounded-2xl rounded-tl-md p-4">
                <div className="flex items-center gap-2">
                  <div className="loading-spinner" />
                  <span className="text-cream-muted text-sm">
                    {status === 'transcribing' ? 'Memproses audio...' : 'Sedang berpikir...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      <ChatInput />
    </aside>
  )
}
