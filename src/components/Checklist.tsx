import { motion } from 'framer-motion'
import { Trash2, Check, Timer, Clock, Pencil } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useChecklistStore, ChecklistItem as ChecklistItemType } from '../store/checklistStore'
import { useDragModeStore } from '../store/dragModeStore'
import { toast } from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import { TaskModal } from './TaskModal'
import { useConnectionStore } from '../store/connectionStore';
import { ConnectionNode } from './ConnectionNode'
import { useGridStore } from '../store/gridStore'

interface ChecklistProps {
  id: string
  title: string
  items: ChecklistItemType[]
  position: { x: number; y: number }
  color: string
}

export function Checklist({ id, title, items, position, color }: ChecklistProps) {
  const { updateChecklist, deleteChecklist, toggleItem, updateItem, toggleTimeTracking } = useChecklistStore()
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled)
  const [editingTask, setEditingTask] = useState<ChecklistItemType | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const { selectedItems, selectItem, deselectItem, isVisible } = useConnectionStore();
  const isSelected = selectedItems.some(item => item.id === id);
  const [showNodes, setShowNodes] = useState(false)
  const zoom = useGridStore((state) => state.zoom)
  const connections = useConnectionStore((state) => state.connections)
  const isConnected = connections.some(conn => conn.fromId === id || conn.toId === id)

  const handleDoubleClick = () => {
    if (isSelected) {
      deselectItem(id);
    } else {
      selectItem(id, 'checklist', position);
    }
  };

  // Check deadlines and show notifications
  useEffect(() => {
    items.forEach((item) => {
      if (item.deadline && !item.completed) {
        const timeUntilDeadline = new Date(item.deadline).getTime() - Date.now()
        if (timeUntilDeadline > 0) {
          const timeout = setTimeout(() => {
            toast(`Deadline reached for: ${item.text}`, {
              icon: '⏰',
              duration: 5000,
            })
          }, timeUntilDeadline)
          return () => clearTimeout(timeout)
        }
      }
    })
  }, [items])

  // Add time tracking effect
  useEffect(() => {
    const interval = setInterval(() => {
      items.forEach((item) => {
        if (item.isTracking) {
          updateItem(id, item.id, {
            timeSpent: (item.timeSpent || 0) + 1
          })
        }
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [items])

  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getTimeStatus = (item: ChecklistItemType) => {
    if (!item.deadline) return null;
    
    const now = new Date().getTime();
    const deadline = new Date(item.deadline).getTime();
    const timeLeft = deadline - now;
    
    if (timeLeft < 0) return { 
      text: `Overdue by ${formatDistanceToNow(deadline)}`, 
      color: 'bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-medium',
      isUrgent: false 
    };
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (minutes <= 30) {
      return {
        text: '', 
        color: 'text-red-500',
        isUrgent: true,
        tooltip: `⚠️ Deadline in ${minutes} minute${minutes === 1 ? '' : 's'}!`
      };
    }
    
    if (hours < 24) {
      return {
        text: `${hours}h ${minutes % 60}m left`,
        color: hours < 2 ? 'text-red-500' : 'text-orange-500',
        isUrgent: false
      };
    }
    
    const days = Math.floor(hours / 24);
    return {
      text: `${days} days left`,
      color: 'text-green-500',
      isUrgent: false
    };
  }

  // Update date formatting
  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    try {
      return format(date, 'MMM d, yyyy @ h:mm a');
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  }

  const handleAddTask = ({ text, date, time }: { text: string; date: string; time: string }) => {
    updateChecklist(id, {
      items: [
        ...items,
        {
          id: Date.now().toString(),
          text,
          completed: false,
          deadline: date && time ? new Date(`${date}T${time}:00`) : undefined,
          timeSpent: 0,
          isTracking: false,
        },
      ],
    });
  };

  const handleEditTask = (taskId: string, { text, date, time }: { text: string; date: string; time: string }) => {
    updateItem(id, taskId, {
      text,
      deadline: date && time ? new Date(`${date}T${time}:00`) : undefined,
    });
  };

    function formatDateForInput(deadline: Date): string {
        if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) {
            return '';
        }
        return deadline.toISOString().split('T')[0];
    }

    function formatTimeForInput(deadline: Date): string {
        if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) {
            return '';
        }
        return deadline.toTimeString().slice(0, 5);
    }

  const dragConstraints = {
    left: -window.innerWidth * 0.25,
    top: -window.innerHeight * 0.25,
    right: window.innerWidth * 0.75,
    bottom: window.innerHeight * 0.75
  }

  const getDragConstraints = () => {
    const padding = 16;
    
    return {
      left: padding,
      right: Math.max(padding, window.innerWidth - (scaledWidth + padding)),
      top: undefined,
      bottom: undefined
    }
  }

  const handleDragEnd = (_: any, info: { offset: { x: number; y: number } }) => {
    const constraints = getDragConstraints()
    const newPosition = {
      x: Math.max(constraints.left, Math.min(constraints.right, position.x + info.offset.x)),
      y: position.y + info.offset.y
    }

    updateChecklist(id, { position: newPosition })
  }

  // Base sizes for scaling
  const baseWidth = 320 // Base width in pixels
  const baseFontSize = 14
  const baseIconSize = 16
  const baseSpacing = 16

  // Calculate scaled dimensions
  const scaledWidth = baseWidth * zoom
  const scaledFontSize = baseFontSize * zoom
  const scaledIconSize = baseIconSize * zoom
  const scaledSpacing = baseSpacing * zoom

  const getConnectionSide = () => {
    const connection = connections.find(conn => conn.fromId === id || conn.toId === id)
    if (!connection) return null

    const otherId = connection.fromId === id ? connection.toId : connection.fromId
    const otherElement = document.querySelector(`[data-node-id="${otherId}"]`)
    if (!otherElement) return null

    const otherRect = otherElement.getBoundingClientRect()
    const thisRect = document.querySelector(`[data-node-id="${id}"]`)?.getBoundingClientRect()
    
    if (!thisRect) return null
    
    return otherRect.left < thisRect.left ? 'left' : 'right'
  }

  return (
    <>
      <motion.div
        drag={isDragEnabled}
        dragConstraints={getDragConstraints()}
        dragElastic={0}
        dragTransition={{ power: 0, timeConstant: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        initial={false}
        animate={{ x: position.x, y: position.y }}
        // transition={false}
        onDoubleClick={handleDoubleClick}
        onClick={() => setShowNodes(true)}
        onBlur={() => setShowNodes(false)}
        style={{
          width: `${scaledWidth}px`,
          fontSize: `${scaledFontSize}px`,
          padding: `${scaledSpacing}px`,
        }}
        className={`
          absolute w-80 p-4 rounded-2xl shadow-lg ${color}
          backdrop-blur-md border item-container checklist
          ${isSelected ? 'border-blue-400/50 ring-2 ring-blue-400/30' : 'border-black/10'}
          ${isConnected ? 'ring-1 ring-blue-400/50' : ''}
          ${isDragEnabled ? 'cursor-move' : 'cursor-pointer'}
          will-change-transform
        `}
        tabIndex={0} // Make div focusable
        data-node-id={id}
      >
        {isConnected && isVisible && (
          <div 
            className={`
              absolute top-1/2 -translate-y-1/2 w-3 h-3 
              bg-blue-500 rounded-full border-2 border-white 
              shadow-md animate-pulse connection-indicator
              ${getConnectionSide() === 'left' ? '-left-1.5' : '-right-1.5'}
            `}
            data-connection-id={`${id}-indicator`}
            data-connection-side={getConnectionSide()}
          />
        )}
        <ConnectionNode id={id} type="checklist" position={position} side="left" isVisible={showNodes} />
        <ConnectionNode id={id} type="checklist" position={position} side="right" isVisible={showNodes} />
        <div className="flex justify-between items-start mb-4">
          <h3 style={{ fontSize: `${scaledFontSize * 1.125}px` }} className="font-semibold text-gray-800 checklist-title">
            {title}
          </h3>
          <button
            onClick={() => deleteChecklist(id)}
            className="p-2 hover:bg-red-500/10 rounded-full transition-all duration-200 hover:scale-110"
          >
            <Trash2 size={scaledIconSize} className="text-red-500" />
          </button>
        </div>

        <div className="space-y-2 checklist-tasks">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex flex-col gap-2 bg-white/60 backdrop-blur-sm rounded-xl task-item shadow-sm border border-white/50"
              style={{ padding: `${scaledSpacing * 0.5}px` }}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => toggleItem(id, item.id)}
                  className={`
                    p-1.5 rounded-lg transition-all duration-200 mt-1 hover:scale-110
                    ${item.completed ? 'bg-green-500 text-white shadow-md' : 'bg-white/80 hover:bg-white'}
                  `}
                >
                  <Check size={14} className={item.completed ? '' : 'text-gray-400'} />
                </button>
                
                <div className="flex-1 flex flex-col gap-0.5">
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItem(id, item.id, { text: e.target.value })}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none min-h-[24px] text-gray-800 font-medium"
                    rows={item.text.split('\n').length}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                  {item.deadline && formatDateForDisplay(item.deadline) && (
                    <div className="text-[11px] text-gray-600 flex items-center gap-1 deadline-text bg-blue-50/50 rounded-md px-2 py-0.5 w-fit">
                      <Clock size={10} className="text-blue-500" />
                      <span>{formatDateForDisplay(item.deadline)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => toggleTimeTracking(id, item.id)}
                    className={`
                      p-1.5 rounded-lg transition-all duration-200 group relative hover:scale-110
                      ${item.isTracking ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 hover:bg-white'}
                    `}
                  >
                    <Timer size={14} className={item.isTracking ? '' : 'text-gray-600'} />
                    <div className="absolute bottom-full right-0 mb-1
                                 hidden group-hover:block whitespace-nowrap
                                 bg-zinc-800 text-white text-xs px-2 py-1 rounded-md shadow-lg">
                      {item.isTracking ? 'Stop tracking' : 'Start tracking'}
                    </div>
                  </button>

                  {item.timeSpent > 0 && (
                    <span className="text-xs text-gray-600 font-medium time-spent bg-purple-50/50 rounded-md px-1.5 py-0.5">
                      {formatTimeSpent(item.timeSpent)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center ml-8">
                <div className={`
                  font-medium
                  ${getTimeStatus(item)?.isUrgent ? 'relative' : getTimeStatus(item)?.color}
                `}>
                  {!getTimeStatus(item)?.isUrgent && (
                    <span>{getTimeStatus(item)?.text}</span>
                  )}
                  
                  {getTimeStatus(item)?.isUrgent && (
                    <div className="absolute bottom-full right-0 mb-2
                                 bg-red-500 text-white px-2 py-1 rounded
                                 text-xs whitespace-nowrap shadow-lg animate-pulse z-50">
                      {getTimeStatus(item)?.tooltip}
                      <div className="absolute bottom-0 right-2 transform translate-y-1/2
                                   border-4 border-transparent border-t-red-500"/>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingTask(item)}
                    className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg transition-all duration-200 hover:scale-110"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      updateChecklist(id, {
                        items: items.filter(i => i.id !== item.id)
                      })
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all duration-200 hover:scale-110"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAddTaskModal(true)}
          className="mt-3 text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-white/40 rounded-lg px-2 py-1.5 transition-all duration-200 hover:scale-105"
          style={{ fontSize: `${scaledFontSize * 0.875}px` }}
        >
          + Add item
        </button>
      </motion.div>

      {showAddTaskModal && (
        <TaskModal
          title="Add New Task"
          onClose={() => setShowAddTaskModal(false)}
          onSubmit={handleAddTask}
        />
      )}

      {editingTask && (
        <TaskModal
          title="Edit Task"
          initialData={{
            text: editingTask.text,
            date: editingTask.deadline ? formatDateForInput(editingTask.deadline) : '',
            time: editingTask.deadline ? formatTimeForInput(editingTask.deadline) : '',
          }}
          onClose={() => setEditingTask(null)}
          onSubmit={(data) => handleEditTask(editingTask.id, data)}
        />
      )}
    </>
  )
}
