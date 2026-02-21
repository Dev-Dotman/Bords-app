'use client'

import { useState, useEffect } from 'react'
import { X, User as UserIcon, Send, Loader2 } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useWorkspaceStore   } from '../../store/workspaceStore'
import { toast } from 'react-hot-toast'

interface PersonalAssignModalProps {
  isOpen: boolean
  onClose: () => void
  sourceType: 'note' | 'checklist_item' | 'kanban_task'
  sourceId: string
  content: string
  boardLocalId?: string
}

/**
 * PersonalAssignModal — for sending personal reminders.
 *
 * Personal mode: no draft, no publish. Writes immediately.
 * Can assign to self or to a friend.
 */
export function PersonalAssignModal({
  isOpen,
  onClose,
  sourceType,
  sourceId,
  content,
  boardLocalId,
}: PersonalAssignModalProps) {
  const isDark = useThemeStore(s => s.isDark)
  const { friends, fetchFriends } = useWorkspaceStore()

  const [selectedRecipient, setSelectedRecipient] = useState<string>('self')
  const [dueDate, setDueDate] = useState('')
  const [executionNote, setExecutionNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchFriends()
      setSelectedRecipient('self')
      setDueDate('')
      setExecutionNote('')
    }
  }, [isOpen, fetchFriends])

  if (!isOpen) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/personal/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          sourceId,
          content,
          assignedTo: selectedRecipient === 'self' ? undefined : selectedRecipient,
          dueDate: dueDate || undefined,
          executionNote: executionNote || undefined,
          boardLocalId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create reminder')
      }

      toast.success(
        selectedRecipient === 'self' ? 'Self-reminder created' : 'Reminder sent'
      )
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md mx-4 rounded-2xl border shadow-2xl ${
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
            Create Personal Reminder
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

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Content preview */}
          <div>
            <label
              className={`text-xs font-medium mb-1 block ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Task
            </label>
            <p
              className={`text-sm p-3 rounded-xl line-clamp-3 ${
                isDark
                  ? 'bg-zinc-700/50 text-zinc-200'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {content}
            </p>
          </div>

          {/* Recipient */}
          <div>
            <label
              className={`text-xs font-medium mb-1 block ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Send To
            </label>
            <select
              value={selectedRecipient}
              onChange={e => setSelectedRecipient(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                isDark
                  ? 'bg-zinc-700/50 border-zinc-600 text-white'
                  : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            >
              <option value="self">Myself</option>
              {friends.map(f => (
                <option key={f._id} value={f.userId}>
                  {f.nickname || `${f.firstName} ${f.lastName}`.trim()} ({f.email})
                </option>
              ))}
            </select>
          </div>

          {/* Due date (optional) */}
          <div>
            <label
              className={`text-xs font-medium mb-1 block ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Due Date <span className="opacity-50">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                isDark
                  ? 'bg-zinc-700/50 border-zinc-600 text-white'
                  : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            />
          </div>

          {/* Note (optional) */}
          <div>
            <label
              className={`text-xs font-medium mb-1 block ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Note <span className="opacity-50">(optional)</span>
            </label>
            <textarea
              value={executionNote}
              onChange={e => setExecutionNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none transition-colors ${
                isDark
                  ? 'bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500'
                  : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-inherit">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-zinc-700'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {selectedRecipient === 'self' ? 'Set Reminder' : 'Send Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}
