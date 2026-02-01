// Computer Tab - Display file search results and computer control status
// Shows results from find_file, open_folder, and other computer operations

import { useWorkspaceStore } from '@stores/workspaceStore'
import { useModeStore, MODE_LABELS, OI_STATUS_LABELS } from '@stores/modeStore'

interface FileResult {
  FullName?: string
  path?: string
  name?: string
  size?: number
  modified?: string
}

export function ComputerTab() {
  const { cards } = useWorkspaceStore()
  const { mode, oiServerStatus } = useModeStore()
  
  // Filter cards for computer-related operations
  const computerCards = cards.filter((c) => 
    c.type === 'computer' || 
    (c.data?.type === 'file_search') ||
    (c.data?.type === 'oi_result') ||
    (c.data?.type === 'code_analysis')
  )
  
  return (
    <div className="h-full flex flex-col">
      {/* Mode Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-coffee-medium/50 border-b border-coffee-light/10">
        <div className="flex items-center gap-3">
          <span className={`material-symbols-outlined ${mode === 'safe' ? 'text-success' : 'text-warning'}`}>
            {mode === 'safe' ? 'verified_user' : 'science'}
          </span>
          <div>
            <p className="text-sm font-medium text-cream">{MODE_LABELS[mode]}</p>
            <p className="text-xs text-cream-muted">
              {mode === 'safe' ? 'Perintah via IPC (<500ms)' : 'Open Interpreter aktif'}
            </p>
          </div>
        </div>
        
        {mode === 'advanced' && (
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${
              oiServerStatus === 'running' ? 'bg-success animate-pulse' :
              oiServerStatus === 'starting' ? 'bg-warning animate-pulse' :
              oiServerStatus === 'error' ? 'bg-error' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-cream-muted">
              OI: {OI_STATUS_LABELS[oiServerStatus]}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {computerCards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {computerCards.map((card) => (
              <FileSearchCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-cream-muted">
      <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
        folder_open
      </span>
      <h3 className="text-lg font-medium text-cream mb-2">Belum ada hasil</h3>
      <p className="text-sm text-center max-w-md">
        Minta Jawir untuk mencari file atau mengontrol komputer.
      </p>
      <div className="mt-4 space-y-2 text-xs">
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">search</span>
          "Cari file proposal"
        </p>
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">folder_open</span>
          "Buka folder Downloads"
        </p>
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">screenshot_monitor</span>
          "Ambil screenshot"
        </p>
      </div>
    </div>
  )
}

interface CardProps {
  card: {
    id: string
    type: string
    title: string
    content?: string
    status?: string
    data?: {
      query?: string
      location?: string
      results?: FileResult[]
      path?: string
    }
  }
}

function FileSearchCard({ card }: CardProps) {
  const results = card.data?.results || []
  const query = card.data?.query || card.title
  const location = card.data?.location || 'Unknown'
  
  const handleOpenFile = async (filePath: string) => {
    if (window.electronAPI?.openFile) {
      await window.electronAPI.openFile(filePath)
    }
  }
  
  const handleOpenFolder = async (folderPath: string) => {
    if (window.electronAPI?.openFolder) {
      await window.electronAPI.openFolder(folderPath)
    }
  }
  
  // If it's a screenshot or single result
  if (card.type === 'screenshot' || card.data?.path) {
    return (
      <div className="bg-coffee-medium rounded-2xl border border-coffee-light/20 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">screenshot_monitor</span>
          </div>
          <div>
            <h3 className="font-semibold text-cream">{card.title}</h3>
            <p className="text-xs text-cream-muted">{card.data?.path || card.content}</p>
          </div>
        </div>
        
        {card.data?.path && (
          <button
            onClick={() => handleOpenFile(card.data!.path!)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl 
                       bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-lg">open_in_new</span>
            Buka File
          </button>
        )}
      </div>
    )
  }
  
  // File search results
  return (
    <div className="bg-coffee-medium rounded-2xl border border-coffee-light/20 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-info/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-info">search</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-cream">{query}</h3>
          <p className="text-xs text-cream-muted flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">folder</span>
            {location}
            <span className="mx-1">•</span>
            {results.length} file ditemukan
          </p>
        </div>
        <button
          onClick={() => handleOpenFolder(location)}
          className="p-2 rounded-lg hover:bg-coffee-light/20 transition-colors"
          title="Buka folder"
        >
          <span className="material-symbols-outlined text-cream-muted">folder_open</span>
        </button>
      </div>
      
      {/* Results */}
      {results.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((file, idx) => {
            const filePath = file.FullName || file.path || ''
            const fileName = file.name || filePath.split(/[/\\]/).pop() || 'Unknown'
            
            return (
              <button
                key={idx}
                onClick={() => handleOpenFile(filePath)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-coffee-dark/50 
                           hover:bg-primary/10 transition-colors text-left group"
              >
                <span className="material-symbols-outlined text-cream-muted group-hover:text-primary">
                  {getFileIcon(fileName)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-cream truncate">{fileName}</p>
                  <p className="text-xs text-cream-muted truncate">{filePath}</p>
                </div>
                <span className="material-symbols-outlined text-cream-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  open_in_new
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-cream-muted text-center py-4">
          Tidak ada file ditemukan untuk "{query}"
        </p>
      )}
    </div>
  )
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  const iconMap: Record<string, string> = {
    // Documents
    pdf: 'picture_as_pdf',
    doc: 'description',
    docx: 'description',
    txt: 'article',
    md: 'article',
    
    // Spreadsheets
    xls: 'table_chart',
    xlsx: 'table_chart',
    csv: 'table_chart',
    
    // Images
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    
    // Code
    js: 'code',
    ts: 'code',
    tsx: 'code',
    jsx: 'code',
    py: 'code',
    html: 'code',
    css: 'code',
    json: 'data_object',
    
    // Archives
    zip: 'folder_zip',
    rar: 'folder_zip',
    '7z': 'folder_zip',
    tar: 'folder_zip',
    gz: 'folder_zip',
    
    // Media
    mp3: 'audio_file',
    wav: 'audio_file',
    mp4: 'video_file',
    mkv: 'video_file',
    avi: 'video_file',
    
    // CAD/Design
    kicad_sch: 'memory',
    kicad_pcb: 'memory',
  }
  
  return iconMap[ext] || 'description'
}
