import { useWorkspaceStore } from '@stores/workspaceStore'
import { TabNavigation } from '@components/workspace/TabNavigation'
import { KiCadTab } from '@components/workspace/tabs/KiCadTab'
import { BrowserTab } from '@components/workspace/tabs/BrowserTab'
import { WhatsAppTab } from '@components/workspace/tabs/WhatsAppTab'
import { GoogleTab } from '@components/workspace/tabs/GoogleTab'
import { IoTTab } from '@components/workspace/tabs/IoTTab'
import { ComputerTab } from '@components/workspace/tabs/ComputerTab'

export function Workspace() {
  const activeTab = useWorkspaceStore((state) => state.activeTab)
  
  return (
    <main className="flex-1 bg-coffee-dark flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <TabNavigation />
      
      {/* Workspace Content */}
      <div className="flex-1 bg-coffee-medium rounded-tl-2xl overflow-hidden">
        <div className="h-full overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'kicad' && <KiCadTab />}
          {activeTab === 'browser' && <BrowserTab />}
          {activeTab === 'whatsapp' && <WhatsAppTab />}
          {activeTab === 'google' && <GoogleTab />}
          {activeTab === 'iot' && <IoTTab />}
          {activeTab === 'computer' && <ComputerTab />}
        </div>
      </div>
    </main>
  )
}
