'use client'

import { useState } from 'react'
import { X, Building2, Loader2 } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useOrganizationStore } from '@/store/organizationStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { motion } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
}

/**
 * CreateOrgModal — Focused modal for creating a new organization.
 * After creation it refreshes both the org store and workspace store,
 * then auto-switches context to the new org.
 */
export function CreateOrgModal({ isOpen, onClose }: Props) {
  const isDark = useThemeStore((s) => s.isDark)
  const { createOrganization, isLoading } = useOrganizationStore()
  const { fetchWorkspaces, switchToOrganization } = useWorkspaceStore()

  const [name, setName] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!name.trim()) return
    setError('')
    const org = await createOrganization(name.trim())
    if (org) {
      setName('')
      // Refresh workspaces so the new org appears in the switcher
      await fetchWorkspaces()
      // Auto-switch to the new organization
      switchToOrganization(org._id, org.name)
      onClose()
    } else {
      setError(useOrganizationStore.getState().error || 'Failed to create organization')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl border overflow-hidden ${
          isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-zinc-700' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
              <Building2 size={18} className={isDark ? 'text-zinc-300' : 'text-zinc-600'} />
            </div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              New Organization
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Organization Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Inc."
              autoFocus
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                isDark
                  ? 'bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-zinc-500'
                  : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Organizations let you delegate tasks, manage teams, and collaborate on boards.
            You&apos;ll be the owner and can invite team members after creation.
          </p>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 flex gap-3 justify-end border-t ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'text-zinc-400 hover:bg-zinc-700' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              isDark
                ? 'bg-white text-black hover:bg-zinc-200 disabled:opacity-40'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40'
            }`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Create Organization
          </button>
        </div>
      </motion.div>
    </div>
  )
}
