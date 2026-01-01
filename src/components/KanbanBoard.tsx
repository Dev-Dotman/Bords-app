import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, GripVertical, Trash2 } from 'lucide-react'
import { useKanbanStore } from '../store/kanbanStore'
import { useThemeStore } from '../store/themeStore'
import { useDragModeStore } from '../store/dragModeStore'
import { useConnectionStore } from '../store/connectionStore'
import { useBoardStore } from '../store/boardStore'
import CustomDropdown from './CustomDropdown'
import { ConnectionNode } from './ConnectionNode'
import type { KanbanBoard as KanbanBoardType, KanbanTask } from '../types/kanban'

interface KanbanBoardProps {
  board: KanbanBoardType
}

const priorityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500'
}

const priorityOptions = [
  { value: 'low', label: 'Low Priority', description: 'Not urgent tasks', color: 'bg-blue-500' },
  { value: 'medium', label: 'Medium Priority', description: 'Regular tasks', color: 'bg-yellow-500' },
  { value: 'high', label: 'High Priority', description: 'Urgent tasks', color: 'bg-red-500' }
]

export function KanbanBoard({ board }: KanbanBoardProps) {
  const isDark = useThemeStore((state) => state.isDark)
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled)
  const { updateBoardPosition, removeBoard, addTask, moveTask, deleteTask, addColumn, updateColumn, deleteColumn } = useKanbanStore()
  const { selectItem, deselectItem, selectedItems } = useConnectionStore()
  const currentBoard = useBoardStore((state) => 
    state.boards.find(b => b.id === state.currentBoardId)
  )
  
  const [draggedTask, setDraggedTask] = useState<{ task: KanbanTask; columnId: string } | null>(null)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [editingTask, setEditingTask] = useState<{ columnId: string; taskId: string } | null>(null)
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [showNodes, setShowNodes] = useState(false)

  const getDragConstraints = () => {
    const padding = 16
    return {
      left: padding,
      right: Math.max(padding, window.innerWidth - 800),
      top: undefined,
      bottom: undefined
    }
  }

  const handleDragEnd = (_: any, info: { offset: { x: number; y: number } }) => {
    const constraints = getDragConstraints()
    const newPosition = {
      x: Math.max(constraints.left, Math.min(constraints.right, board.position.x + info.offset.x)),
      y: board.position.y + info.offset.y
    }
    updateBoardPosition(board.id, newPosition)
  }

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return
    
    const newColumn = {
      id: Date.now().toString(),
      title: newColumnTitle,
      tasks: []
    }
    
    addColumn(board.id, newColumn)
    setNewColumnTitle('')
    setShowAddColumn(false)
  }

  const handleAddTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return
    
    const newTask: KanbanTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority
    }
    
    addTask(board.id, columnId, newTask)
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskPriority('medium')
    setNewTaskColumnId(null)
  }

  const handleDragStart = (task: KanbanTask, columnId: string) => {
    setDraggedTask({ task, columnId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetColumnId: string, index: number) => {
    if (!draggedTask) return
    
    moveTask(board.id, draggedTask.task.id, draggedTask.columnId, targetColumnId, index)
    setDraggedTask(null)
  }

  const handleDoubleClick = () => {
    const isSelected = selectedItems.some(item => item.id === board.id)
    if (isSelected) {
      deselectItem(board.id)
    } else {
      selectItem(board.id, 'kanban', board.position)
    }
  }

  const connections = useConnectionStore((state) => state.connections)
  const isConnected = connections.some(conn => conn.fromId === board.id || conn.toId === board.id)
  const isVisible = useConnectionStore((state) => state.isVisible)
  const isSelected = selectedItems.some(item => item.id === board.id)

  const getConnectionSide = () => {
    const connection = connections.find(conn => conn.fromId === board.id || conn.toId === board.id)
    if (!connection) return null

    const otherId = connection.fromId === board.id ? connection.toId : connection.fromId
    const otherElement = document.querySelector(`[data-node-id="${otherId}"]`)
    if (!otherElement) return null

    const otherRect = otherElement.getBoundingClientRect()
    const thisRect = document.querySelector(`[data-node-id="${board.id}"]`)?.getBoundingClientRect()
    
    if (!thisRect) return null
    
    return otherRect.left < thisRect.left ? 'left' : 'right'
  }

  return (
    <>
      
      <motion.div
      drag={isDragEnabled}
      dragElastic={0}
      dragTransition={{ power: 0, timeConstant: 0 }}
      dragMomentum={false}
      dragConstraints={getDragConstraints()}
      onDragEnd={handleDragEnd}
      initial={false}
      animate={{ x: board.position.x, y: board.position.y }}
      data-node-id={board.id}
      onDoubleClick={handleDoubleClick}
      onClick={() => setShowNodes(true)}
      onBlur={() => setShowNodes(false)}
      onMouseEnter={() => setShowNodes(true)}
      onMouseLeave={() => setShowNodes(false)}
      tabIndex={0}
      className={`absolute rounded-2xl backdrop-blur-sm item-container ${board.color} ${
        isSelected ? 'ring-2 ring-blue-400/30' : ''
      } ${
        isConnected ? 'ring-1 ring-blue-400/50' : ''
      }`}
      style={{
        width: 'fit-content',
        maxWidth: '90vw',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        touchAction: 'none',
        cursor: isDragEnabled ? 'move' : 'default'
      }}
    >
        {isConnected && isVisible && (
          <div 
            className={`
              absolute top-1/2 -translate-y-1/2 w-3 h-3 
              bg-blue-500 rounded-full border-2 border-white 
              shadow-md animate-pulse connection-indicator
              ${getConnectionSide() === 'left' ? '-left-1.5' : '-right-1.5'}
            `}
            data-connection-id={`${board.id}-indicator`}
            data-connection-side={getConnectionSide()}
          />
        )}
        
        {/* Header */}
        <div
          className={`flex items-center justify-between p-3 border-b ${
            isDark ? 'border-zinc-700/50' : 'border-zinc-200'
          }`}
          style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem', cursor: isDragEnabled ? 'move' : 'default' }}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-gray-700" />
            <h3 className="font-semibold text-base text-gray-800">
              {board.title}
            </h3>
          </div>
          <button
            onClick={() => removeBoard(board.id)}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
            }`}
          >
            <X size={16} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
          </button>
        </div>


      {/* Connection Nodes */}
      <ConnectionNode 
        id={board.id} 
        type="kanban" 
        side="left" 
        position={board.position}
        isVisible={showNodes}
      />
      <ConnectionNode 
        id={board.id} 
        type="kanban" 
        side="right" 
        position={board.position}
        isVisible={showNodes}
      />


      {/* Connection Nodes */}
        <div className="p-3 flex gap-3 overflow-x-auto" style={{ maxWidth: '85vw' }}>
          {board.columns.map((column) => (
            <div
              key={column.id}
              className={`rounded-xl p-2.5 ${
                isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'
              }`}
              style={{ minWidth: '220px', maxWidth: '220px' }}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(column.id, column.tasks.length)
              }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-xs text-gray-800">
                    {column.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 text-gray-700 font-medium">
                    {column.tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => deleteColumn(board.id, column.id)}
                  className={`p-0.5 rounded transition-colors ${
                    isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'
                  }`}
                >
                  <Trash2 size={12} className="text-red-500" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-1.5 mb-1.5 min-h-[40px]">
                {column.tasks.map((task, index) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.stopPropagation()
                      handleDrop(column.id, index)
                    }}
                    className={`p-2 rounded-lg border cursor-move group ${
                      isDark
                        ? 'bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <h5 className="font-medium text-xs flex-1 text-gray-800">
                        {task.title}
                      </h5>
                      <button
                        onClick={() => deleteTask(board.id, column.id, task.id)}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                        }`}
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-[10px] mb-1.5 text-gray-700">
                        {task.description}
                      </p>
                    )}
                    {task.priority && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`} />
                        <span className="text-[10px] capitalize text-gray-600 font-medium">
                          {task.priority}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Task */}
              {newTaskColumnId === column.id ? (
                <div className="p-3 rounded-xl bg-white/90 backdrop-blur-sm border border-zinc-200/50 shadow-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white shadow-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:outline-none transition-all"
                    autoFocus
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white shadow-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:outline-none resize-none transition-all"
                    rows={2}
                  />
                  <CustomDropdown
                    options={priorityOptions}
                    value={newTaskPriority}
                    onChange={(value) => setNewTaskPriority(value as 'low' | 'medium' | 'high')}
                    placeholder="Select priority"
                    showDescription={true}
                    color={board.color}
                    backgroundColor={board.color}
                    textColor={isDark ? 'text-gray-800' : 'text-white'}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAddTask(column.id)}
                      className="flex-1 px-3 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      Add Task
                    </button>
                    <button
                      onClick={() => setNewTaskColumnId(null)}
                      className="flex-1 px-3 py-2 text-xs font-medium bg-white border border-zinc-200 text-gray-700 rounded-lg hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setNewTaskColumnId(column.id)}
                  className="w-full p-2 rounded-lg border-2 border-dashed border-zinc-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-all hover:bg-blue-50/50"
                >
                  <Plus size={16} />
                  <span className="text-xs font-medium">Add task</span>
                </button>
              )}
            </div>
          ))}


        </div>

        {/* Add Column Button - Fixed at bottom right */}
        {showAddColumn ? (
          <div
            className={`absolute bottom-3 right-3 ${board.color} backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-white/10`}
            style={{ minWidth: '240px', zIndex: 10 }}
          >
            <input
              type="text"
              placeholder="Column title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
              className="w-full px-3 py-2 mb-2 text-sm rounded-lg border bg-white/90 border-white/20 text-zinc-900 placeholder:text-gray-500 focus:ring-2 focus:ring-white/30 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddColumn}
                className="flex-1 px-3 py-2 text-sm font-semibold bg-white/90 text-gray-800 rounded-lg hover:bg-white shadow-md transition-all"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddColumn(false)}
                className="flex-1 px-3 py-2 text-sm font-medium bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddColumn(true)}
            className={`absolute bottom-3 right-3 px-4 py-2.5 ${board.color} hover:opacity-90 text-white rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 transition-all hover:scale-105 border border-white/20`}
            style={{ zIndex: 10, marginTop: '16px' }}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Column</span>
          </button>
        )}
    </motion.div>
    </>
  )
}
