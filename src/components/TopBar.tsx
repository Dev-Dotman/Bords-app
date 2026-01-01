import { useState } from 'react'
import { Moon, Sun, Share2, User, ChevronRight, Palette, Layout } from 'lucide-react'
import { useThemeStore, THEME_COLORS } from '../store/themeStore'
import { useGridStore } from '../store/gridStore'
import { create } from 'zustand'
import { BoardsPanel } from './BoardsPanel'
import { useBoardStore } from '../store/boardStore'

const profileItems = [
  { id: 'visibility', icon: Share2, label: "Visibility", description: "Public/Private board" },
]

const GRID_COLORS = {
  gray: '#333333',
  blue: '#1e3a8a',
  green: '#064e3b',
  purple: '#4c1d95',
  pink: '#831843',
  orange: '#7c2d12',
} as const

export function TopBar() {
  const { isDark, toggleDark, colorTheme, setColorTheme } = useThemeStore()
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const setGridColor = useGridStore((state) => state.setGridColor)
  const [showBoardsPanel, setShowBoardsPanel] = useState(false)
  const currentBoard = useBoardStore((state) => 
    state.boards.find(board => board.id === state.currentBoardId)
  )

  return (
    <>
      {/* Left side controls */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-lg
          ${isDark 
            ? 'bg-zinc-800/90 border-zinc-700/50' 
            : 'bg-white/90 border-zinc-200/50'} 
          backdrop-blur-xl transition-colors duration-200`}
        >
          <button 
            className="relative group"
            onClick={() => setShowBoardsPanel(true)}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
              <Layout className="w-4 h-4" />
            </div>
          </button>

          <div className={`w-px h-5 ${isDark ? 'bg-zinc-700/75' : 'bg-zinc-200/75'} mx-1`} />

          <span className={`
            text-sm font-medium truncate max-w-[200px]
            ${isDark ? 'text-zinc-300' : 'text-zinc-700'}
          `}>
            {currentBoard?.name || 'Select a board'}
          </span>

          <div className={`w-px h-5 ${isDark ? 'bg-zinc-700/75' : 'bg-zinc-200/75'} mx-1`} />

          <button className="relative group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-white rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
              <ChevronRight className="w-3 h-3 text-zinc-600" />
            </div>
          </button>

          <div className={`w-px h-5 ${isDark ? 'bg-zinc-700/75' : 'bg-zinc-200/75'} mx-1`} />

          <button
            onClick={toggleDark}
            className={`p-1.5 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200' 
                : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {profileItems.map((item) => (
            <button
              key={item.id}
              className={`
                group relative
                transition-all duration-200
                ${hoveredProfile === item.id ? 'scale-110' : 'hover:scale-105'}
              `}
              onMouseEnter={() => setHoveredProfile(item.id)}
              onMouseLeave={() => setHoveredProfile(null)}
            >
              <item.icon 
                className="w-5 h-5 text-zinc-700 group-hover:text-zinc-900 transition-colors"
                strokeWidth={1.5}
              />
              <div className={`
                absolute top-full mt-2 left-0 whitespace-nowrap
                bg-zinc-800 text-white px-2 py-1 rounded-md
                text-xs transition-all duration-200 pointer-events-none
                ${hoveredProfile === item.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              `}>
                <div className="font-medium">{item.label}</div>
                <div className="text-zinc-400 text-[10px]">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Boards Panel */}
      <BoardsPanel 
        isOpen={showBoardsPanel} 
        onClose={() => setShowBoardsPanel(false)} 
      />

      {/* Right side controls - Adjusted spacing for connect button */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`p-2 rounded-lg shadow-lg backdrop-blur-sm border
              ${isDark 
                ? 'bg-zinc-800/90 border-zinc-700/50 text-zinc-400 hover:text-zinc-200' 
                : 'bg-white/90 border-zinc-200/50 text-zinc-600 hover:text-zinc-900'}
              transition-colors`}
          >
            <Palette size={20} />
          </button>

          {/* Color Picker Dropdown */}
          {showColorPicker && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border dark:border-zinc-700 w-[280px]">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Theme Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(THEME_COLORS)
                    .filter(([key]) => key !== 'gridColors')
                    .map(([name, colors]) => (
                      <button
                        key={name}
                        onClick={() => {
                          setColorTheme(name as keyof typeof THEME_COLORS)
                        }}
                        className={`
                          w-12 h-12 rounded-lg transition-all duration-200
                          ${('bg' in colors) ? colors.bg : ''} border ${('border' in colors) ? colors.border : ''}
                          hover:scale-110 hover:shadow-lg
                          ${colorTheme === name ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-800' : ''}
                        `}
                      />
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 dark:text-white text-gray-800">Grid Colors</h3>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(isDark ? THEME_COLORS.gridColors.dark : THEME_COLORS.gridColors.light)
                    .map(([name, { value, label }]) => (
                      <button
                        key={name}
                        onClick={() => {
                          setGridColor(value)
                          setShowColorPicker(false)
                        }}
                        className="group relative"
                      >
                        <div
                          className={`
                            w-8 h-8 rounded-lg transition-transform hover:scale-110
                            ${isDark ? 'border-2 border-white/10' : 'border border-black/10'}
                          `}
                          style={{ backgroundColor: value }}
                        />
                        <span className={`
                          absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] 
                          opacity-0 group-hover:opacity-100 whitespace-nowrap
                          ${isDark ? 'text-white' : 'text-gray-600'}
                        `}>
                          {label}
                        </span>
                      </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

