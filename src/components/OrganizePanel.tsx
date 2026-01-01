import { motion } from 'framer-motion'
import { useOrganizePanelStore } from '../store/organizePanelStore'
import { useNoteStore } from '../store/stickyNoteStore'
import { useChecklistStore } from '../store/checklistStore'
import { useTextStore } from '../store/textStore'
import { StickyNote, ListChecks, Type, Eye, Trash2, X } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useRef, useEffect } from 'react'
import { useBoardStore } from '../store/boardStore'

export function OrganizePanel() {
  const { isOpen, togglePanel } = useOrganizePanelStore()
  const isDark = useThemeStore((state) => state.isDark)
  const notes = useNoteStore((state) => state.notes)
  const { deleteNote, updateNote } = useNoteStore()
  const checklists = useChecklistStore((state) => state.checklists)
  const { deleteChecklist, updateChecklist } = useChecklistStore()
  const texts = useTextStore((state) => state.texts)
  const { deleteText, updateText } = useTextStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const currentBoard = useBoardStore((state) => 
    state.boards.find(board => board.id === state.currentBoardId)
  )

  // Filter items by current board
  const boardNotes = notes.filter(note => currentBoard?.notes.includes(note.id))
  const boardChecklists = checklists.filter(checklist => currentBoard?.checklists.includes(checklist.id))
  const boardTexts = texts.filter(text => currentBoard?.texts.includes(text.id))

  const bringToView = (type: 'note' | 'checklist' | 'text', id: string) => {
    const padding = 50
    const randomX = Math.random() * (window.innerWidth - 300 - padding * 2) + padding
    const randomY = Math.random() * (window.innerHeight - 200 - padding * 2) + padding
    
    switch (type) {
      case 'note':
        updateNote(id, { position: { x: randomX, y: randomY } })
        break
      case 'checklist':
        updateChecklist(id, { position: { x: randomX, y: randomY } })
        break
      case 'text':
        updateText(id, { position: { x: randomX, y: randomY } })
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        togglePanel()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, togglePanel])

  return (
    <motion.div
      ref={panelRef}
      initial={{ x: 400 }}
      animate={{ x: isOpen ? 0 : 400 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={`
        fixed right-0 top-0 bottom-0 w-96 z-40
        ${isDark ? 'bg-zinc-800/90' : 'bg-white/90'}
        backdrop-blur-xl border-l
        ${isDark ? 'border-zinc-700/50' : 'border-zinc-200/50'}
      `}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Organize Items
          </h2>
          <button
            onClick={togglePanel}
            className={`p-2 rounded-lg hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-700' : ''}`}
          >
            <X size={20} className={isDark ? 'text-white' : 'text-gray-600'} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Sticky Notes */}
          <section>
            <h3 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              <StickyNote size={16} />
              Sticky Notes ({boardNotes.length})
            </h3>
            <div className="space-y-2">
              {boardNotes.map(note => (
                <div 
                  key={note.id}
                  className={`
                    p-3 rounded-lg flex items-center justify-between
                    ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}
                  `}
                >
                  <p className={`text-sm truncate flex-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    {note.text || 'Untitled Note'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bringToView('note', note.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10"
                      title="Bring to view"
                    >
                      <Eye size={14} className={isDark ? 'text-white' : 'text-gray-600'} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100/10"
                      title="Delete note"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Checklists */}
          <section>
            <h3 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              <ListChecks size={16} />
              Checklists ({boardChecklists.length})
            </h3>
            <div className="space-y-2">
              {boardChecklists.map(list => (
                <div 
                  key={list.id}
                  className={`
                    p-3 rounded-lg flex items-center justify-between
                    ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}
                  `}
                >
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                      {list.title}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {list.items.length} items
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bringToView('checklist', list.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10"
                      title="Bring to view"
                    >
                      <Eye size={14} className={isDark ? 'text-white' : 'text-gray-600'} />
                    </button>
                    <button
                      onClick={() => deleteChecklist(list.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100/10"
                      title="Delete checklist"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Text Elements */}
          <section>
            <h3 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              <Type size={16} />
              Text Elements ({boardTexts.length})
            </h3>
            <div className="space-y-2">
              {boardTexts.map(text => (
                <div 
                  key={text.id}
                  className={`
                    p-3 rounded-lg flex items-center justify-between
                    ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}
                  `}
                >
                  <p className={`text-sm truncate flex-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    {text.text || 'Untitled Text'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bringToView('text', text.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10"
                      title="Bring to view"
                    >
                      <Eye size={14} className={isDark ? 'text-white' : 'text-gray-600'} />
                    </button>
                    <button
                      onClick={() => deleteText(text.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100/10"
                      title="Delete text"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  )
}
