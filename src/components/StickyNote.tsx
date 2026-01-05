import { Trash2, Edit2, Palette, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Resizable } from 're-resizable'
import { useNoteStore, StickyNote as StickyNoteType } from '../store/stickyNoteStore'
import { useDragModeStore } from '../store/dragModeStore'
import { useConnectionStore } from '../store/connectionStore';
import { ConnectionNode } from './ConnectionNode'
import { useGridStore } from '../store/gridStore';
import { StickyNoteEditModal } from './StickyNoteEditModal'

interface StickyNoteProps extends StickyNoteType {}

const colorOptions = [
  { name: 'Yellow', value: 'bg-yellow-200/80' },
  { name: 'Pink', value: 'bg-pink-200/80' },
  { name: 'Blue', value: 'bg-blue-200/80' },
  { name: 'Green', value: 'bg-green-200/80' },
  { name: 'Purple', value: 'bg-purple-200/80' },
  { name: 'Orange', value: 'bg-orange-200/80' },
  { name: 'Red', value: 'bg-red-200/80' },
  { name: 'Teal', value: 'bg-teal-200/80' },
  { name: 'Indigo', value: 'bg-indigo-200/80' },
]

export function StickyNote({ id, text, position, color, width = 192, height }: StickyNoteProps) {
  const [showControls, setShowControls] = useState(false)
  const [showNodes, setShowNodes] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const { updateNote, deleteNote } = useNoteStore()
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled)
  const { selectedItems, selectItem, deselectItem, isVisible, removeConnectionsByItemId } = useConnectionStore();
  const isSelected = selectedItems.some(item => item.id === id);
  const zoom = useGridStore((state) => state.zoom)
  const connections = useConnectionStore((state) => state.connections)
  const isConnected = connections.some(conn => conn.fromId === id || conn.toId === id)

  // Calculate minimum height based on text content
  const calculateMinHeight = () => {
    const lineHeight = 20
    const padding = 60 // Top and bottom padding + label space
    const lines = text.split('\n').length
    return Math.max(100, (lines * lineHeight) + padding)
  }

  // Calculate default height if not set
  const calculateDefaultHeight = () => {
    if (height) return height
    return calculateMinHeight()
  }

  const noteHeight = calculateDefaultHeight()
  const minHeight = calculateMinHeight()

  // Check if text content overflows
  useEffect(() => {
    const checkOverflow = () => {
      if (textContainerRef.current) {
        const { scrollHeight, clientHeight } = textContainerRef.current
        setHasOverflow(scrollHeight > clientHeight + 5) // 5px buffer
      }
    }
    
    checkOverflow()
    // Recheck when text or height changes
  }, [text, noteHeight])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `note-${id}`,
    disabled: !isDragEnabled,
    data: { type: 'note', id, position }
  })

  const handleResizeStop = (e: any, direction: any, ref: any, d: any) => {
    updateNote(id, {
      width: width + d.width,
      height: noteHeight + d.height
    })
  }

  const handleDoubleClick = () => {
    if (isSelected) {
      deselectItem(id);
    } else {
      selectItem(id, 'note', position);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEditModal(true)
  }

  const handleSaveEdit = (newText: string) => {
    updateNote(id, { text: newText })
  }

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

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    touchAction: 'none' as const,
    scrollMargin: 0,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <>
      <div
        style={style}
        data-node-id={id}
      >
        <Resizable
          size={{ width, height: noteHeight }}
          onResizeStop={handleResizeStop}
          minWidth={150}
          minHeight={minHeight}
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
              w-full h-full p-5 rounded-2xl sticky-note
              ${color} cursor-pointer select-none relative
              backdrop-blur-sm border item-container
              ${isSelected ? 'border-blue-400/50 ring-2 ring-blue-400/30' : 'border-black/10'}
              ${isConnected ? 'ring-1 ring-blue-400/50' : ''}
              will-change-transform
            `}
            tabIndex={0}
            onFocus={(e) => e.preventDefault()}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
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
        
        {/* Connection Nodes */}
        <ConnectionNode id={id} type="note" position={position} side="left" isVisible={showNodes} />
        <ConnectionNode id={id} type="note" position={position} side="right" isVisible={showNodes} />

        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-zinc-700 to-zinc-600 text-white text-[10px] px-2 py-1 rounded-full font-medium shadow-md">
          Sticky Note
        </div>

        <div 
          ref={textContainerRef}
          className="note-content whitespace-pre-wrap break-words text-gray-800 select-none font-medium overflow-auto max-h-full pr-2"
        >
          {text}
        </div>

        {/* Read More Indicator */}
        {hasOverflow && (
          <div className={`absolute bottom-2 right-2 flex items-center gap-1 ${color} text-gray-800 text-[10px] px-2 py-1 rounded-full font-medium shadow-md border border-black/10`}>
            <span>More</span>
            <ChevronDown size={10} />
          </div>
        )}

        {showControls && (
          <div 
            className="absolute -top-2 -right-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-black/10 flex overflow-hidden"
          >
            <button
              onClick={handleEdit}
              className="p-2.5 hover:bg-blue-500/10 transition-all duration-200 hover:scale-110"
              title="Edit note"
            >
              <Edit2 size={14} className="text-blue-600" />
            </button>
            <div className="w-px bg-gray-200" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowColorPicker(!showColorPicker)
              }}
              className="p-2.5 hover:bg-purple-500/10 transition-all duration-200 hover:scale-110 relative"
              title="Change color"
            >
              <Palette size={14} className="text-purple-600" />
            </button>
            <div className="w-px bg-gray-200" />
            <button
              onClick={() => {
                removeConnectionsByItemId(id)
                deleteNote(id)
              }}
              className="p-2.5 hover:bg-red-500/10 transition-all duration-200 hover:scale-110"
              title="Delete note"
            >
              <Trash2 size={14} className="text-red-600" />
            </button>
          </div>
        )}

        {/* Color Picker */}
        {showColorPicker && (
          <div
            className="absolute -top-20 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/10 p-3 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-medium text-gray-600 mb-2 text-center">Select Color</div>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateNote(id, { color: colorOption.value })
                    setShowColorPicker(false)
                  }}
                  className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    color === colorOption.value ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-300'
                  } ${colorOption.value}`}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </Resizable>
    </div>

      {/* Edit Modal */}
      {showEditModal && (
        <StickyNoteEditModal
          initialText={text}
          color={color}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  )
}
