import { useEffect, useState } from 'react'
import { useVoiceStore } from '@stores/voiceStore'

export function VoiceVisualizer() {
  const audioLevel = useVoiceStore((state) => state.audioLevel)
  const [bars, setBars] = useState<number[]>(Array(12).fill(20))
  
  // Simulate audio visualization
  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => {
        const base = 20 + (audioLevel * 0.6)
        const variance = Math.random() * 40
        return Math.min(100, Math.max(15, base + variance))
      }))
    }, 100)
    
    return () => clearInterval(interval)
  }, [audioLevel])
  
  return (
    <div className="voice-visualizer">
      {bars.map((height, index) => (
        <div
          key={index}
          className="waveform-bar"
          style={{
            height: `${height}%`,
            animationDelay: `${index * 50}ms`,
          }}
        />
      ))}
    </div>
  )
}
