import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
import { useKanbanStore } from '../store/kanbanStore'
import { useThemeStore } from '../store/themeStore'
import { useBoardStore } from '../store/boardStore'
import { CHECKLIST_COLORS } from '../store/checklistStore'

interface KanbanFormProps {
  onClose: () => void
  position: { x: number; y: number }
}

export function KanbanForm({ onClose, position }: KanbanFormProps) {
  const isDark = useThemeStore((state) => state.isDark)
  const addBoard = useKanbanStore((state) => state.addBoard)
  const currentBoardId = useBoardStore((state) => state.currentBoardId)
  const addItemToBoard = useBoardStore((state) => state.addItemToBoard)
  
  const [title, setTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState('bg-purple-100/90')
  const [columns, setColumns] = useState(['To Do', 'In Progress', 'Done'])
  const [newColumn, setNewColumn] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const kanbanId = Date.now().toString()
    
    const newBoard = {
      id: kanbanId,
      title,
      color: selectedColor,
      position,
      columns: columns.map((col, index) => ({
        id: `${kanbanId}-col-${index}`,
        title: col,
        tasks: []
      }))
    }

    addBoard(newBoard)
    
    if (currentBoardId) {
      addItemToBoard(currentBoardId, 'kanbans', kanbanId)
    }
    
    onClose()
  }

  const handleAddColumn = () => {
    if (newColumn.trim()) {
      setColumns([...columns, newColumn])
      setNewColumn('')
    }
  }

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleSubmit}
        className={`${selectedColor} p-8 rounded-3xl shadow-2xl border border-white/20`}
        style={{ width: '60vw', maxWidth: '800px', minWidth: '500px' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Create Kanban Board
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-white/60 backdrop-blur-sm rounded-full p-2 transition-all duration-200 hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        {/* Title and Color Selection */}
        <div className="space-y-5">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board title"
              className="w-full p-3 border-0 rounded-2xl focus:ring-2 focus:ring-blue-400/50 focus:outline-none bg-white/90 backdrop-blur-sm shadow-sm text-gray-900 placeholder:text-gray-500"
              style={{ marginBottom: '20px' }}
              autoFocus
            />

            <div className="flex gap-3 justify-center flex-wrap">
              {Object.entries(CHECKLIST_COLORS).map(([name, colorClass]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedColor(colorClass)}
                  className={`
                    w-10 h-10 rounded-full ${colorClass} 
                    ${selectedColor === colorClass ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}
                    transition-all duration-200 border border-black/5 shadow-md hover:shadow-lg
                  `}
                />
              ))}
            </div>
          </div>

          {/* Columns */}
          <div style={{ marginTop: '24px' }}>
            <label className="block text-sm font-semibold text-gray-800" style={{ marginBottom: '12px' }}>
              Columns
            </label>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1" style={{ marginBottom: '12px' }}>
              {columns.map((col, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm text-gray-900 border-0 font-medium">
                    {col}
                  </div>
                  {columns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColumn(index)}
                      className="p-2.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 rounded-lg hover:bg-red-50/90 backdrop-blur-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center" style={{ marginTop: '16px' }}>
              <input
                type="text"
                value={newColumn}
                onChange={(e) => setNewColumn(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColumn())}
                placeholder="New column name..."
                className="flex-1 px-4 py-3 rounded-xl border-0 bg-white/90 backdrop-blur-sm shadow-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={!newColumn.trim()}
                className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3" style={{ marginTop: '32px', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 text-gray-700 hover:bg-white/60 backdrop-blur-sm rounded-xl transition-all duration-200 font-medium hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={!title.trim()}
            >
              Create Board
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  )
}