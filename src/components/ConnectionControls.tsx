import { useState } from 'react'
import { Link2, Trash2, Eye } from 'lucide-react'
import { ConnectionsModal } from './ConnectionsModal'
import { useConnectionStore } from '../store/connectionStore'
import { useBoardStore } from '../store/boardStore'
import { AnimatePresence } from 'framer-motion'

export function ConnectionControls() {
  const [showConnectionsView, setShowConnectionsView] = useState(false)
  const { clearAllConnections } = useConnectionStore()
  const connections = useConnectionStore((state) => state.connections)
  const currentBoardId = useBoardStore((state) => state.currentBoardId ?? '')
  
  const boardConnections = connections.filter(conn => conn.boardId === currentBoardId)

  if (boardConnections.length === 0) return null

  return (
    <>
      <div 
        className="fixed left-4 bottom-4 z-[9999] pointer-events-auto"
        style={{ 
          position: 'fixed',
          pointerEvents: 'auto' // Enable interactions
        }}
      >
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-black/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm pointer-events-auto">
              <Link2 size={14} className="text-blue-500" />
              <span className="font-medium">
                {boardConnections.length} Active Connection{boardConnections.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <button
              onClick={() => setShowConnectionsView(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded-md transition-colors pointer-events-auto"
            >
              <Eye size={12} />
              View
            </button>
            <button
              onClick={clearAllConnections}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-md transition-colors pointer-events-auto"
            >
              <Trash2 size={12} />
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showConnectionsView && (
          <ConnectionsModal
            onClose={() => setShowConnectionsView(false)}
            connections={boardConnections}
          />
        )}
      </AnimatePresence>
    </>
  )
}
