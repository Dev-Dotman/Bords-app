'use client'
import { useConnectionStore } from '../store/connectionStore'
import { motion, useMotionValue } from 'framer-motion'
import { useState, useEffect } from 'react'

export function DragLayer() {
  const draggedNode = useConnectionStore((state) => state.draggedNode)
  const [path, setPath] = useState<string>('')
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedNode) return
      
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)

      const startX = draggedNode.position.x
      const startY = draggedNode.position.y
      const endX = e.clientX
      const endY = e.clientY

      // Calculate control points for curved line
      const midX = (startX + endX) / 2
      const curvature = Math.min(Math.abs(endX - startX) * 0.2, 50)

      setPath(`
        M ${startX} ${startY}
        C ${midX} ${startY},
          ${midX} ${endY},
          ${endX} ${endY}
      `)
    }

    if (draggedNode) {
      document.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [draggedNode, mouseX, mouseY])

  if (!draggedNode) return null

  return (
    <svg className="fixed inset-0 pointer-events-none z-50">
      <path
        d={path}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        strokeLinecap="round"
      />
    </svg>
  )
}
