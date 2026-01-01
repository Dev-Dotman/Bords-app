'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GridBackground } from '@/components/GridBackground'
import { Dock } from '@/components/Dock'
import { TopBar } from '@/components/TopBar'
import { StickyNote } from '@/components/StickyNote'
import { Checklist } from '@/components/Checklist'
import { useThemeStore } from '@/store/themeStore'
import { useNoteStore } from '@/store/stickyNoteStore'
import { useChecklistStore } from '@/store/checklistStore'
import { Connections } from '@/components/Connections'
import { DragLayer } from '@/components/DragLayer'
import { useConnectionStore } from '@/store/connectionStore'
import { Text } from '@/components/Text'
import { useTextStore } from '@/store/textStore'
import { OrganizePanel } from '@/components/OrganizePanel'
import { useBoardStore } from '@/store/boardStore'
import { DrawingCanvas } from '@/components/DrawingCanvas'
import { KanbanBoard } from '@/components/KanbanBoard'
import { useKanbanStore } from '@/store/kanbanStore'

export default function Home() {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)
  const isDark = useThemeStore((state) => state.isDark)
  const { notes } = useNoteStore()
  const { checklists } = useChecklistStore()
  const { clearSelection } = useConnectionStore()
  const connections = useConnectionStore((state) => state.connections)
  const { texts } = useTextStore()
  const { boards: kanbanBoards } = useKanbanStore()
  const currentBoardId = useBoardStore((state) => state.currentBoardId)
  const currentBoard = useBoardStore((state) => 
    state.boards.find(board => board.id === currentBoardId)
  )

  // Filter items based on current board
  const filteredNotes = notes.filter(note => 
    currentBoard?.notes.includes(note.id)
  )
  const filteredChecklists = checklists.filter(checklist => 
    currentBoard?.checklists.includes(checklist.id)
  )
  const filteredTexts = texts.filter(text => 
    currentBoard?.texts.includes(text.id)
  )
  const filteredKanbans = kanbanBoards.filter(kanban => 
    currentBoard?.kanbans?.includes(kanban.id)
  )

  const handleGlobalClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('app-background') || target.classList.contains('grid-cell')) {
      clearSelection()
      // Hide all nodes by triggering blur on all items
      document.querySelectorAll('.item-container').forEach(item => {
        (item as HTMLElement).blur()
      })
    }
  }

  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} app-background overflow-auto`} onClick={handleGlobalClick}>
      <div className="relative min-h-[170vh]">
        <GridBackground
          hoveredCell={hoveredCell}
          onCellHover={setHoveredCell}
          onCellClick={() => {}}
        />

        {/* Content and Connection Lines */}
        <div className="fixed inset-0 overflow-auto" style={{ zIndex: 1 }}>
          <motion.div className="relative min-h-full">
            {/* Connection Lines */}
            <div className="absolute inset-0">
              {currentBoardId && <Connections key={currentBoardId} />}
            </div>

            {/* Items Layer */}
            <div className="relative" style={{ paddingTop: '20vh', paddingBottom: '100vh' }}>
              {/* Drawing Layer - Scrolls with items */}
              <DrawingCanvas />
              
              {filteredNotes.map((note) => (
                <div key={note.id} className="pointer-events-auto">
                  <StickyNote {...note} />
                </div>
              ))}
              {filteredChecklists.map((checklist) => (
                <div key={checklist.id} className="pointer-events-auto">
                  <Checklist {...checklist} />
                </div>
              ))}
              {filteredTexts.map((text) => (
                <div key={text.id} className="pointer-events-auto">
                  <Text {...text} />
                </div>
              ))}
              {filteredKanbans.map((kanban) => (
                <div key={kanban.id} className="pointer-events-auto">
                  <KanbanBoard board={kanban} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        

        {/* UI Controls Layer - Higher z-index */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          {/* Navigation Controls */}
          <div className="pointer-events-auto">
            <TopBar />
            <Dock />
          </div>

          {/* Interaction Controls */}
          <div className="pointer-events-auto">
            <DragLayer />
            <OrganizePanel />
          </div>
        </div>
      </div>
    </div>
  )
}
