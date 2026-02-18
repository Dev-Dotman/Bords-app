'use client'

import { useState, useEffect, useRef } from 'react'
import { Cloud, CloudOff, Loader2, Globe, Lock, Link2, Copy, Check, X, Download, Upload } from 'lucide-react'
import { useBoardSyncStore, ShareEntry } from '../store/boardSyncStore'
import { useThemeStore } from '../store/themeStore'
import { toast } from 'react-hot-toast'

/* ─────────────── Sync Button (per board, inline) ─────────────── */

export function SyncButton({ localBoardId, boardName }: { localBoardId: string; boardName: string }) {
  const isDark = useThemeStore(s => s.isDark)
  const { isSyncing, lastSyncedAt, syncBoardToCloud, loadBoardFromCloud } = useBoardSyncStore()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const lastSync = lastSyncedAt[localBoardId]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
        className={`p-1.5 rounded-lg transition-colors ${
          lastSync
            ? 'text-green-500 hover:bg-green-100/20'
            : isDark ? 'text-zinc-500 hover:bg-zinc-700' : 'text-gray-400 hover:bg-gray-100'
        }`}
        title={lastSync ? `Last synced: ${new Date(lastSync).toLocaleString()}` : 'Sync to cloud'}
      >
        {isSyncing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : lastSync ? (
          <Cloud size={14} />
        ) : (
          <CloudOff size={14} />
        )}
      </button>

      {showMenu && (
        <div
          className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-xl border z-[100] 
            ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={async () => { setShowMenu(false); await syncBoardToCloud(localBoardId) }}
            disabled={isSyncing}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-t-xl transition-colors ${
              isDark ? 'hover:bg-zinc-700 text-white' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Upload size={14} /> Save to Cloud
          </button>
          <button
            onClick={async () => { setShowMenu(false); await loadBoardFromCloud(localBoardId) }}
            disabled={isSyncing}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              isDark ? 'hover:bg-zinc-700 text-white' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Download size={14} /> Load from Cloud
          </button>
          {lastSync && (
            <div className={`px-3 py-1.5 text-[10px] border-t ${isDark ? 'text-zinc-500 border-zinc-700' : 'text-gray-400 border-gray-100'}`}>
              Synced {new Date(lastSync).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────── Share Modal ─────────────── */

interface ShareModalProps {
  localBoardId: string
  boardName: string
  onClose: () => void
}

export function ShareModal({ localBoardId, boardName, onClose }: ShareModalProps) {
  const isDark = useThemeStore(s => s.isDark)
  const {
    getShareSettings, updateVisibility, addShareUser,
    removeShareUser, updateSharePermission, syncBoardToCloud,
  } = useBoardSyncStore()

  const [loading, setLoading] = useState(true)
  const [visibility, setVisibility] = useState<'private' | 'public' | 'shared'>('private')
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [needsSync, setNeedsSync] = useState(false)
  const [changingVisibility, setChangingVisibility] = useState<string | null>(null)

  // Load settings
  useEffect(() => {
    (async () => {
      setLoading(true)
      const data = await getShareSettings(localBoardId)
      if (data) {
        setVisibility(data.visibility as 'private' | 'public' | 'shared')
        setShareToken(data.shareToken)
        setNeedsSync(false)
      } else {
        // Board not synced yet
        setNeedsSync(true)
      }
      setLoading(false)
    })()
  }, [localBoardId])

  const handleVisibilityChange = async (v: 'private' | 'public' | 'shared') => {
    if (v === visibility) return
    setChangingVisibility(v)
    try {
      await updateVisibility(localBoardId, v)
      const fresh = await getShareSettings(localBoardId)
      if (fresh) {
        setVisibility(fresh.visibility as any)
        setShareToken(fresh.shareToken)
      }
    } finally {
      setChangingVisibility(null)
    }
  }

  const handleCopyLink = () => {
    if (!shareToken) return
    const url = `${window.location.origin}/shared/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSyncFirst = async () => {
    await syncBoardToCloud(localBoardId)
    const fresh = await getShareSettings(localBoardId)
    if (fresh) {
      setVisibility(fresh.visibility as any)
      setShareToken(fresh.shareToken)
      setNeedsSync(false)
    }
  }

  const visOptions = [
    { value: 'private', icon: Lock, label: 'Private', desc: 'Only you can access' },
    { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone with the link' },
  ] as const

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl border ${
          isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-inherit">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Share "{boardName}"
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/10">
            <X size={18} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : needsSync ? (
            <div className="text-center py-6">
              <CloudOff size={32} className={`mx-auto mb-2 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
              <p className={`text-sm mb-3 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Sync this board to the cloud first to enable sharing
              </p>
              <button
                onClick={handleSyncFirst}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Cloud size={14} className="inline mr-1.5 -mt-0.5" />
                Sync to Cloud
              </button>
            </div>
          ) : (
            <>
              {/* Visibility selector */}
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {visOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleVisibilityChange(opt.value)}
                      disabled={changingVisibility !== null}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all ${
                        changingVisibility !== null ? 'opacity-60 cursor-wait' : ''
                      } ${
                        visibility === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                          : isDark
                            ? 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                            : 'border-gray-200 hover:border-gray-300 text-gray-500'
                      }`}
                    >
                      {changingVisibility === opt.value ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <opt.icon size={16} />
                      )}
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Public link */}
              {visibility === 'public' && shareToken && (
                <div>
                  <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Public Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 p-2 rounded-lg text-xs truncate ${
                      isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {window.location.origin}/shared/{shareToken}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}


            </>
          )}
        </div>
      </div>
    </div>
  )
}
