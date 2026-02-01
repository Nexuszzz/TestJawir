import { useVoiceStore } from '@stores/voiceStore'

export function ListeningOverlay() {
  const { status, transcript, audioLevel } = useVoiceStore()
  
  if (status !== 'listening' && status !== 'transcribing') {
    return null
  }
  
  return (
    <div className="fixed inset-0 bg-coffee-dark/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        {/* Animated Mic Icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Outer pulse rings */}
          <div 
            className="absolute w-32 h-32 rounded-full bg-primary/20 animate-ping"
            style={{ animationDuration: '1.5s' }}
          />
          <div 
            className="absolute w-24 h-24 rounded-full bg-primary/30 animate-ping"
            style={{ animationDuration: '1s' }}
          />
          
          {/* Inner circle with audio level */}
          <div 
            className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center transition-transform duration-100"
            style={{ 
              transform: `scale(${1 + (audioLevel / 200)})`,
            }}
          >
            <span className="material-symbols-outlined text-coffee-dark text-4xl">
              {status === 'transcribing' ? 'hourglass_top' : 'mic'}
            </span>
          </div>
        </div>
        
        {/* Status Text */}
        <h2 className="text-2xl font-bold text-cream mb-2">
          {status === 'listening' ? 'Mendengarkan...' : 'Memproses audio...'}
        </h2>
        
        {/* Transcript Preview */}
        {transcript && (
          <div className="bg-coffee-light rounded-2xl p-4 mt-4">
            <p className="text-cream text-sm italic">"{transcript}"</p>
          </div>
        )}
        
        {/* Waveform Visualization */}
        {status === 'listening' && (
          <div className="flex items-center justify-center gap-1 h-12 mt-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full transition-all duration-75"
                style={{
                  height: `${20 + Math.random() * audioLevel * 0.6}%`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
        
        {/* Processing Spinner */}
        {status === 'transcribing' && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="loading-spinner" />
            <span className="text-cream-muted text-sm">Mengonversi audio ke teks...</span>
          </div>
        )}
        
        {/* Hint */}
        <p className="text-cream-muted text-xs mt-8">
          {status === 'listening' 
            ? 'Lepaskan tombol Space atau klik untuk berhenti'
            : 'Tunggu sebentar...'}
        </p>
      </div>
    </div>
  )
}
