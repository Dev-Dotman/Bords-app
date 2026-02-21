'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, Loader2 } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { toast } from 'react-hot-toast'

/**
 * FriendsManager — manage personal workspace friends.
 * Friends can receive personal reminders (inbox only, no canvas access).
 */
export function FriendsManager({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const isDark = useThemeStore(s => s.isDark)
  const { friends, fetchFriends, addFriend, removeFriend } = useWorkspaceStore()

  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (isOpen) fetchFriends()
  }, [isOpen, fetchFriends])

  if (!isOpen) return null

  const handleAdd = async () => {
    if (!email.trim()) return
    setIsAdding(true)
    const result = await addFriend(email.trim(), nickname.trim() || undefined)
    setIsAdding(false)
    if (result.success) {
      toast.success('Friend added')
      setEmail('')
      setNickname('')
    } else {
      toast.error(result.error || 'Failed to add friend')
    }
  }

  const handleRemove = async (friendId: string) => {
    await removeFriend(friendId)
    toast.success('Friend removed')
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md mx-4 rounded-2xl border shadow-2xl max-h-[80vh] flex flex-col ${
          isDark ? 'bg-zinc-800 border-zinc-700/50' : 'bg-white border-zinc-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
          <h3
            className={`text-base font-semibold ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}
          >
            Friends
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Add friend form */}
        <div className="px-5 py-3 space-y-2 border-b border-inherit">
          <p
            className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
          >
            Friends receive reminders in their inbox. They cannot access your
            canvas.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className={`flex-1 px-3 py-2 rounded-xl text-sm border outline-none ${
                isDark
                  ? 'bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500'
                  : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
              }`}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={isAdding || !email.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
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

        {/* Friend list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {friends.length === 0 ? (
            <p
              className={`text-sm text-center py-6 ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              No friends added yet
            </p>
          ) : (
            friends.map(f => (
              <div
                key={f._id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-zinc-700/40' : 'hover:bg-zinc-50'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-100 text-blue-600'
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
                      isDark ? 'text-zinc-200' : 'text-zinc-800'
                    }`}
                  >
                    {f.nickname ||
                      `${f.firstName} ${f.lastName}`.trim() ||
                      f.email}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    {f.email}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(f._id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark
                      ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-700'
                      : 'text-zinc-400 hover:text-red-500 hover:bg-zinc-100'
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
