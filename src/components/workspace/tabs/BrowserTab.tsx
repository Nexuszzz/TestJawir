import { useWorkspaceStore } from '@stores/workspaceStore'

export function BrowserTab() {
  const cards = useWorkspaceStore((state) => 
    state.cards.filter(c => c.type === 'browser')
  )
  
  // Empty state
  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-coffee-light flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-info text-5xl">travel_explore</span>
        </div>
        <h2 className="text-2xl font-bold text-cream mb-3">Web Research</h2>
        <p className="text-cream-muted max-w-md mb-8 leading-relaxed">
          Minta Jawir untuk riset topik apapun di internet.
          <br />Hasil pencarian akan ditampilkan di sini.
        </p>
        
        {/* Example queries */}
        <div className="flex flex-wrap gap-3 justify-center max-w-xl">
          <ExampleQuery text="Cari datasheet TP4056" />
          <ExampleQuery text="Bagaimana cara kerja amplifier Class-D?" />
          <ExampleQuery text="Harga ESP32 DevKit terbaru" />
          <ExampleQuery text="Tutorial KiCad untuk pemula" />
        </div>
        
        {/* Powered by */}
        <p className="mt-8 text-xs text-cream-muted flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Powered by Playwright MCP
        </p>
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
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-info text-2xl">article</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-coffee-dark mb-1">{card.title}</h3>
              <p className="text-sm text-coffee-medium line-clamp-3">{card.description || card.content}</p>
              
              {card.url && (
                <a 
                  href={String(card.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-info mt-2 hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  {String(card.url).slice(0, 50)}...
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExampleQuery({ text }: { text: string }) {
  return (
    <button className="px-4 py-2 bg-coffee-light rounded-xl text-cream-muted text-sm hover:bg-coffee-light/80 hover:text-cream transition-colors">
      "{text}"
    </button>
  )
}
