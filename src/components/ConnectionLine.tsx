import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {create} from 'zustand'

interface ConnectionLineProps {
  fromId: string
  toId: string
  color: string
}

export function ConnectionLine({ fromId, toId, color }: ConnectionLineProps) {
  const [path, setPath] = useState('')

  const updatePath = () => {
    const fromEl = document.querySelector(`[data-connection-id="${fromId}-indicator"]`)
    const toEl = document.querySelector(`[data-connection-id="${toId}-indicator"]`)

    if (!fromEl || !toEl) return

    // Get positions within the items container
    const itemsContainer = document.querySelector('.items-container')
    const containerRect = itemsContainer?.getBoundingClientRect() || { top: 0, left: 0 }
    const fromRect = fromEl.getBoundingClientRect()
    const toRect = toEl.getBoundingClientRect()

    // Calculate relative positions
    const fromX = fromRect.left - containerRect.left
    const fromY = fromRect.top - containerRect.top
    const toX = toRect.left - containerRect.left
    const toY = toRect.top - containerRect.top

    const midX = (fromX + toX) / 2
    const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
    
    setPath(path)
  }

  useEffect(() => {
    updatePath()
    const observer = new ResizeObserver(updatePath)
    const interval = setInterval(updatePath, 1000/60) // 60fps updates

    document.querySelectorAll(`[data-connection-id]`).forEach(el => {
      observer.observe(el)
    })

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [fromId, toId])

  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      initial={false}
      animate={{ d: path }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    />
  )
}
interface GridState {
    scrollY: number
    setScrollY: (scrollY: number) => void
}

const useGridStore = create<GridState>((set) => ({
    scrollY: 0,
    setScrollY: (scrollY: number) => set({ scrollY })
}))

export default useGridStore

