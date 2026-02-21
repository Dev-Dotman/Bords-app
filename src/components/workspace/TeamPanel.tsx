'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Users,
  Mail,
  Trash2,
  Plus,
  Loader2,
  Search,
  UserPlus,
  Shield,
} from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useOrganizationStore } from '@/store/organizationStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
}

/**
 * TeamPanel — right-side slide-in panel for managing the
 * active organization's employees and invitations.
 * Only visible when an organization is the active context.
 */
export function TeamPanel({ isOpen, onClose }: Props) {
  const isDark = useThemeStore((s) => s.isDark)
  const activeContext = useWorkspaceStore((s) => s.activeContext)
  const {
    employees,
    pendingInvitations,
    isLoading,
    error,
    fetchEmployees,
    inviteEmployee,
    removeEmployee,
    revokeInvitation,
    isOwnerOfCurrentOrg,
  } = useOrganizationStore()

  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [localError, setLocalError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  const orgId =
    activeContext?.type === 'organization' ? activeContext.organizationId : null
  const orgName =
    activeContext?.type === 'organization' ? activeContext.organizationName : ''

  // Fetch employees when panel opens or org changes
  useEffect(() => {
    if (isOpen && orgId) {
      fetchEmployees(orgId)
    }
  }, [isOpen, orgId])

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

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgId) return
    setIsInviting(true)
    setLocalError('')
    const success = await inviteEmployee(orgId, inviteEmail.trim())
    if (success) {
      setInviteEmail('')
    } else {
      setLocalError(
        useOrganizationStore.getState().error || 'Failed to invite'
      )
    }
    setIsInviting(false)
  }

  // Filter employees by search
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const fullName =
      `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.toLowerCase()
    return (
      fullName.includes(q) || (emp.user?.email || '').toLowerCase().includes(q)
    )
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
                  Team
                </h3>
                <p
                  className={`text-xs mt-0.5 ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  {orgName}
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

            {/* Invite section — only for org owner */}
            {isOwnerOfCurrentOrg && (
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
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Invite by email..."
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    />
                  </div>
                  <button
                    onClick={handleInvite}
                    disabled={isInviting || !inviteEmail.trim()}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                      isDark
                        ? 'bg-white text-black hover:bg-zinc-200 disabled:opacity-40'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40'
                  }`}
                >
                  {isInviting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  Invite
                </button>
              </div>
              {(localError || error) && (
                <p className="text-xs text-red-500 mt-2">{localError || error}</p>
              )}
              </div>
            )}

            {/* Search */}
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
                  placeholder="Search team members..."
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${
                    isDark
                      ? 'bg-zinc-900/50 text-white placeholder:text-zinc-500'
                      : 'bg-zinc-50 text-zinc-900 placeholder:text-zinc-400'
                  } focus:outline-none`}
                />
              </div>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    size={20}
                    className="animate-spin text-zinc-400"
                  />
                </div>
              ) : (
                <>
                  {/* Active members */}
                  <div className="mb-1">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                        isDark ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    >
                      Members ({filteredEmployees.length})
                    </p>
                    <div className="space-y-1">
                      {filteredEmployees.map((emp) => (
                        <div
                          key={emp._id}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                            isDark
                              ? 'hover:bg-zinc-700/50'
                              : 'hover:bg-zinc-50'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                              isDark
                                ? 'bg-zinc-700 text-white'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {emp.user?.firstName?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isDark ? 'text-zinc-200' : 'text-zinc-900'
                              }`}
                            >
                              {emp.user?.firstName} {emp.user?.lastName}
                            </p>
                            <p
                              className={`text-xs truncate ${
                                isDark ? 'text-zinc-500' : 'text-zinc-400'
                              }`}
                            >
                              {emp.user?.email}
                            </p>
                          </div>
                          {isOwnerOfCurrentOrg && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${emp.user?.firstName || 'this member'} from the team?`)) {
                                  removeEmployee(orgId!, emp._id)
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                isDark
                                  ? 'hover:bg-red-900/30 text-zinc-500 hover:text-red-400'
                                  : 'hover:bg-red-50 text-zinc-400 hover:text-red-600'
                              }`}
                              title="Remove member"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      {filteredEmployees.length === 0 && !searchQuery && (
                        <div
                          className={`text-center py-8 ${
                            isDark ? 'text-zinc-500' : 'text-zinc-400'
                          }`}
                        >
                          <Users
                            size={28}
                            className="mx-auto mb-2 opacity-50"
                          />
                          <p className="text-sm">No team members yet</p>
                          <p className="text-xs mt-0.5">
                            Invite people by email above
                          </p>
                        </div>
                      )}

                      {filteredEmployees.length === 0 && searchQuery && (
                        <p
                          className={`text-center text-sm py-6 ${
                            isDark ? 'text-zinc-500' : 'text-zinc-400'
                          }`}
                        >
                          No members matching &quot;{searchQuery}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pending invitations */}
                  {pendingInvitations.length > 0 && (
                    <div className="mt-4">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                          isDark ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        Pending Invitations ({pendingInvitations.length})
                      </p>
                      <div className="space-y-1">
                        {pendingInvitations.map((inv) => (
                          <div
                            key={inv._id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-70 ${
                              isDark
                                ? 'bg-zinc-900/30'
                                : 'bg-zinc-50'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isDark
                                  ? 'bg-zinc-700 text-zinc-400'
                                  : 'bg-zinc-200 text-zinc-500'
                              }`}
                            >
                              <Mail size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm truncate ${
                                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                                }`}
                              >
                                {inv.email}
                              </p>
                              <p
                                className={`text-xs ${
                                  isDark ? 'text-zinc-600' : 'text-zinc-400'
                                }`}
                              >
                                Invitation pending
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                revokeInvitation(orgId!, inv._id)
                              }
                              title="Revoke invitation"
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark
                                  ? 'hover:bg-red-900/30 text-zinc-500 hover:text-red-400'
                                  : 'hover:bg-red-50 text-zinc-400 hover:text-red-600'
                              }`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
