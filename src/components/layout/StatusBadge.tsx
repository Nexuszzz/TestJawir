import { useVoiceStore } from '@stores/voiceStore'

export function StatusBadge() {
  const status = useVoiceStore((state) => state.status)
  
  const statusConfig = {
    standby: {
      label: 'Standby',
      bgColor: 'bg-coffee-light',
      dotColor: 'bg-cream-muted',
      animation: 'animate-pulse',
    },
    listening: {
      label: 'Mendengarkan...',
      bgColor: 'bg-primary/20',
      dotColor: 'bg-primary',
      animation: 'animate-pulse',
    },
    transcribing: {
      label: 'Memproses...',
      bgColor: 'bg-info/20',
      dotColor: 'bg-info',
      animation: 'animate-spin',
    },
    processing: {
      label: 'Berpikir...',
      bgColor: 'bg-warning/20',
      dotColor: 'bg-warning',
      animation: 'animate-pulse',
    },
    responding: {
      label: 'Berbicara...',
      bgColor: 'bg-success/20',
      dotColor: 'bg-success',
      animation: 'animate-pulse',
    },
  }
  
  const config = statusConfig[status]
  
  return (
    <div className={`px-4 py-1.5 rounded-full ${config.bgColor} flex items-center gap-2 transition-all duration-300`}>
      <span className={`w-2 h-2 rounded-full ${config.dotColor} ${config.animation}`} />
      <span className="text-sm text-cream font-medium">{config.label}</span>
    </div>
  )
}
