'use client'

import { useEffect, useRef, useState } from 'react'
import { useDrawingStore } from '@/store/drawingStore'
import { useThemeStore } from '@/store/themeStore'
import { useBoardStore } from '@/store/boardStore'
import { Point, DrawingPath } from '@/types/drawing'
import { Eraser, Palette, Minus, Plus, X, Undo2 } from 'lucide-react'

const COLOR_GROUPS = [
  [
    '#000000', // Black
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
  ],
  [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#14b8a6', // Teal
    '#84cc16', // Lime
  ],
  [
    '#ffffff', // White
    '#6b7280', // Gray
    '#92400e', // Brown
    '#6366f1', // Indigo
    '#a855f7', // Purple Light
    '#d946ef', // Fuchsia
  ],
  [
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#0ea5e9', // Sky
    '#7c3aed', // Violet
    '#be185d', // Pink Dark
    '#78350f', // Brown Dark
  ],
]

const STROKE_WIDTHS = [1, 2, 4, 6, 8, 12, 16, 20, 24, 30, 40]

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawingPath, setIsDrawingPath] = useState(false)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [showControls, setShowControls] = useState(true)
  
  const { 
    isDrawing,
    isErasing,
    drawings,
    currentColor, 
    currentStrokeWidth,
    eraserWidth,
    toggleDrawing,
    toggleEraser,
    setColor,
    setStrokeWidth,
    setEraserWidth,
    addDrawing,
    undoLastDrawing
  } = useDrawingStore()
  
  const isDark = useThemeStore((state) => state.isDark)
  const currentBoardId = useBoardStore((state) => state.currentBoardId)
  const addItemToBoard = useBoardStore((state) => state.addItemToBoard)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = containerRef.current
    if (!container) return

    // Set canvas size to match viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      redrawAllPaths()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Redraw when drawings change
  useEffect(() => {
    redrawAllPaths()
  }, [drawings])

  const redrawAllPaths = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Redraw all saved drawings
    drawings.forEach((drawing) => {
      drawing.paths.forEach((path) => {
        if (path.points.length < 2) return
        
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.strokeWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        path.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        
        ctx.stroke()
      })
    })
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const drawLine = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    
    if (isErasing) {
      // Eraser: draw in background color with globalCompositeOperation
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = eraserWidth
    } else {
      // Normal drawing
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = currentColor
      ctx.lineWidth = currentStrokeWidth
    }
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over'
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const pos = getMousePos(e)
    setIsDrawingPath(true)
    setCurrentPath([pos])
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingPath) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const pos = getMousePos(e)
    const prevPos = currentPath[currentPath.length - 1]

    if (prevPos) {
      drawLine(ctx, prevPos, pos)
    }

    setCurrentPath((prev) => [...prev, pos])
  }

  const handleMouseUp = () => {
    if (!isDrawingPath || currentPath.length === 0) return

    // Don't save eraser strokes as drawings
    if (isErasing) {
      setIsDrawingPath(false)
      setCurrentPath([])
      return
    }

    // Save the drawing path
    const drawingPath: DrawingPath = {
      id: Date.now().toString(),
      points: currentPath,
      color: currentColor,
      strokeWidth: currentStrokeWidth,
      timestamp: Date.now(),
    }

    const drawing = {
      id: Date.now().toString(),
      paths: [drawingPath],
      position: { x: 0, y: 0 },
    }

    addDrawing(drawing)

    // Add to current board
    if (currentBoardId) {
      addItemToBoard(currentBoardId, 'drawings', drawing.id)
    }

    setIsDrawingPath(false)
    setCurrentPath([])
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Clear all stored drawings
    drawings.forEach(drawing => {
      useDrawingStore.getState().deleteDrawing(drawing.id)
    })
  }

  return (
    <>
      {/* Drawing Canvas - Scrolls with content */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ 
          zIndex: 10, 
          cursor: isDrawing ? (isErasing ? 'cell' : 'crosshair') : 'auto',
          pointerEvents: isDrawing ? 'auto' : 'none',
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0"
        />
      </div>

      {/* Drawing Controls - Only in drawing mode */}
      {isDrawing && showControls && (
        <div
          className="fixed top-1/2 -translate-y-1/2 right-4 pointer-events-auto"
          style={{ zIndex: 11 }}
        >
          <div
            className={`
              p-4 rounded-2xl backdrop-blur-xl border shadow-lg
              ${isDark
                ? 'bg-zinc-800/90 border-zinc-700/50'
                : 'bg-white/90 border-zinc-200/50'}
              space-y-4
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isErasing ? 'Eraser Tools' : 'Drawing Tools'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowControls(false)
                }}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Eraser Width OR Color Picker */}
            {isErasing ? (
              <div>
                <label className="text-xs font-medium mb-2 block opacity-70">
                  Eraser Size
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const currentIndex = STROKE_WIDTHS.indexOf(eraserWidth)
                        if (currentIndex > 0) {
                          setEraserWidth(STROKE_WIDTHS[currentIndex - 1])
                        }
                      }}
                      disabled={eraserWidth === STROKE_WIDTHS[0]}
                      className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 
                               disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm font-medium min-w-[40px] text-center">
                      {eraserWidth}px
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const currentIndex = STROKE_WIDTHS.indexOf(eraserWidth)
                        if (currentIndex < STROKE_WIDTHS.length - 1) {
                          setEraserWidth(STROKE_WIDTHS[currentIndex + 1])
                        }
                      }}
                      disabled={eraserWidth === STROKE_WIDTHS[STROKE_WIDTHS.length - 1]}
                      className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 
                               disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual Preview */}
                  <div className="flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <div
                      className="rounded-full border-2 border-orange-500"
                      style={{
                        width: `${eraserWidth * 2}px`,
                        height: `${eraserWidth * 2}px`,
                        backgroundColor: 'transparent',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* Color Picker */}
            <div>
              <label className="text-xs font-medium mb-2 block opacity-70">
                Color
              </label>
              <div className="flex gap-2">
                {COLOR_GROUPS.map((group, groupIndex) => (
                  <div key={groupIndex} className="flex flex-col gap-2">
                    {group.map((color) => (
                      <button
                        key={color}
                        onClick={(e) => {
                          e.stopPropagation()
                          setColor(color)
                        }}
                        className={`
                          w-8 h-8 rounded-lg transition-all
                          ${currentColor === color 
                            ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' 
                            : 'hover:scale-105'
                          }
                        `}
                        style={{
                          backgroundColor: color,
                          border: color === '#ffffff' ? '1px solid #e5e7eb' : 'none',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="text-xs font-medium mb-2 block opacity-70">
                Stroke Width
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const currentIndex = STROKE_WIDTHS.indexOf(currentStrokeWidth)
                      if (currentIndex > 0) {
                        setStrokeWidth(STROKE_WIDTHS[currentIndex - 1])
                      }
                    }}
                    disabled={currentStrokeWidth === STROKE_WIDTHS[0]}
                    className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 
                             disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm font-medium min-w-[40px] text-center">
                    {currentStrokeWidth}px
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const currentIndex = STROKE_WIDTHS.indexOf(currentStrokeWidth)
                      if (currentIndex < STROKE_WIDTHS.length - 1) {
                        setStrokeWidth(STROKE_WIDTHS[currentIndex + 1])
                      }
                    }}
                    disabled={currentStrokeWidth === STROKE_WIDTHS[STROKE_WIDTHS.length - 1]}
                    className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 
                             disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Visual Preview */}
                <div className="flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                  <div
                    className="rounded-full"
                    style={{
                      width: `${currentStrokeWidth * 2}px`,
                      height: `${currentStrokeWidth * 2}px`,
                      backgroundColor: currentColor,
                      border: currentColor === '#ffffff' ? '1px solid #e5e7eb' : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
            </>
            )}

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  undoLastDrawing()
                }}
                disabled={drawings.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 
                         bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                         transition-all text-sm font-medium disabled:opacity-40 
                         disabled:cursor-not-allowed disabled:hover:bg-blue-500"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearCanvas()
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 
                         bg-red-500 hover:bg-red-600 text-white rounded-lg 
                         transition-colors text-sm font-medium"
              >
                <Eraser className="w-4 h-4" />
                Clear All
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleDrawing()
                }}
                className="w-full px-3 py-2 bg-zinc-200 hover:bg-zinc-300 
                         dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-lg 
                         transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Controls Button - Only in drawing mode */}
      {isDrawing && !showControls && (
        <button
          onClick={() => setShowControls(true)}
          className={`
            fixed top-1/2 -translate-y-1/2 right-4 p-3 rounded-xl shadow-lg border transition-all
            hover:scale-105 pointer-events-auto
            ${isDark
              ? 'bg-zinc-800/90 border-zinc-700/50'
              : 'bg-white/90 border-zinc-200/50'}
          `}
          style={{ zIndex: 11 }}
        >
          <Palette className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
