import { useState, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, GripVertical, Trash2, Palette } from 'lucide-react'
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

const kanbanColorOptions = [
  { name: 'Purple', value: 'bg-purple-200/80' },
  { name: 'Blue', value: 'bg-blue-200/80' },
  { name: 'Green', value: 'bg-green-200/80' },
  { name: 'Yellow', value: 'bg-yellow-200/80' },
  { name: 'Pink', value: 'bg-pink-200/80' },
  { name: 'Orange', value: 'bg-orange-200/80' },
  { name: 'Teal', value: 'bg-teal-200/80' },
  { name: 'Indigo', value: 'bg-indigo-200/80' },
  { name: 'Red', value: 'bg-red-200/80' },
]

export function KanbanBoard({ board }: KanbanBoardProps) {
  const isDark = useThemeStore((state) => state.isDark)
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled)
  const { updateBoardPosition, updateBoardColor, removeBoard, addTask, moveTask, deleteTask, addColumn, updateColumn, deleteColumn } = useKanbanStore()
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
  const [showColorPicker, setShowColorPicker] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `kanban-${board.id}`,
    disabled: !isDragEnabled,
    data: { type: 'kanban', id: board.id, position: board.position }
  })

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

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    left: board.position.x,
    top: board.position.y,
    width: 'fit-content' as const,
    maxWidth: '90vw',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    touchAction: 'none' as const,
    cursor: isDragEnabled ? 'move' : 'default',
    scrollMargin: 0,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <>
      <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      data-node-id={board.id}
      onDoubleClick={handleDoubleClick}
      onClick={() => setShowNodes(true)}
      onBlur={() => setShowNodes(false)}
      onMouseEnter={() => setShowNodes(true)}
      onMouseLeave={() => setShowNodes(false)}
      tabIndex={0}
      onFocus={(e) => e.preventDefault()}
      className={`rounded-3xl backdrop-blur-sm item-container ${board.color} ${
        isSelected ? 'ring-2 ring-blue-400/30' : ''
      } ${
        isConnected ? 'ring-1 ring-blue-400/50' : ''
      }`}
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
          className="flex items-center justify-between p-4 border-b border-zinc-200/50 relative"
          style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', cursor: isDragEnabled ? 'move' : 'default' }}
        >
          <div className="flex items-center gap-3">
            <GripVertical size={18} className="text-gray-400" />
            <h3 className="font-semibold text-lg text-gray-800">
              {board.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowColorPicker(!showColorPicker)
              }}
              className="p-2 rounded-xl transition-all hover:bg-purple-50 hover:scale-105 group"
              title="Change board color"
            >
              <Palette size={18} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
            </button>
            <button
              onClick={() => removeBoard(board.id)}
              className="p-2 rounded-xl transition-all hover:bg-red-50 hover:scale-105 group"
              title="Delete board"
            >
              <Trash2 size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>

          {/* Color Picker */}
          {showColorPicker && (
            <div
              className="absolute top-full right-4 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/10 p-3 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs font-medium text-gray-600 mb-2 text-center">Select Board Color</div>
              <div className="grid grid-cols-3 gap-2">
                {kanbanColorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={(e) => {
                      e.stopPropagation()
                      updateBoardColor(board.id, colorOption.value)
                      setShowColorPicker(false)
                    }}
                    className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      board.color === colorOption.value ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-300'
                    } ${colorOption.value}`}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
          )}
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
        <div className="p-4 flex gap-4 overflow-x-auto" style={{ maxWidth: '85vw' }}>
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="rounded-2xl p-3 bg-zinc-50/80"
              style={{ minWidth: '240px', maxWidth: '240px' }}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(column.id, column.tasks.length)
              }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-gray-800">
                    {column.title}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-gray-700 font-medium shadow-sm">
                    {column.tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => deleteColumn(board.id, column.id)}
                  className="p-1.5 rounded-lg transition-all hover:bg-red-50 hover:scale-105 group"
                >
                  <Trash2 size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-2 mb-2 min-h-[40px]">
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
                    className="p-3 rounded-xl border cursor-move group bg-white border-zinc-200/60 hover:border-zinc-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="font-medium text-sm flex-1 text-gray-800">
                        {task.title}
                      </h5>
                      <button
                        onClick={() => deleteTask(board.id, column.id, task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all hover:bg-red-50 hover:scale-105"
                      >
                        <X size={16} className="text-gray-400 hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs mb-2 text-gray-600">
                        {task.description}
                      </p>
                    )}
                    {task.priority && (
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                        <span className="text-xs capitalize text-gray-600 font-medium">
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
                  className="w-full p-2.5 rounded-xl border-2 border-dashed border-zinc-200 hover:border-blue-300 text-gray-400 hover:text-blue-500 flex items-center justify-center gap-2 transition-all hover:bg-blue-50/50 hover:shadow-sm"
                >
                  <Plus size={18} />
                  <span className="text-sm font-medium">Add task</span>
                </button>
              )}
            </div>
          ))}


        </div>

        {/* Add Column Button - Fixed at bottom right */}
        {showAddColumn ? (
          <div
            className={`absolute bottom-4 right-4 ${board.color} backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/20`}
            style={{ minWidth: '260px', zIndex: 10 }}
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
            className={`absolute bottom-4 right-4 px-5 py-3 ${board.color} hover:opacity-90 text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center gap-2 transition-all hover:scale-105 border border-white/20`}
            style={{ zIndex: 10, marginTop: '16px' }}
          >
            <Plus size={20} />
            <span className="text-sm font-semibold">Add Column</span>
          </button>
        )}
    </div>
    </>
  )
}
