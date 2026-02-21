'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  UserPlus,
  Trash2,
  Loader2,
  Search,
  Mail,
  Users,
  Send,
} from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
}

/**
 * FriendsPanel — right-side slide-in panel for managing personal friends.
 * Friends can receive reminders in their personal inbox.
 */
export function FriendsPanel({ isOpen, onClose }: Props) {
  const isDark = useThemeStore((s) => s.isDark)
  const { friends, fetchFriends, addFriend, removeFriend } = useWorkspaceStore()

  const [email, setEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fetch friends when panel opens
  useEffect(() => {
    if (isOpen) fetchFriends()
  }, [isOpen, fetchFriends])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  const handleAdd = async () => {
    if (!email.trim()) return
    setIsAdding(true)
    const result = await addFriend(email.trim())
    setIsAdding(false)
    if (result.success) {
      toast.success('Friend request sent')
      setEmail('')
    } else {
      toast.error(result.error || 'Failed to add friend')
    }
  }

  const handleRemove = async (friendId: string) => {
    setRemovingId(friendId)
    await removeFriend(friendId)
    setRemovingId(null)
    toast.success('Friend removed')
  }

  // Filter friends by search
  const filteredFriends = friends.filter((f) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const fullName = `${f.firstName || ''} ${f.lastName || ''}`.toLowerCase()
    return fullName.includes(q) || f.email.toLowerCase().includes(q) || (f.nickname || '').toLowerCase().includes(q)
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[60]"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 w-96 z-[65] flex flex-col shadow-2xl border-l ${
              isDark
                ? 'bg-zinc-800/95 border-zinc-700/50'
                : 'bg-white/95 border-zinc-200/50'
            } backdrop-blur-xl`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${
                isDark ? 'border-zinc-700' : 'border-zinc-200'
              }`}
            >
              <div>
                <h3
                  className={`font-semibold text-base ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  Friends
                </h3>
                <p
                  className={`text-xs mt-0.5 ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Send reminders to your friends&apos; personal inbox
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-zinc-700 text-zinc-400'
                    : 'hover:bg-zinc-100 text-zinc-500'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Add friend section */}
            <div
              className={`px-5 py-4 border-b ${
                isDark ? 'border-zinc-700/50' : 'border-zinc-200/50'
              }`}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail
                    size={14}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Add friend by email..."
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !email.trim()}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-white text-black hover:bg-zinc-200 disabled:opacity-40'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40'
                  }`}
                >
                  {isAdding ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  Add
                </button>
              </div>
            </div>

            {/* Search */}
            {friends.length > 0 && (
              <div className="px-5 py-3">
                <div className="relative">
                  <Search
                    size={14}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${
                      isDark
                        ? 'bg-zinc-900/50 text-white placeholder:text-zinc-500'
                        : 'bg-zinc-50 text-zinc-900 placeholder:text-zinc-400'
                    } focus:outline-none`}
                  />
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                  isDark ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Friends ({filteredFriends.length})
              </p>
              <div className="space-y-1">
                {filteredFriends.map((f) => (
                  <div
                    key={f._id}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isDark ? 'hover:bg-zinc-700/50' : 'hover:bg-zinc-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                        isDark
                          ? 'bg-violet-500/15 text-violet-400'
                          : 'bg-violet-100 text-violet-600'
                      }`}
                    >
                      {f.image ? (
                        <img
                          src={f.image}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        (f.firstName?.[0] || f.email[0]).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isDark ? 'text-zinc-200' : 'text-zinc-900'
                        }`}
                      >
                        {f.nickname || `${f.firstName} ${f.lastName}`.trim() || f.email}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          isDark ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        {f.email}
                      </p>
                      {f.status === 'pending' && (
                        <span className={`inline-block text-[10px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full ${
                          isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600'
                        }`}>
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(f._id)}
                      disabled={removingId === f._id}
                      className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                        isDark
                          ? 'text-zinc-500 hover:text-red-400 hover:bg-red-900/30'
                          : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Remove friend"
                    >
                      {removingId === f._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                ))}

                {filteredFriends.length === 0 && !searchQuery && (
                  <div
                    className={`text-center py-8 ${
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    <Users size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No friends added yet</p>
                    <p className="text-xs mt-0.5">
                      Add friends by email to send them reminders
                    </p>
                  </div>
                )}

                {filteredFriends.length === 0 && searchQuery && (
                  <p
                    className={`text-center text-sm py-6 ${
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    No friends matching &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
