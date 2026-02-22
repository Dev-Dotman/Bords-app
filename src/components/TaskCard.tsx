'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Task, Position } from '../types/task'
import { useTaskStore } from '../store/taskStore'

interface TaskCardProps extends Task {
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function TaskCard({
  id,
  title,
  description,
  position,
  color = 'bg-white', // Changed default color
  onDragStart,
  onDragEnd
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { updateTask } = useTaskStore()
  const cardRef = useRef<HTMLDivElement>(null)

  const handleDragEnd = (_: any, info: { offset: { x: number; y: number } }) => {
    setIsDragging(false)
    onDragEnd?.()
    
    const newPosition: Position = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y
    }
    
    updateTask(id, { position: newPosition })
  }

  return (
    <motion.div
      ref={cardRef}
      drag
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true)
        onDragStart?.()
      }}
      onDragEnd={handleDragEnd}
      initial={false}
      animate={{ x: position.x, y: position.y }}
      className={`
        absolute ${color} p-3 rounded-lg
        border border-zinc-200 shadow-lg w-48
        ${isDragging ? 'z-50 cursor-grabbing shadow-xl' : 'cursor-grab'}
        hover:shadow-xl transition-all duration-200
        hover:bg-zinc-50 hover:scale-105
      `}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-zinc-800">{title}</h3>
        <div className="flex gap-2">
          <button
            className="p-1 hover:bg-zinc-100 rounded transition-colors"
            onClick={() => updateTask(id, { 
              color: `bg-${['blue', 'indigo', 'violet', 'sky'][Math.floor(Math.random() * 4)]}-50` 
            })}
          >
            🎨
          </button>
          <button className="p-1 hover:bg-zinc-100 rounded transition-colors">🔗</button>
        </div>
      </div>
      <p className="text-zinc-600 mt-2">{description}</p>
    </motion.div>
  )
}
