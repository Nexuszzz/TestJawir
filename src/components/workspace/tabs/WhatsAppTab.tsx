import { useWorkspaceStore } from '@stores/workspaceStore'

export function WhatsAppTab() {
  const cards = useWorkspaceStore((state) => 
    state.cards.filter(c => c.type === 'whatsapp')
  )
  
  // Empty state
  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-whatsapp/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-whatsapp text-5xl">chat</span>
        </div>
        <h2 className="text-2xl font-bold text-cream mb-3">WhatsApp Messaging</h2>
        <p className="text-cream-muted max-w-md mb-8 leading-relaxed">
          Kirim pesan WhatsApp via suara atau text.
          <br />Pesan akan dikonfirmasi sebelum dikirim.
        </p>
        
        {/* Example commands */}
        <div className="space-y-3 max-w-lg">
          <div className="bg-coffee-light rounded-xl p-4 text-left">
            <p className="text-cream text-sm font-medium mb-1">Contoh perintah:</p>
            <ul className="text-cream-muted text-sm space-y-1">
              <li>• "Kirim pesan ke Naufal: Halo, skematik sudah jadi"</li>
              <li>• "WhatsApp Dosen: Selamat siang, ijin konsultasi"</li>
              <li>• "Beritahu Mas Budi bahwa meeting jam 3"</li>
            </ul>
          </div>
        </div>
        
        {/* Connection status */}
        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-coffee-light rounded-full">
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span className="text-xs text-cream-muted">Menunggu koneksi WhatsApp Gateway</span>
        </div>
      </div>
    )
  }
  
  // Cards view
  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <div 
          key={card.id}
          className="workspace-card bg-gradient-to-br from-cream to-cream-dark rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              card.status === 'success' ? 'bg-whatsapp/10' : 'bg-warning/10'
            }`}>
              <span className={`material-symbols-outlined text-2xl ${
                card.status === 'success' ? 'text-whatsapp' : 'text-warning'
              }`}>
                {card.status === 'success' ? 'check_circle' : 'schedule'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-coffee-dark">{card.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  card.status === 'success' 
                    ? 'bg-whatsapp/10 text-whatsapp' 
                    : 'bg-warning/10 text-warning'
                }`}>
                  {card.status === 'success' ? 'Terkirim' : 'Menunggu konfirmasi'}
                </span>
              </div>
              <p className="text-sm text-coffee-medium">{card.description || card.content}</p>
              
              {card.timestamp && (
                <p className="text-xs text-coffee-light mt-2">
                  {new Date(card.timestamp).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>
          
          {/* Pending actions */}
          {card.status === 'pending' && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-coffee-light">
              <button className="flex-1 py-2 text-sm bg-whatsapp text-white rounded-xl font-medium">
                Konfirmasi & Kirim
              </button>
              <button className="px-4 py-2 text-sm bg-coffee-light text-coffee-dark rounded-xl font-medium">
                Batal
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
