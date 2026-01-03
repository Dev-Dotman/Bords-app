import { motion } from 'framer-motion'
import { Trash2, Edit2, Palette } from 'lucide-react'
import { useState } from 'react'
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

export function StickyNote({ id, text, position, color }: StickyNoteProps) {
  const [showControls, setShowControls] = useState(false)
  const [showNodes, setShowNodes] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const { updateNote, deleteNote } = useNoteStore()
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled)
  const { selectedItems, selectItem, deselectItem, isVisible } = useConnectionStore();
  const isSelected = selectedItems.some(item => item.id === id);
  const zoom = useGridStore((state) => state.zoom)
  const connections = useConnectionStore((state) => state.connections)
  const isConnected = connections.some(conn => conn.fromId === id || conn.toId === id)

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

    updateNote(id, { position: newPosition })
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

    // Get the other item's ID
    const otherId = connection.fromId === id ? connection.toId : connection.fromId
    
    // Find the other item's position
    const otherElement = document.querySelector(`[data-node-id="${otherId}"]`)
    if (!otherElement) return null

    const otherRect = otherElement.getBoundingClientRect()
    const thisRect = document.querySelector(`[data-node-id="${id}"]`)?.getBoundingClientRect()
    
    if (!thisRect) return null
    
    // Compare x positions to determine left/right
    return otherRect.left < thisRect.left ? 'left' : 'right'
  }

  const baseWidth = 192 // Base width in pixels
  const scaledWidth = baseWidth * zoom

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
        animate={{ x: position.x, y: position.y }}
        // transition={false}
        onDoubleClick={handleDoubleClick}
        onClick={() => setShowNodes(true)}
        onBlur={() => setShowNodes(false)}
        className={`
          absolute w-48 p-5 rounded-2xl sticky-note
          ${color} cursor-pointer select-none relative
          backdrop-blur-sm border item-container
          ${isSelected ? 'border-blue-400/50 ring-2 ring-blue-400/30' : 'border-black/10'}
          ${isConnected ? 'ring-1 ring-blue-400/50' : ''}
          will-change-transform
        `}
        tabIndex={0} // Make div focusable
        onFocus={(e) => e.preventDefault()}
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          touchAction: 'none',
          width: `${scaledWidth}px`,
          fontSize: `${14 * zoom}px`,
          scrollMargin: 0
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
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
        
        {/* Connection Nodes */}
        <ConnectionNode id={id} type="note" position={position} side="left" isVisible={showNodes} />
        <ConnectionNode id={id} type="note" position={position} side="right" isVisible={showNodes} />

        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-zinc-700 to-zinc-600 text-white text-[10px] px-2 py-1 rounded-full font-medium shadow-md">
          Sticky Note
        </div>

        <div className="note-content whitespace-pre-wrap break-words text-gray-800 select-none font-medium">
          {text}
        </div>

        {showControls && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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
              onClick={() => deleteNote(id)}
              className="p-2.5 hover:bg-red-500/10 transition-all duration-200 hover:scale-110"
              title="Delete note"
            >
              <Trash2 size={14} className="text-red-600" />
            </button>
          </motion.div>
        )}

        {/* Color Picker */}
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
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
          </motion.div>
        )}
      </motion.div>

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
