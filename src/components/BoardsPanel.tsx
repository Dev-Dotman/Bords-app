import { motion } from 'framer-motion'
import { useBoardStore } from '../store/boardStore'
import { useThemeStore } from '../store/themeStore'
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
  const { currentBoardId, addBoard, deleteBoard, setCurrentBoard } = useBoardStore()
  const currentUserId = useBoardStore((state) => state.currentUserId)
  const allBoards = useBoardStore((state) => state.boards)
  const userBoards = useMemo(() => 
    allBoards.filter(b => b.userId === currentUserId),
    [allBoards, currentUserId]
  )
  const [newBoardName, setNewBoardName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
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
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
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
          <div className="mb-4">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name"
              className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBoard()
                if (e.key === 'Escape') setIsCreating(false)
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className={`
              w-full p-3 rounded-lg mb-4 flex items-center gap-2
              ${isDark 
                ? 'bg-zinc-700/50 hover:bg-zinc-700 text-white' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}
            `}
          >
            <Plus size={16} />
            <span>New Board</span>
          </button>
        )}

        {/* Boards List */}
        <div className="space-y-2">
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
              <div className="flex items-center gap-3">
                <Layout size={16} />
                <div>
                  <div className="font-medium">{board.name}</div>
                  <div className="text-xs opacity-60">
                    {format(new Date(board.lastModified), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              {board.id === currentBoardId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteBoard(board.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100/10"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
