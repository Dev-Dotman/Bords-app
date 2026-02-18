import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Share2, User, ChevronRight, Palette, Layout, LogOut, Minimize2, Maximize2 } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useThemeStore, THEME_COLORS } from '../store/themeStore'
import { useGridStore } from '../store/gridStore'
import { create } from 'zustand'
import { BoardsPanel } from './BoardsPanel'
import { useBoardStore } from '../store/boardStore'
import { usePresentationStore } from '../store/presentationStore'

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
  const { data: session } = useSession()
  const { isDark, toggleDark, colorTheme, setColorTheme } = useThemeStore()
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBoardsTooltip, setShowBoardsTooltip] = useState(false)
  const [showThemeTooltip, setShowThemeTooltip] = useState(false)
  const [showPresentationTooltip, setShowPresentationTooltip] = useState(false)
  const setGridColor = useGridStore((state) => state.setGridColor)
  const gridColor = useGridStore((state) => state.gridColor)
  const [customGridColor, setCustomGridColor] = useState(gridColor)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const currentBoard = useBoardStore((state) => 
    state.boards.find(board => board.id === state.currentBoardId)
  )
  const { isBoardsPanelOpen, toggleBoardsPanel, clearUserData } = useBoardStore()
  const { isPresentationMode, togglePresentationMode } = usePresentationStore()

  const handleLogout = async () => {
    clearUserData() // Clear user-specific data before signing out
    await signOut({ callbackUrl: '/login' })
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

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
          {/* BORDS Logo - Clickable */}
          {!isPresentationMode ? (
            <button 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => useBoardStore.getState().setBoardsPanelOpen(true)}
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center p-1.5">
                <img src="/bordclear.png" alt="BORDS" className="w-full h-full object-contain" />
              </div>
              <span className={`text-lg font-bold brand-font tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                BORDS
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center p-1.5">
                <img src="/bordclear.png" alt="BORDS" className="w-full h-full object-contain" />
              </div>
              <span className={`text-lg font-bold brand-font tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                BORDS
              </span>
            </div>
          )}

          {!isPresentationMode && (
            <>
              <div className={`w-px h-5 ${isDark ? 'bg-zinc-700/75' : 'bg-zinc-200/75'} mx-1`} />

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors
                    ${isDark 
                      ? 'hover:bg-zinc-700/50' 
                      : 'hover:bg-zinc-100'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${isDark 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black'}`}>
                    {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-medium leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {session?.user?.name || 'User'}
                    </span>
                    <span className={`text-xs leading-tight ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {session?.user?.email}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-90' : ''} ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
                </button>

                {showUserMenu && (
                  <div
                    className={`absolute top-full left-0 mt-2 w-64 rounded-xl border shadow-xl overflow-hidden z-50
                      ${isDark 
                        ? 'bg-zinc-800 border-zinc-700' 
                        : 'bg-white border-zinc-200'}`}
                  >
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                          ${isDark 
                            ? 'bg-black text-white' 
                            : 'bg-white text-black'}`}>
                          {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {session?.user?.name || 'User'}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {session?.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors
                          ${isDark 
                            ? 'text-zinc-300 hover:bg-zinc-700/50' 
                            : 'text-gray-700 hover:bg-zinc-100'}`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={`w-px h-5 ${isDark ? 'bg-zinc-700/75' : 'bg-zinc-200/75'} mx-1`} />

              <button
                onClick={toggleDark}
                onMouseEnter={() => setShowThemeTooltip(true)}
                onMouseLeave={() => setShowThemeTooltip(false)}
                className={`relative p-1.5 rounded-lg transition-colors
                  ${isDark 
                    ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200' 
                    : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
              >
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
                {/* Tooltip */}
                <div className={`
                  absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap
                  ${isDark ? 'bg-zinc-700' : 'bg-zinc-800'} text-white px-3 py-1.5 rounded-lg
                  text-xs font-medium transition-all duration-200 pointer-events-none shadow-lg
                  ${showThemeTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}>
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </div>
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
            </>
          )}

          <div className={`w-px h-5 ${isDark ? 'bg-zinc-700/75' : 'bg-zinc-200/75'} mx-1`} />

          {/* Presentation Mode Toggle */}
          <button
            onClick={togglePresentationMode}
            onMouseEnter={() => setShowPresentationTooltip(true)}
            onMouseLeave={() => setShowPresentationTooltip(false)}
            className={`relative p-1.5 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200' 
                : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
          >
            {isPresentationMode ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
            {/* Tooltip */}
            <div className={`
              absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap
              ${isDark ? 'bg-zinc-700' : 'bg-zinc-800'} text-white px-3 py-1.5 rounded-lg
              text-xs font-medium transition-all duration-200 pointer-events-none shadow-lg
              ${showPresentationTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}>
              {isPresentationMode ? 'Exit Presentation' : 'Presentation Mode'}
            </div>
          </button>
        </div>

        {/* Board name - inline on small screens */}
        {!isPresentationMode && currentBoard && (
          <div
            className={`hidden max-[1200px]:flex items-center px-4 py-2 rounded-xl border shadow-lg backdrop-blur-xl
              ${isDark
                ? 'bg-zinc-800/70 border-zinc-700/50'
                : 'bg-white/70 border-zinc-200/50'}`}
          >
            <h1
              className={`text-sm font-semibold tracking-tight truncate max-w-[150px]
                ${isDark ? 'text-white' : 'text-zinc-900'}`}
            >
              {currentBoard.name}
            </h1>
          </div>
        )}
      </div>

      {/* Boards Panel */}
      {!isPresentationMode && (
        <BoardsPanel 
          isOpen={isBoardsPanelOpen} 
          onClose={() => useBoardStore.getState().setBoardsPanelOpen(false)} 
        />
      )}

      {/* Right side controls - Adjusted spacing for connect button */}
      {!isPresentationMode && (
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
              {/* <div className="mb-4">
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
              </div> */}

              <div>
                <h3 className="text-sm font-medium mb-2 dark:text-white text-gray-800">Grid Colors</h3>
                
                {/* Custom Grid Color Picker */}
                <div className={`mb-3 p-3 rounded-lg border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                  <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Custom Grid Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customGridColor}
                      onChange={(e) => {
                        setCustomGridColor(e.target.value)
                        setGridColor(e.target.value)
                      }}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-zinc-300 dark:border-zinc-600"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={customGridColor}
                        onChange={(e) => {
                          setCustomGridColor(e.target.value)
                          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                            setGridColor(e.target.value)
                          }
                        }}
                        placeholder="#000000"
                        className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white'
                            : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Grid Colors */}
                <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Quick Presets
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(isDark ? THEME_COLORS.gridColors.dark : THEME_COLORS.gridColors.light)
                    .map(([name, { value, label }]) => (
                      <button
                        key={name}
                        onClick={() => {
                          setGridColor(value)
                          setCustomGridColor(value)
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
      )}
    </>
  )
}

