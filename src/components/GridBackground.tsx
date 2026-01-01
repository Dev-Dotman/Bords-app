import { useRef, WheelEvent, useState, useEffect } from 'react'
import { useThemeStore, THEME_COLORS } from '../store/themeStore'
import { useGridStore } from '../store/gridStore'
import { motion } from 'framer-motion'

interface GridBackgroundProps {
  hoveredCell: number | null;
  onCellHover: (index: number) => void;
  onCellClick: (index: number) => void;
}

export function GridBackground({ hoveredCell, onCellHover, onCellClick }: GridBackgroundProps) {
  const isDark = useThemeStore((state) => state.isDark)
  const { isGridVisible, gridColor, zoom, setZoom, scrollY, setScrollY } = useGridStore()
  const colorTheme = useThemeStore((state) => state.colorTheme)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Add effect to handle initial grid color
  useEffect(() => {
    const gridStore = useGridStore.getState()
    if (isDark && !gridStore.gridColor.includes('80')) { // Check if not already a dark mode color
      gridStore.setGridColor(THEME_COLORS.gridColors.dark.gray.value)
    } else if (!isDark && gridStore.gridColor.includes('80')) { // Check if not already a light mode color
      gridStore.setGridColor(THEME_COLORS.gridColors.light.gray.value)
    }
  }, [isDark])

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const newZoom = zoom + (-e.deltaY * 0.01)
      const clampedZoom = Math.min(Math.max(0.5, newZoom), 2)
      setZoom(clampedZoom)
    } else {
      e.preventDefault()
      const scrollSpeed = 1.5
      const newScrollY = scrollY + (e.deltaY * scrollSpeed)
      const maxScroll = window.innerHeight * 0.5
      setScrollY(Math.max(0, Math.min(newScrollY, maxScroll)))
    }
  }

  // Expose scroll and zoom values to parent
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gridUpdate', { 
      detail: { 
        scroll: scrollY,
        zoom 
      }
    }))
  }, [scrollY, zoom])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ height: '3000px', userSelect: 'none'  }} // Make grid extend beyond viewport
      onWheel={handleWheel}
    >
      <div 
        className={`
          absolute inset-0
          ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}
          transition-colors duration-200
        `}
        style={{
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundImage: isGridVisible ? `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
          ` : 'none',
          opacity: 1
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const cellSize = 40 * zoom;
          const cellIndex = Math.floor(x / cellSize) + Math.floor(y / cellSize) * Math.ceil(window.innerWidth / cellSize);
          onCellClick(cellIndex);
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const cellSize = 40 * zoom;
          const cellIndex = Math.floor(x / cellSize) + Math.floor(y / cellSize) * Math.ceil(window.innerWidth / cellSize);
          onCellHover(cellIndex);
        }}
      />
    </div>
  )
}
