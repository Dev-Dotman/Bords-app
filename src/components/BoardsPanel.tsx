import { motion } from 'framer-motion'
import { useBoardStore } from '../store/boardStore'
import { useThemeStore } from '../store/themeStore'
import { useNoteStore } from '../store/stickyNoteStore'
import { useChecklistStore } from '../store/checklistStore'
import { useTextStore } from '../store/textStore'
import { useKanbanStore } from '../store/kanbanStore'
import { useMediaStore } from '../store/mediaStore'
import { useDrawingStore } from '../store/drawingStore'
import { useConnectionStore } from '../store/connectionStore'
import { Trash2, Edit2, Plus, Layout, X } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'

interface BoardsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function BoardsPanel({ isOpen, onClose }: BoardsPanelProps) {
  const { data: session } = useSession()
  const isDark = useThemeStore((state) => state.isDark)
  const { currentBoardId, addBoard, deleteBoard, setCurrentBoard, updateBoard } = useBoardStore()
  const currentUserId = useBoardStore((state) => state.currentUserId)
  const allBoards = useBoardStore((state) => state.boards)
  const userBoards = useMemo(() => 
    allBoards.filter(b => b.userId === currentUserId),
    [allBoards, currentUserId]
  )
  
  // Get delete functions from all stores
  const { deleteNote } = useNoteStore()
  const { deleteChecklist } = useChecklistStore()
  const { deleteText } = useTextStore()
  const { removeBoard: deleteKanban } = useKanbanStore()
  const { deleteMedia } = useMediaStore()
  const { deleteDrawing } = useDrawingStore()
  const { clearBoardConnections } = useConnectionStore()
  
  const [newBoardName, setNewBoardName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editingBoardName, setEditingBoardName] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Listen for board deletion to cleanup associated items
  useEffect(() => {
    const handleBoardDeleted = (event: CustomEvent) => {
      const { boardId, noteIds, checklistIds, textIds, kanbanIds, mediaIds, drawingIds } = event.detail
      
      // Delete all connections for this board
      clearBoardConnections(boardId)
      
      // Delete all notes
      noteIds.forEach((id: string) => deleteNote(id))
      
      // Delete all checklists
      checklistIds.forEach((id: string) => deleteChecklist(id))
      
      // Delete all texts
      textIds.forEach((id: string) => deleteText(id))
      
      // Delete all kanban boards
      kanbanIds.forEach((id: string) => deleteKanban(id))
      
      // Delete all media
      mediaIds.forEach((id: string) => deleteMedia(id))
      
      // Delete all drawings
      drawingIds.forEach((id: string) => deleteDrawing(id))
    }
    
    window.addEventListener('boardDeleted', handleBoardDeleted as EventListener)
    return () => window.removeEventListener('boardDeleted', handleBoardDeleted as EventListener)
  }, [deleteNote, deleteChecklist, deleteText, deleteKanban, deleteMedia, deleteDrawing, clearBoardConnections])

  const handleCreateBoard = () => {
    if (!newBoardName.trim() || !session?.user?.email) return
    
    addBoard(newBoardName, session.user.email)
    setNewBoardName('')
    setIsCreating(false)
  }

  const handleBoardSelect = (boardId: string) => {
    setCurrentBoard(boardId)
    onClose()
  }

  return (
    <motion.div
      ref={panelRef}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={`
        fixed left-0 top-0 bottom-0 w-80 z-50 flex flex-col
        ${isDark ? 'bg-zinc-800/90' : 'bg-white/90'}
        backdrop-blur-xl border-r
        ${isDark ? 'border-zinc-700/50' : 'border-zinc-200/50'}
      `}
    >
      {/* Fixed Header & Create */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            My Boards
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${isDark ? 'hover:bg-zinc-700' : ''}`}
          >
            <X size={20} className={isDark ? 'text-white' : 'text-gray-600'} />
          </button>
        </div>

        {/* Create New Board */}
        {isCreating ? (
          <div className="mb-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name"
                className="flex-1 p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBoard()
                  if (e.key === 'Escape') {
                    setIsCreating(false)
                    setNewBoardName('')
                  }
                }}
              />
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim()}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  newBoardName.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Create
              </button>
            </div>
            <button
              onClick={() => { setIsCreating(false); setNewBoardName('') }}
              className={`mt-2 w-full p-1.5 text-xs rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className={`
              w-full p-3 rounded-lg mb-2 flex items-center gap-2
              ${isDark 
                ? 'bg-zinc-700/50 hover:bg-zinc-700 text-white' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}
            `}
          >
            <Plus size={16} />
            <span>New Board</span>
          </button>
        )}
      </div>

      {/* Scrollable Boards List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          {userBoards.length === 0 && (
            <div className={`text-center py-8 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
              <Layout size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No boards yet</p>
              <p className="text-xs mt-1">Create your first board to get started</p>
            </div>
          )}
          {userBoards.map((board) => (
            <div
              key={board.id}
              className={`
                p-3 rounded-lg flex items-center justify-between group
                ${board.id === currentBoardId 
                  ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  : isDark ? 'hover:bg-zinc-700/50' : 'hover:bg-gray-50'
                }
                ${isDark ? 'text-white' : 'text-gray-700'}
                cursor-pointer
              `}
              onClick={() => handleBoardSelect(board.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Layout size={16} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  {editingBoardId === board.id ? (
                    <input
                      type="text"
                      value={editingBoardName}
                      onChange={(e) => setEditingBoardName(e.target.value)}
                      className="w-full px-2 py-0.5 rounded border text-sm font-medium bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Enter' && editingBoardName.trim()) {
                          updateBoard(board.id, { name: editingBoardName.trim() })
                          setEditingBoardId(null)
                        }
                        if (e.key === 'Escape') setEditingBoardId(null)
                      }}
                      onBlur={() => {
                        if (editingBoardName.trim()) {
                          updateBoard(board.id, { name: editingBoardName.trim() })
                        }
                        setEditingBoardId(null)
                      }}
                    />
                  ) : (
                    <div className="font-medium truncate">{board.name}</div>
                  )}
                  <div className="text-xs opacity-60">
                    {format(new Date(board.lastModified), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingBoardId(board.id)
                    setEditingBoardName(board.name)
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'
                  }`}
                  title="Rename board"
                >
                  <Edit2 size={14} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setBoardToDelete(board.id)
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100/10"
                  title="Delete board"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {boardToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setBoardToDelete(null)}>
          <div 
            className={`p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
              isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Delete Board?
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  This will permanently delete the board <span className="font-semibold">"{userBoards.find(b => b.id === boardToDelete)?.name}"</span> and all its items (notes, checklists, kanban boards, text elements, media, and connections). This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBoardToDelete(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBoard(boardToDelete)
                  setBoardToDelete(null)
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete Board
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
