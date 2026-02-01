import { useWorkspaceStore } from '@stores/workspaceStore'

export function KiCadTab() {
  const cards = useWorkspaceStore((state) => 
    state.cards.filter(c => c.type === 'kicad')
  )
  
  // Empty state
  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-coffee-light flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary text-5xl">memory</span>
        </div>
        <h2 className="text-2xl font-bold text-cream mb-3">KiCad Schematic</h2>
        <p className="text-cream-muted max-w-md mb-8 leading-relaxed">
          Mulai buat skematik rangkaian elektronika dengan perintah suara atau text.
          <br />Tersedia template siap pakai!
        </p>
        
        {/* Quick Templates */}
        <div className="flex flex-wrap gap-3 justify-center">
          <TemplateButton 
            icon="battery_charging_full"
            label="Modul Powerbank"
            description="TP4056 + DW01 charging circuit"
          />
          <TemplateButton 
            icon="volume_up"
            label="Amplifier 5V"
            description="PAM8403 stereo amplifier"
          />
          <TemplateButton 
            icon="lightbulb"
            label="LED Indicator"
            description="Rangkaian LED dengan resistor"
          />
        </div>
        
        {/* Instructions */}
        <div className="mt-10 p-6 bg-coffee-light/50 rounded-2xl max-w-lg">
          <h3 className="text-cream font-semibold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tips_and_updates</span>
            Cara Penggunaan
          </h3>
          <ul className="text-cream-muted text-sm text-left space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>Ucapkan atau ketik: "Buatkan skematik modul powerbank"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>Jawir akan membuat skematik dan menampilkan hasilnya di sini</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>Klik "Buka di KiCad" untuk mengedit skematik</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }
  
  // Cards view
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {cards.map((card) => (
        <div 
          key={card.id}
          className="workspace-card bg-gradient-to-br from-cream to-cream-dark rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">memory</span>
              </div>
              <div>
                <h3 className="font-bold text-coffee-dark">{card.title}</h3>
                <p className="text-sm text-coffee-medium">{card.description}</p>
              </div>
            </div>
            <StatusBadge status={card.status} />
          </div>
          
          {/* Metadata */}
          {card.metadata && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(card.metadata).map(([key, value]) => (
                <div key={key} className="bg-white/50 rounded-xl p-3">
                  <span className="text-xs text-coffee-medium">{key}</span>
                  <p className="text-sm font-medium text-coffee-dark">{String(value)}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Actions */}
          {card.actions && card.actions.length > 0 && (
            <div className="flex gap-2 pt-2">
              {card.actions.map((action, idx) => (
                <button 
                  key={idx}
                  className={`flex-1 py-2 text-sm rounded-xl font-medium flex items-center justify-center gap-1 ${
                    action.variant === 'primary' 
                      ? 'bg-primary text-coffee-dark' 
                      : 'bg-coffee-light text-coffee-dark'
                  }`}
                >
                  {action.icon && (
                    <span className="material-symbols-outlined text-lg">{action.icon}</span>
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Helper components
function TemplateButton({ icon, label, description }: { 
  icon: string
  label: string
  description: string 
}) {
  return (
    <button className="group flex items-center gap-3 px-4 py-3 bg-coffee-light rounded-xl hover:bg-coffee-light/80 transition-all text-left">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <div>
        <p className="text-cream font-medium text-sm">{label}</p>
        <p className="text-cream-muted text-xs">{description}</p>
      </div>
    </button>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'success' | 'error' | 'loading' | 'pending_confirmation' }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-warning/10', text: 'text-warning', label: 'Proses...' },
    loading: { bg: 'bg-info/10', text: 'text-info', label: 'Loading...' },
    pending_confirmation: { bg: 'bg-warning/10', text: 'text-warning', label: 'Menunggu konfirmasi' },
    success: { bg: 'bg-success/10', text: 'text-success', label: 'Selesai' },
    error: { bg: 'bg-error/10', text: 'text-error', label: 'Error' },
  }
  
  const c = config[status] || config.pending
  
  return (
    <div className={`px-3 py-1 rounded-full ${c.bg} flex items-center gap-1.5`}>
      {(status === 'pending' || status === 'loading') && <div className="loading-spinner w-3 h-3" />}
      {status === 'success' && <span className={`material-symbols-outlined text-sm ${c.text}`}>check_circle</span>}
      {status === 'error' && <span className={`material-symbols-outlined text-sm ${c.text}`}>error</span>}
      {status === 'pending_confirmation' && <span className={`material-symbols-outlined text-sm ${c.text}`}>pending</span>}
      <span className={`text-xs font-medium ${c.text}`}>{c.label}</span>
    </div>
  )
}
