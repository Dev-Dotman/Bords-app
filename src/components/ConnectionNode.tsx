import { motion, AnimatePresence } from 'framer-motion'
import { useConnectionStore } from '../store/connectionStore'
import { useBoardStore } from '../store/boardStore'
import { useState, useEffect, useRef } from 'react'

interface ConnectionNodeProps {
  id: string
  type: 'note' | 'checklist' | 'kanban' | 'text' | 'media' | 'reminder'
  position: { x: number; y: number }
  side: 'left' | 'right'
  isVisible: boolean
}

export function ConnectionNode({ id, type, position, side, isVisible }: ConnectionNodeProps) {
  const { selectedItems } = useConnectionStore()
  const nodeRef = useRef<HTMLDivElement>(null)
  const currentBoardId = useBoardStore((state) => state.currentBoardId)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleDrop = (e: React.DragEvent) => {
    const sourceId = e.dataTransfer.getData('sourceId');
    const targetId = e.dataTransfer.getData('targetId');
    if (currentBoardId && sourceId && targetId) {
      addConnection(sourceId, targetId, currentBoardId)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={nodeRef}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`
            absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full 
            border-2 cursor-grab active:cursor-grabbing transition-colors
            hover:scale-125 connection-node
            ${selectedItems.some(item => item.id === id)
              ? 'bg-blue-500 border-blue-600' 
              : 'bg-white border-gray-300 hover:border-blue-400'
            }
          `}
          style={{
            [side]: '-8px',
            zIndex: 51,
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          data-node-id={id}
          data-node-type={type}
          data-node-side={side}
        />
      )}
    </AnimatePresence>
  )
}
function addConnection(sourceId: string, targetId: string, boardId: string) {
  // Get the current board's connections from localStorage or state management
  const connections = JSON.parse(localStorage.getItem(`board-${boardId}-connections`) || '[]');
  
  // Check if connection already exists
  const connectionExists = connections.some(
    (conn: { source: string; target: string }) => 
      (conn.source === sourceId && conn.target === targetId) ||
      (conn.source === targetId && conn.target === sourceId)
  );

    if (!connectionExists) {
      connections.push({ source: sourceId, target: targetId });
      localStorage.setItem(`board-${boardId}-connections`, JSON.stringify(connections));
    }
  }

