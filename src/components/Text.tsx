import { useState, useRef, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useTextStore, TextElement } from '../store/textStore'
import { useDragModeStore } from '../store/dragModeStore'
import { Trash2, RotateCcw, RotateCw, ZoomIn, ZoomOut, Palette } from 'lucide-react'
import { useGridStore } from '../store/gridStore'
import { useThemeStore } from '../store/themeStore'

export function Text({ id, text, position, fontSize, color, rotation = 0 }: TextElement & { rotation?: number }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const textRef = useRef<HTMLDivElement>(null);
  const { updateText, deleteText } = useTextStore()
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled)
  const zoom = useGridStore((state) => state.zoom)
  const isDark = useThemeStore((state) => state.isDark)

  const colorOptions = [
    '#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#6B7280', '#FFFFFF'
  ]

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `text-${id}`,
    disabled: !isDragEnabled,
    data: { type: 'text', id, position, rotation: rotation || 0 }
  })

  const adjustFontSize = (delta: number) => {
    updateText(id, {
      fontSize: Math.max(8, Math.min(72, fontSize + delta))
    })
  }

  const rotateClockwise = () => {
    updateText(id, {
      rotation: ((rotation || 0) + 15) % 360
    })
  }

  const rotateCounterClockwise = () => {
    updateText(id, {
      rotation: ((rotation || 0) - 15 + 360) % 360
    })
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-text-id="${id}"]`)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [id]);

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    rotate: `${rotation || 0}deg`,
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    scrollMargin: 0,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`select-none will-change-transform ${
        isSelected 
          ? 'ring-2 ring-blue-400/50 rounded-lg shadow-lg' 
          : isHovered ? 'ring-1 ring-blue-300/30 rounded-lg' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-text-id={id}
      onFocus={(e) => e.preventDefault()}
    >
      {isEditing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => updateText(id, { text: e.target.value })}
          onBlur={() => setIsEditing(false)}
          style={{ 
            fontSize: `${fontSize * zoom}px`,
            color: isDark ? '#fff' : color,
            minWidth: '200px'
          }}
          className={`p-3 backdrop-blur-sm rounded-lg border-2 border-blue-400/50 focus:ring-0 focus:border-blue-500 resize-none shadow-sm ${
            isDark ? 'bg-zinc-800/90 text-white placeholder:text-gray-400' : 'bg-white/80 text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div 
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsSelected(true);
          }}
          style={{ 
            fontSize: `${fontSize * zoom}px`,
            color
          }}
          className="p-3 cursor-text whitespace-pre-wrap select-none hover:bg-white/5 rounded-lg transition-colors"
        >
          {text}
        </div>
      )}

      {isSelected && !isEditing && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-black/10 p-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  adjustFontSize(-2);
                }}
                className="p-2 hover:bg-blue-500/10 rounded-full transition-all duration-200 hover:scale-110"
                title="Decrease font size"
              >
                <ZoomOut size={16} className="text-gray-700" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  adjustFontSize(2);
                }}
                className="p-2 hover:bg-blue-500/10 rounded-full transition-all duration-200 hover:scale-110"
                title="Increase font size"
              >
                <ZoomIn size={16} className="text-gray-700" />
              </button>

              <div className="w-px h-6 bg-gray-300" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rotateCounterClockwise();
                }}
                className="p-2 hover:bg-purple-500/10 rounded-full transition-all duration-200 hover:scale-110"
                title="Rotate left (15°)"
              >
                <RotateCcw size={16} className="text-purple-600" />
              </button>

              {/* Rotation indicator */}
              <div className="px-2 text-xs font-medium text-gray-600 min-w-[40px] text-center">
                {Math.round(rotation || 0)}°
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rotateClockwise();
                }}
                className="p-2 hover:bg-purple-500/10 rounded-full transition-all duration-200 hover:scale-110"
                title="Rotate right (15°)"
              >
                <RotateCw size={16} className="text-purple-600" />
              </button>

              <div className="w-px h-6 bg-gray-300" />

              {/* Color Picker Button - Shows current color */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 relative group"
                  title="Change text color"
                >
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-gray-400 transition-colors shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <Palette size={10} className="text-gray-600" />
                  </div>
                </button>
                
                {showColorPicker && (
                  <div
                    className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/10 p-3 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-2 text-center">Select Color</div>
                    <div className="flex gap-2">
                      {colorOptions.map((colorOption) => (
                        <button
                          key={colorOption}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateText(id, { color: colorOption });
                            setShowColorPicker(false);
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                            color === colorOption ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: colorOption }}
                          title={colorOption}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteText(id);
                }}
                className="p-2 hover:bg-red-500/10 rounded-full transition-all duration-200 hover:scale-110"
                title="Delete text"
              >
                <Trash2 size={16} className="text-red-600" />
              </button>
            </div>
      )}
    </div>
  )
}
