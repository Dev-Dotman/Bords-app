'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, X, UserPlus, UserMinus, RefreshCw, Building2, CheckCircle2, Loader2, ArrowRight, ArrowUpDown } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useDelegationStore } from '@/store/delegationStore'
import { useOrganizationStore } from '@/store/organizationStore'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const ICON_MAP: Record<string, typeof Bell> = {
  task_assigned: UserPlus,
  task_unassigned: UserMinus,
  task_reassigned: RefreshCw,
  task_completed: Check,
  task_updated: ArrowUpDown,
  org_invitation: Building2,
  invitation_accepted: CheckCircle2,
}

const COLOR_MAP: Record<string, { bg: string; darkBg: string; icon: string }> = {
  task_assigned: { bg: 'bg-blue-100', darkBg: 'bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400' },
  task_unassigned: { bg: 'bg-red-100', darkBg: 'bg-red-900/30', icon: 'text-red-600 dark:text-red-400' },
  task_reassigned: { bg: 'bg-amber-100', darkBg: 'bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400' },
  task_completed: { bg: 'bg-emerald-100', darkBg: 'bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  task_updated: { bg: 'bg-indigo-100', darkBg: 'bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400' },
  org_invitation: { bg: 'bg-purple-100', darkBg: 'bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400' },
  invitation_accepted: { bg: 'bg-emerald-100', darkBg: 'bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400' },
}

export function ActivitySidebar() {
  const isDark = useThemeStore((s) => s.isDark)
  const { notifications, unreadCount, fetchNotifications, markNotificationsRead, acceptInvitation, declineInvitation } =
    useDelegationStore()
  const { fetchOrganizations } = useOrganizationStore()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Poll for notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div ref={panelRef} className="pointer-events-auto relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg shadow-lg backdrop-blur-sm border transition-colors ${
          isDark
            ? 'bg-zinc-800/90 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
            : 'bg-white/90 border-zinc-200/50 text-zinc-600 hover:text-zinc-900'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-red-500 text-white ring-2 ring-white dark:ring-zinc-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 top-full mt-2 w-80 max-h-[70vh] rounded-2xl shadow-2xl border overflow-hidden ${
              isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${
              isDark ? 'border-zinc-700' : 'border-zinc-200'
            }`}>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Activity
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markNotificationsRead()}
                    className={`text-xs font-medium transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1 rounded-lg ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-auto max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className={`p-8 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  No activity yet
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICON_MAP[n.type] || Bell
                  const colors = COLOR_MAP[n.type] || COLOR_MAP.task_assigned
                  const isInvitation = n.type === 'org_invitation' && !n.isRead && !acceptedIds.has(n._id)
                  const isTaskNotification = n.type === 'task_assigned' || n.type === 'task_reassigned'
                  const isCompletedNotification = n.type === 'task_completed'
                  const wasAccepted = acceptedIds.has(n._id)
                  const isAccepting = acceptingId === n._id

                  const handleAccept = async () => {
                    if (!n.metadata?.invitationId) return
                    setAcceptingId(n._id)
                    const result = await acceptInvitation(n.metadata.invitationId)
                    if (result.success) {
                      setAcceptedIds((prev) => new Set(prev).add(n._id))
                      // Refresh orgs so the new org shows up
                      fetchOrganizations()
                    }
                    setAcceptingId(null)
                  }

                  const handleDecline = async () => {
                    await declineInvitation(n._id)
                  }

                  return (
                    <div
                      key={n._id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        !n.isRead
                          ? isDark ? 'bg-zinc-700/30' : 'bg-blue-50/50'
                          : ''
                      } ${isDark ? 'hover:bg-zinc-700/50' : 'hover:bg-zinc-50'}`}
                    >
                      <div className={`p-1.5 rounded-lg mt-0.5 ${isDark ? colors.darkBg : colors.bg}`}>
                        <Icon size={14} className={colors.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                          {n.title}
                        </p>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {n.message}
                        </p>

                        {/* CTA for org invitations */}
                        {isInvitation && !wasAccepted && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={handleAccept}
                              disabled={isAccepting}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                isAccepting
                                  ? 'opacity-60 cursor-not-allowed'
                                  : ''
                              } bg-emerald-500 hover:bg-emerald-600 text-white`}
                            >
                              {isAccepting ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              {isAccepting ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              onClick={handleDecline}
                              disabled={isAccepting}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isDark
                                  ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                              }`}
                            >
                              <X size={12} />
                              Decline
                            </button>
                          </div>
                        )}

                        {/* Success after accepting */}
                        {wasAccepted && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-500">
                              Joined {n.metadata?.organizationName || 'organization'}
                            </span>
                          </div>
                        )}

                        {/* CTA for task assigned/reassigned */}
                        {isTaskNotification && !n.isRead && (
                          <button
                            onClick={() => {
                              markNotificationsRead([n._id])
                              router.push('/inbox')
                            }}
                            className={`flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-blue-500 hover:bg-blue-600 text-white`}
                          >
                            View Tasks
                            <ArrowRight size={12} />
                          </button>
                        )}

                        {/* CTA for task completed — syncs completion to local board */}
                        {isCompletedNotification && !n.isRead && (
                          <button
                            onClick={async () => {
                              markNotificationsRead([n._id])
                              // Trigger a refetch of assignments which syncs completed items to local stores
                              const { currentBordId, fetchAssignments } = useDelegationStore.getState()
                              if (n.metadata?.bordId) {
                                await fetchAssignments(n.metadata.bordId)
                              } else if (currentBordId) {
                                await fetchAssignments(currentBordId)
                              }
                            }}
                            className={`flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-emerald-500 hover:bg-emerald-600 text-white`}
                          >
                            <Check size={12} />
                            Sync to Board
                          </button>
                        )}

                        {/* CTA for task updated — syncs employee changes to local board */}
                        {n.type === 'task_updated' && !n.isRead && (
                          <button
                            onClick={async () => {
                              markNotificationsRead([n._id])
                              const { currentBordId, fetchAssignments } = useDelegationStore.getState()
                              if (n.metadata?.bordId) {
                                await fetchAssignments(n.metadata.bordId)
                              } else if (currentBordId) {
                                await fetchAssignments(currentBordId)
                              }
                            }}
                            className={`flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-indigo-500 hover:bg-indigo-600 text-white`}
                          >
                            <ArrowUpDown size={12} />
                            Sync Changes
                          </button>
                        )}

                        <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          {formatTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && !isInvitation && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
