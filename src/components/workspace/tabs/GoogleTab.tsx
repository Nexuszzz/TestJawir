import { useWorkspaceStore } from '@stores/workspaceStore'

export function GoogleTab() {
  const cards = useWorkspaceStore((state) => 
    state.cards.filter(c => c.type === 'google')
  )
  
  // Empty state
  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-google/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-google text-5xl">cloud</span>
        </div>
        <h2 className="text-2xl font-bold text-cream mb-3">Google Workspace</h2>
        <p className="text-cream-muted max-w-md mb-8 leading-relaxed">
          Akses layanan Google via suara.
          <br />Gmail, Drive, Calendar, dan Classroom.
        </p>
        
        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <ServiceCard 
            icon="mail"
            label="Gmail"
            description="Baca dan kirim email"
            color="text-error"
          />
          <ServiceCard 
            icon="folder"
            label="Drive"
            description="Akses file dan folder"
            color="text-warning"
          />
          <ServiceCard 
            icon="calendar_month"
            label="Calendar"
            description="Lihat jadwal"
            color="text-info"
          />
          <ServiceCard 
            icon="school"
            label="Classroom"
            description="Tugas dan kelas"
            color="text-success"
          />
        </div>
        
        {/* Connection status */}
        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-coffee-light rounded-full">
          <span className="w-2 h-2 rounded-full bg-cream-muted" />
          <span className="text-xs text-cream-muted">Belum terhubung ke Google Account</span>
        </div>
        
        <button className="mt-4 btn-primary px-6 py-2 text-sm">
          <span className="material-symbols-outlined text-lg mr-1">login</span>
          Hubungkan Google Account
        </button>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-google/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-google text-2xl">
                {card.metadata?.service === 'gmail' ? 'mail' : 
                 card.metadata?.service === 'drive' ? 'folder' :
                 card.metadata?.service === 'calendar' ? 'calendar_month' : 'cloud'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-coffee-dark">{card.title}</h3>
              <p className="text-sm text-coffee-medium">{card.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ServiceCard({ icon, label, description, color }: {
  icon: string
  label: string
  description: string
  color: string
}) {
  return (
    <div className="bg-coffee-light rounded-xl p-4 text-left hover:bg-coffee-light/80 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-2">
        <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
        <span className="text-cream font-medium">{label}</span>
      </div>
      <p className="text-cream-muted text-xs">{description}</p>
    </div>
  )
}
