import { useState } from 'react'
import { Pencil, Eraser, Download } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useDrawingStore } from '../store/drawingStore'
import { useExportStore } from '../store/exportStore'
import { useBoardStore } from '../store/boardStore'

/**
 * Minimal vertical side dock shown only in presentation mode.
 * Provides: Draw, Erase, Connect/Disconnect, Export.
 */
export function PresentationDock() {
  const isDark = useThemeStore((s) => s.isDark)
  const { isDrawing, toggleDrawing, isErasing, toggleEraser } = useDrawingStore()
  const { openExportModal } = useExportStore()
  const currentBoardId = useBoardStore((s) => s.currentBoardId)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const tools = [
    {
      id: 'draw',
      icon: Pencil,
      label: 'Draw',
      onClick: toggleDrawing,
      isActive: isDrawing,
      activeColor: 'text-blue-500',
    },
    {
      id: 'erase',
      icon: Eraser,
      label: 'Eraser',
      onClick: toggleEraser,
      isActive: isErasing,
      activeColor: 'text-orange-500',
    },
    {
      id: 'export',
      icon: Download,
      label: 'Export',
      onClick: openExportModal,
      isActive: false,
      activeColor: '',
    },
  ]

  if (!currentBoardId || isDrawing) return null

  return (
    <div
      className={`fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5 p-2 rounded-2xl border shadow-xl backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'bg-zinc-800/90 border-zinc-700/50'
          : 'bg-white/90 border-zinc-200/50'
      }`}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.onClick}
          onPointerEnter={(e) => { if (e.pointerType !== 'touch') setHoveredId(tool.id) }}
          onPointerLeave={(e) => { if (e.pointerType !== 'touch') setHoveredId(null) }}
          onTouchEnd={() => setHoveredId(null)}
          className={`relative p-2.5 rounded-xl transition-all duration-200 ${
            tool.isActive
              ? `${tool.activeColor} ${isDark ? 'bg-zinc-700/60' : 'bg-zinc-100'}`
              : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <tool.icon size={18} strokeWidth={1.5} />

          {/* Tooltip — left side */}
          <div
            className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap
              bg-zinc-800 text-white px-2.5 py-1 rounded-lg text-xs font-medium
              pointer-events-none shadow-lg transition-all duration-150
              ${hoveredId === tool.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
          >
            {tool.label}
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 border-4 border-transparent border-l-zinc-800" />
          </div>
        </button>
      ))}
    </div>
  )
}
