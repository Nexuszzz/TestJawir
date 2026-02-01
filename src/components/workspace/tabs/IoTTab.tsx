import { useIoTStore } from '@stores/iotStore'
import { FireDetectionCard } from '@components/iot/FireDetectionCard'
import { DimmerFanCard } from '@components/iot/DimmerFanCard'

export function IoTTab() {
  const { fireDetection, fanDimmer } = useIoTStore()
  
  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between bg-coffee-light rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">sensors</span>
          <span className="text-cream font-medium">IoT Monitor</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              fireDetection.isOnline ? 'bg-success' : 'bg-error'
            }`} />
            <span className="text-xs text-cream-muted">Fire Detection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              fanDimmer.isOnline ? 'bg-success' : 'bg-error'
            }`} />
            <span className="text-xs text-cream-muted">Dimmer Kipas</span>
          </div>
        </div>
      </div>
      
      {/* Device Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FireDetectionCard />
        <DimmerFanCard />
      </div>
      
      {/* MQTT Log (collapsible) */}
      <div className="bg-coffee-light rounded-xl">
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cream-muted">terminal</span>
              <span className="text-cream font-medium text-sm">MQTT Log</span>
            </div>
            <span className="material-symbols-outlined text-cream-muted group-open:rotate-180 transition-transform">
              expand_more
            </span>
          </summary>
          <div className="px-4 pb-4">
            <div className="bg-coffee-dark rounded-lg p-3 h-40 overflow-y-auto font-mono text-xs">
              <MqttLogEntry timestamp="15:30:01" topic="nimak/deteksi-api/telemetry" message='{"temp":28,"hum":65}' />
              <MqttLogEntry timestamp="15:30:00" topic="nimak/deteksi-api/status" message="online" />
              <MqttLogEntry timestamp="15:29:55" topic="nimak/kipas/status" message="online" />
            </div>
          </div>
        </details>
      </div>
      
      {/* Quick commands */}
      <div className="bg-coffee-light/50 rounded-xl p-4">
        <h3 className="text-cream font-medium text-sm mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">tips_and_updates</span>
          Perintah Suara IoT
        </h3>
        <div className="flex flex-wrap gap-2">
          <QuickCommand text="Cek status sensor" />
          <QuickCommand text="Berapa suhu sekarang?" />
          <QuickCommand text="Matikan buzzer" />
          <QuickCommand text="Set kipas 75 persen" />
          <QuickCommand text="Kipas maksimal" />
        </div>
      </div>
    </div>
  )
}

function MqttLogEntry({ timestamp, topic, message }: {
  timestamp: string
  topic: string
  message: string
}) {
  return (
    <div className="text-cream-muted mb-1">
      <span className="text-cream-muted/50">[{timestamp}]</span>{' '}
      <span className="text-info">{topic}</span>:{' '}
      <span className="text-cream">{message}</span>
    </div>
  )
}

function QuickCommand({ text }: { text: string }) {
  return (
    <button className="px-3 py-1.5 bg-coffee-light rounded-lg text-cream-muted text-xs hover:text-cream hover:bg-coffee-medium transition-colors">
      "{text}"
    </button>
  )
}
