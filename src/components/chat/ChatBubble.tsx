import type { ChatMessage } from '@stores/chatStore'

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.type === 'user'
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-coffee-light' : 'bg-primary'
      }`}>
        <span className={`material-symbols-outlined text-lg ${
          isUser ? 'text-cream-muted' : 'text-coffee-dark'
        }`}>
          {isUser ? 'person' : 'spa'}
        </span>
      </div>
      
      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`rounded-2xl p-4 max-w-[85%] ${
          isUser 
            ? 'bg-primary text-coffee-dark rounded-tr-md' 
            : 'bg-coffee-light text-cream rounded-tl-md'
        }`}>
          {/* Voice indicator */}
          {message.isVoice && (
            <div className={`flex items-center gap-1 text-xs mb-2 ${
              isUser ? 'text-coffee-medium' : 'text-cream-muted'
            }`}>
              <span className="material-symbols-outlined text-sm">mic</span>
              <span>Pesan suara</span>
            </div>
          )}
          
          {/* Message text */}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          
          {/* Tool calls indicator */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-coffee-medium/30 space-y-2">
              {message.toolCalls.map((tool, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 text-xs ${
                    isUser ? 'text-coffee-medium' : 'text-cream-muted'
                  }`}
                >
                  {tool.status === 'pending' && (
                    <div className="loading-spinner w-3 h-3" />
                  )}
                  {tool.status === 'success' && (
                    <span className="material-symbols-outlined text-success text-sm">check_circle</span>
                  )}
                  {tool.status === 'error' && (
                    <span className="material-symbols-outlined text-error text-sm">error</span>
                  )}
                  <span className="font-mono">{tool.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <span className={`text-xs text-cream-muted mt-1 block ${isUser ? 'mr-1' : 'ml-1'}`}>
          {message.timestamp.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  )
}
