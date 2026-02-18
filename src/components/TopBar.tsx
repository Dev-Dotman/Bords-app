import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Share2, User, ChevronRight, Palette, Layout, LogOut, Minimize2, Maximize2, Building2, Cloud, CloudOff, Loader2, Trash2, Inbox } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useThemeStore, THEME_COLORS } from '../store/themeStore'
import { useGridStore } from '../store/gridStore'
import { create } from 'zustand'
import { BoardsPanel } from './BoardsPanel'
import { useBoardStore } from '../store/boardStore'
import { usePresentationStore } from '../store/presentationStore'
import { PublishButton } from './delegation/PublishButton'
import { ActivitySidebar } from './delegation/ActivitySidebar'
import { OrgManager } from './delegation/OrgManager'
import { useBoardSyncStore } from '../store/boardSyncStore'
import { ShareModal } from './BoardSyncControls'

/** Small badge showing pending tasks assigned TO the current user (employee inbox) */
function InboxBadge() {
  const [pendingCount, setPendingCount] = useState(0)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    let cancelled = false

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/execution/tasks')
        if (!res.ok || cancelled) return
        const data = await res.json()
        const groups = data.tasksByOrganization || []
        const count = groups.reduce(
          (sum: number, g: any) => sum + g.tasks.filter((t: any) => t.status === 'assigned').length,
          0
        )
        if (!cancelled) setPendingCount(count)
      } catch { /* silent */ }
    }

    fetchCount()
    // Re-check every 60s
    const interval = setInterval(fetchCount, 60_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session?.user])

  if (pendingCount === 0) return null
  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-blue-500 text-white ring-2 ring-white dark:ring-zinc-800">
      {pendingCount > 9 ? '9+' : pendingCount}
    </span>
  )
}

const profileItems: any[] = []

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
  const router = useRouter()
  const { isDark, toggleDark, colorTheme, setColorTheme } = useThemeStore()
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showOrgManager, setShowOrgManager] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showBoardsTooltip, setShowBoardsTooltip] = useState(false)
  const [showThemeTooltip, setShowThemeTooltip] = useState(false)
  const [showPresentationTooltip, setShowPresentationTooltip] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const setGridColor = useGridStore((state) => state.setGridColor)
  const gridColor = useGridStore((state) => state.gridColor)
  const [customGridColor, setCustomGridColor] = useState(gridColor)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const currentBoard = useBoardStore((state) => 
    state.boards.find(board => board.id === state.currentBoardId)
  )
  const { isBoardsPanelOpen, toggleBoardsPanel, clearUserData, deleteBoard } = useBoardStore()
  const { isPresentationMode, togglePresentationMode } = usePresentationStore()
  const { isSyncing, lastSyncedAt, dirtyBoards, syncBoardToCloud } = useBoardSyncStore()
  const currentBoardId = useBoardStore(s => s.currentBoardId)

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
                onClick={() => {
                  setShowThemeTooltip(false)
                  toggleDark()
                }}
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

              {profileItems.map((item: any) => (
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

              {/* Cloud Sync Button */}
              {currentBoardId && currentBoard && (
                <button
                  onClick={() => syncBoardToCloud(currentBoardId)}
                  disabled={isSyncing}
                  className={`relative p-1.5 rounded-lg transition-colors
                    ${lastSyncedAt[currentBoardId]
                      ? dirtyBoards.has(currentBoardId)
                        ? 'text-amber-500 hover:text-amber-400'
                        : 'text-green-500 hover:text-green-400'
                      : isDark
                        ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                        : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
                  title={isSyncing
                    ? 'Syncing...'
                    : dirtyBoards.has(currentBoardId)
                      ? 'Unsaved changes — Click to sync now'
                      : lastSyncedAt[currentBoardId]
                        ? `Synced ${new Date(lastSyncedAt[currentBoardId]).toLocaleString()} — Click to sync again`
                        : 'Sync board to cloud'}
                >
                  {isSyncing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : lastSyncedAt[currentBoardId] ? (
                    <Cloud size={20} />
                  ) : (
                    <CloudOff size={20} />
                  )}
                  {/* Dirty indicator dot — pulsing amber when changes are pending */}
                  {dirtyBoards.has(currentBoardId) && !isSyncing && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                  )}
                </button>
              )}

              {/* Share Button */}
              {currentBoardId && currentBoard && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className={`relative p-1.5 rounded-lg transition-colors
                    ${isDark
                      ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                      : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
                  title="Share board"
                >
                  <Share2 size={20} />
                </button>
              )}
            </>
          )}

          <div className={`w-px h-5 ${isDark ? 'bg-zinc-700/75' : 'bg-zinc-200/75'} mx-1`} />

          {/* Presentation Mode Toggle */}
          <button
            onClick={() => {
              setShowPresentationTooltip(false)
              setShowThemeTooltip(false)
              setShowBoardsTooltip(false)
              togglePresentationMode()
            }}
            onMouseEnter={() => setShowPresentationTooltip(true)}
            onMouseLeave={() => setShowPresentationTooltip(false)}
            className={`relative p-1.5 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200' 
                : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
          >
            {isPresentationMode ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
            {/* Tooltip */}
            {!isPresentationMode && (
              <div className={`
                absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap
                ${isDark ? 'bg-zinc-700' : 'bg-zinc-800'} text-white px-3 py-1.5 rounded-lg
                text-xs font-medium transition-all duration-200 pointer-events-none shadow-lg
                ${showPresentationTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              `}>
                Presentation Mode
              </div>
            )}
          </button>
        </div>

        {/* Board name + delete - always inline next to controls */}
        {currentBoard && (
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border shadow-lg backdrop-blur-xl
              ${isDark
                ? 'bg-zinc-800/70 border-zinc-700/50'
                : 'bg-white/70 border-zinc-200/50'}`}
          >
            <h1
              className={`text-sm font-semibold tracking-tight truncate max-w-[200px]
                ${isDark ? 'text-white' : 'text-zinc-900'}`}
            >
              {currentBoard.name}
            </h1>
            {!isPresentationMode && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`p-1 rounded-md transition-colors flex-shrink-0 ${
                  isDark ? 'hover:bg-red-500/20 text-zinc-500 hover:text-red-400' : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                }`}
                title="Delete board"
              >
                <Trash2 size={13} />
              </button>
            )}
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

          {/* Delegation controls */}
          <PublishButton />
          <ActivitySidebar />
          <button
            onClick={() => router.push('/inbox')}
            className={`relative p-2 rounded-lg shadow-lg backdrop-blur-sm border
              ${isDark 
                ? 'bg-zinc-800/90 border-zinc-700/50 text-zinc-400 hover:text-zinc-200' 
                : 'bg-white/90 border-zinc-200/50 text-zinc-600 hover:text-zinc-900'}
              transition-colors`}
            title="Execution Inbox"
          >
            <Inbox size={20} />
            <InboxBadge />
          </button>
          <button
            onClick={() => setShowOrgManager(true)}
            className={`p-2 rounded-lg shadow-lg backdrop-blur-sm border
              ${isDark 
                ? 'bg-zinc-800/90 border-zinc-700/50 text-zinc-400 hover:text-zinc-200' 
                : 'bg-white/90 border-zinc-200/50 text-zinc-600 hover:text-zinc-900'}
              transition-colors`}
            title="Organization Manager"
          >
            <Building2 size={20} />
          </button>

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

      {/* Organization Manager Modal */}
      <OrgManager isOpen={showOrgManager} onClose={() => setShowOrgManager(false)} />

      {/* Share Modal */}
      {showShareModal && currentBoardId && currentBoard && (
        <ShareModal
          localBoardId={currentBoardId}
          boardName={currentBoard.name}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Delete Board Confirmation */}
      {showDeleteConfirm && currentBoard && currentBoardId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className={`p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
              isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Delete Board?
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  This will permanently delete <span className="font-semibold">"{currentBoard.name}"</span> and all its items. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowDeleteConfirm(false)
                  // Delete from cloud (awaited), then delete locally
                  await useBoardSyncStore.getState().deleteBoardFromCloud(currentBoardId)
                  deleteBoard(currentBoardId)
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete Board
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

