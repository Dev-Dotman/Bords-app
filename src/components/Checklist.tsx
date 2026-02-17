import { Trash2, Check, Timer, Clock, Pencil, Palette, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Resizable } from 're-resizable'
import { useChecklistStore, ChecklistItem as ChecklistItemType } from '../store/checklistStore'
import { useDragModeStore } from '../store/dragModeStore'
import { toast } from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import { TaskModal } from './TaskModal'
import { useConnectionStore } from '../store/connectionStore';
import { ConnectionNode } from './ConnectionNode'
import { useGridStore } from '../store/gridStore'
import { useZIndexStore } from '../store/zIndexStore'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { ColorPicker } from './ColorPicker'

interface ChecklistProps {
  id: string
  title: string
  items: ChecklistItemType[]
  position: { x: number; y: number }
  color: string
  width?: number
  height?: number
}



export function Checklist({ id, title, items, position, color, width = 320, height = 400 }: ChecklistProps) {
  const { updateChecklist, deleteChecklist, toggleItem, updateItem, toggleTimeTracking, reorderItem } = useChecklistStore()
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled)
  const [editingTask, setEditingTask] = useState<ChecklistItemType | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const { selectedItems, selectItem, deselectItem, isVisible, removeConnectionsByItemId } = useConnectionStore();
  const isSelected = selectedItems.some(item => item.id === id);
  const [showNodes, setShowNodes] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
   const [editTitleValue, setEditTitleValue] = useState(title)  
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)  
   const itemsContainerRef = useRef<HTMLDivElement>(null)
  const zoom = useGridStore((state) => state.zoom)
  const connections = useConnectionStore((state) => state.connections)
  const isConnected = connections.some(conn => conn.fromId === id || conn.toId === id)
  const { bringToFront } = useZIndexStore()
  const zIndex = useZIndexStore((state) => state.zIndexMap[id] || 1)

  const handleResizeStop = (e: any, direction: any, ref: any, d: any) => {
    updateChecklist(id, {
      width: width + d.width,
      height: height + d.height
    })
  }

  const handleDoubleClick = () => {
    if (isSelected) {
      deselectItem(id);
    } else {
      selectItem(id, 'checklist', position);
    }
  };

  // Check deadlines and send reminders
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []
    
    items.forEach((item) => {
      // Only schedule reminders for incomplete items with deadlines
      if (item.deadline && !item.completed) {
        const now = Date.now()
        const deadlineTime = new Date(item.deadline).getTime()
        const timeUntilDeadline = deadlineTime - now
        
        // Helper to send reminder (toast + email)
        const sendReminder = async (timeRemaining: string, isUrgent: boolean = false) => {
          // Double-check item is still not completed before sending reminder
          const currentItem = items.find(i => i.id === item.id)
          if (currentItem?.completed) {
            return // Don't send reminder if item was completed
          }
          
          // Show toast notification
          toast(
            timeRemaining === 'overdue'
              ? `Deadline reached: ${item.text}`
              : `Reminder: ${item.text} is due in ${timeRemaining}`,
            {
              icon: isUrgent ? '⚠️' : '⏰',
              duration: 5000,
            }
          )
          
          // Send email reminder
          try {
            await fetch('/api/send-reminder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                checklistTitle: title,
                taskText: item.text,
                timeRemaining,
                deadline: formatDateForDisplay(item.deadline) || '',
                boardUrl: window.location.href,
              }),
            })
          } catch (error) {
            console.error('Failed to send email reminder:', error)
          }
        }
        
        // Schedule reminders
        const reminderIntervals = [
          { time: 30 * 60 * 1000, label: '30 minutes', urgent: false }, // 30 minutes
          { time: 10 * 60 * 1000, label: '10 minutes', urgent: true },  // 10 minutes
          { time: 5 * 60 * 1000, label: '5 minutes', urgent: true },    // 5 minutes
          { time: 0, label: 'overdue', urgent: true },                   // Deadline reached
        ]
        
        reminderIntervals.forEach(({ time, label, urgent }) => {
          const timeToReminder = timeUntilDeadline - time
          
          if (timeToReminder > 0) {
            const timeout = setTimeout(() => {
              sendReminder(label, urgent)
            }, timeToReminder)
            
            timeouts.push(timeout)
          } else if (time === 0 && timeUntilDeadline <= 0 && timeUntilDeadline > -60000) {
            // If deadline just passed (within last minute), send overdue notification
            sendReminder('overdue', true)
          }
        })
      }
    })
    
    return () => {
      // Clear all scheduled timeouts when effect re-runs or component unmounts
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [items, title])

  // Check for overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (itemsContainerRef.current) {
        const { scrollHeight, clientHeight } = itemsContainerRef.current
        setHasOverflow(scrollHeight > clientHeight + 5)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [items, height])

  // Add time tracking effect
  useEffect(() => {
    const interval = setInterval(() => {
      items.forEach((item) => {
        // Only track time if item is not completed
        if (item.isTracking && !item.completed) {
          updateItem(id, item.id, {
            timeSpent: (item.timeSpent || 0) + 1
          })
        } else if (item.isTracking && item.completed) {
          // Stop tracking if item was completed while tracking
          updateItem(id, item.id, {
            isTracking: false
          })
        }
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [items, id, updateItem])

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

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `checklist-${id}`,
    disabled: !isDragEnabled,
    data: { type: 'checklist', id, position }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    fontSize: `${scaledFontSize}px`,
    padding: `${scaledSpacing * 1.25}px`,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    scrollMargin: 0,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10000 : zIndex,
    borderRadius: `${24 * zoom}px`,
  }

  return (
    <>
      <div
        style={style}
        data-node-id={id}
        data-item-id={id}
        onMouseDown={() => bringToFront(id)}
      >
        <Resizable
          size={{ width, height }}
          onResizeStop={handleResizeStop}
          minWidth={280}
          minHeight={200}
          enable={{
            top: false,
            right: !isDragging,
            bottom: !isDragging,
            left: false,
            topRight: false,
            bottomRight: !isDragging,
            bottomLeft: false,
            topLeft: false,
          }}
          handleStyles={{
            right: {
              right: '-4px',
              width: '8px',
              cursor: 'ew-resize',
            },
            bottom: {
              bottom: '-4px',
              height: '8px',
              cursor: 'ns-resize',
            },
            bottomRight: {
              right: '-4px',
              bottom: '-4px',
              width: '12px',
              height: '12px',
              cursor: 'nwse-resize',
            },
          }}
        >
          <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onDoubleClick={handleDoubleClick}
            onClick={() => setShowNodes(true)}
            onBlur={() => setShowNodes(false)}
            className={`
              w-full h-full p-5 rounded-3xl ${color}
              backdrop-blur-md border item-container checklist overflow-hidden relative
              ${isSelected ? 'border-blue-400/50 ring-2 ring-blue-400/30' : 'border-black/10'}
              ${isConnected ? 'ring-1 ring-blue-400/50' : ''}
              ${isDragEnabled ? 'cursor-move' : 'cursor-pointer'}
              will-change-transform
            `}
            tabIndex={0}
            onFocus={(e) => e.preventDefault()}
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
        <div className="flex justify-between items-start mb-5 relative">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              style={{ fontSize: `${scaledFontSize * 1.25}px` }}
              className="font-semibold text-gray-800 bg-white/80 rounded-lg px-2 py-1 border border-zinc-300 focus:ring-2 focus:ring-blue-400/50 focus:outline-none flex-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter' && editTitleValue.trim()) {
                  updateChecklist(id, { title: editTitleValue.trim() })
                  setIsEditingTitle(false)
                }
                if (e.key === 'Escape') {
                  setEditTitleValue(title)
                  setIsEditingTitle(false)
                }
              }}
              onBlur={() => {
                if (editTitleValue.trim()) updateChecklist(id, { title: editTitleValue.trim() })
                setIsEditingTitle(false)
              }}
            />
          ) : (
            <h3
              style={{ fontSize: `${scaledFontSize * 1.25}px` }}
              className="font-semibold text-gray-800 checklist-title cursor-pointer hover:bg-white/40 rounded-lg px-2 py-1 transition-colors"
              onDoubleClick={(e) => {
                e.stopPropagation()
                setEditTitleValue(title)
                setIsEditingTitle(true)
              }}
              title="Double-click to rename"
            >
              {title}
            </h3>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowColorPicker(!showColorPicker)
              }}
              className="p-2.5 hover:bg-purple-50 rounded-xl transition-all duration-200 hover:scale-110 group"
              title="Change checklist color"
            >
              <Palette size={scaledIconSize} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 group"
              title="Delete checklist"
            >
              <Trash2 size={scaledIconSize} className="text-gray-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>

          {/* Color Picker */}
          {showColorPicker && (
            <ColorPicker
              currentColor={color}
              onSelect={(c) => updateChecklist(id, { color: c })}
              onClose={() => setShowColorPicker(false)}
              position="top-full right-0 mt-2"
            />
          )}
        </div>

        <div 
          ref={itemsContainerRef}
          className="space-y-3 checklist-tasks overflow-auto"
          style={{ maxHeight: 'calc(100% - 50px)' }}
        >
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className="flex flex-col gap-2.5 bg-white/60 backdrop-blur-sm rounded-2xl task-item border border-white/50 hover:shadow-md transition-all duration-200 group/item"
              style={{ padding: `${scaledSpacing * 0.75}px`, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
            >
              <div className="flex items-start gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity mt-1">
                  <button
                    onClick={() => { if (index > 0) reorderItem(id, index, index - 1) }}
                    disabled={index === 0}
                    className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20 transition-all"
                    title="Move up"
                  >
                    <ChevronUp size={12} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => { if (index < items.length - 1) reorderItem(id, index, index + 1) }}
                    disabled={index === items.length - 1}
                    className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20 transition-all"
                    title="Move down"
                  >
                    <ChevronDown size={12} className="text-gray-500" />
                  </button>
                </div>

                <button
                  onClick={() => toggleItem(id, item.id)}
                  className={`
                    p-2 rounded-xl transition-all duration-200 mt-0.5 hover:scale-110
                    ${item.completed ? 'bg-green-500 text-white shadow-md' : 'bg-white/80 hover:bg-white'}
                  `}
                >
                  <Check size={16} className={item.completed ? '' : 'text-gray-400'} />
                </button>
                
                <div className="flex-1 flex flex-col gap-0.5">
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItem(id, item.id, { text: e.target.value })}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none min-h-[24px] text-gray-800 font-medium text-sm"
                    rows={item.text.split('\n').length}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                  {item.deadline && formatDateForDisplay(item.deadline) && (
                    <div className="text-[11px] text-gray-600 flex items-center gap-1 deadline-text bg-blue-50/50 rounded-lg px-2.5 py-1 w-fit ">
                      <Clock size={12} className="text-blue-500" />
                      <span>{formatDateForDisplay(item.deadline)}</span>
                    </div>
                  )}
                </div>

                {/* Show action buttons inline when no deadline */}
                {!item.deadline && (
                  <div className="flex items-center gap-1.5">
                    {item.timeSpent > 0 && (
                      <span className="text-xs text-gray-600 font-medium time-spent bg-purple-50/50 rounded-lg px-2 py-1 shadow-sm">
                        {formatTimeSpent(item.timeSpent)}
                      </span>
                    )}
                    <button
                      onClick={() => toggleTimeTracking(id, item.id)}
                      className={`
                        p-2 rounded-xl transition-all duration-200 group relative hover:scale-110
                        ${item.isTracking ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 hover:bg-white'}
                      `}
                    >
                      <Timer size={16} className={item.isTracking ? '' : 'text-gray-600'} />
                      <div className="absolute bottom-full right-0 mb-1
                                   hidden group-hover:block whitespace-nowrap
                                   bg-zinc-800 text-white text-xs px-2 py-1 rounded-md shadow-lg z-[9999]">
                        {item.isTracking ? 'Stop tracking' : 'Start tracking'}
                      </div>
                    </button>
                    <button
                      onClick={() => setEditingTask(item)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        updateChecklist(id, {
                          items: items.filter(i => i.id !== item.id)
                        })
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                {/* Original layout for items with deadlines */}
                {item.deadline && (
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => toggleTimeTracking(id, item.id)}
                      className={`
                        p-2 rounded-xl transition-all duration-200 group relative hover:scale-110
                        ${item.isTracking ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 hover:bg-white'}
                      `}
                    >
                      <Timer size={16} className={item.isTracking ? '' : 'text-gray-600'} />
                      <div className="absolute bottom-full right-0 mb-1
                                   hidden group-hover:block whitespace-nowrap
                                   bg-zinc-800 text-white text-xs px-2 py-1 rounded-md shadow-lg z-[9999]">
                        {item.isTracking ? 'Stop tracking' : 'Start tracking'}
                      </div>
                    </button>

                    {item.timeSpent > 0 && (
                      <span className="text-xs text-gray-600 font-medium time-spent bg-purple-50/50 rounded-lg px-2 py-1 shadow-sm">
                        {formatTimeSpent(item.timeSpent)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom row only for items with deadlines */}
              {item.deadline && (
                <div className="flex justify-between items-center ml-11">
                  <div className={`
                    font-medium text-sm
                    ${item.completed 
                      ? 'text-gray-400 line-through' 
                      : getTimeStatus(item)?.isUrgent ? 'relative' : getTimeStatus(item)?.color}
                  `}>
                    {!item.completed && !getTimeStatus(item)?.isUrgent && (
                      <span>{getTimeStatus(item)?.text}</span>
                    )}
                    
                    {item.completed && (
                      <span className="text-green-600 text-xs">✓ Completed</span>
                    )}
                    
                    {!item.completed && getTimeStatus(item)?.isUrgent && (
                      <div className="absolute bottom-full right-0 mb-2
                                   bg-red-500 text-white px-3 py-1.5 rounded-lg
                                   text-xs whitespace-nowrap shadow-lg animate-pulse z-[9999]">
                        {getTimeStatus(item)?.tooltip}
                        <div className="absolute bottom-0 right-2 transform translate-y-1/2
                                     border-4 border-transparent border-t-red-500"/>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingTask(item)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        updateChecklist(id, {
                          items: items.filter(i => i.id !== item.id)
                        })
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 group"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasOverflow && (
          <div 
            onClick={(e) => {
              e.stopPropagation()
              if (itemsContainerRef.current) {
                itemsContainerRef.current.scrollTo({
                  top: itemsContainerRef.current.scrollTop + 100,
                  behavior: 'smooth'
                })
              }
            }}
            className="absolute bottom-8 right-6 flex items-center gap-1 text-xs font-medium cursor-pointer hover:opacity-70 transition-opacity z-[9999]"
            style={{ color: color.includes('white') || color.includes('yellow') ? '#666' : color.includes('blue') ? '#1e40af' : color.includes('green') ? '#15803d' : color.includes('purple') ? '#6b21a8' : color.includes('pink') ? '#be185d' : color.includes('orange') ? '#c2410c' : '#555' }}>
            More
            <ChevronDown size={14} />
          </div>
        )}

        {!hasOverflow && (
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="mt-2 text-sm text-gray-600 hover:text-gray-800 font-semibold hover:bg-white/50 rounded-xl px-3 py-1.5 transition-all duration-200 hover:scale-105 hover:shadow-sm"
            style={{ fontSize: `${scaledFontSize * 0.875}px` }}
          >
            + Add item
          </button>
        )}
        </div>
      </Resizable>

      {hasOverflow && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowAddTaskModal(true)
          }}
          className="absolute -bottom-12 left-0 right-0 mx-auto w-fit text-sm text-gray-600 hover:text-gray-800 font-semibold bg-white/90 hover:bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 transition-all duration-200 hover:scale-105 shadow-lg border border-black/10"
          style={{ fontSize: `${scaledFontSize * 0.875}px` }}
        >
          + Add item
        </button>
      )}
    </div>

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

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={() => {
          removeConnectionsByItemId(id)
          deleteChecklist(id)
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        itemName={title}
        itemType="checklist"
      />
    </>
  )
}
