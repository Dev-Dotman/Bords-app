'use client'

import { UserPlus, UserCheck, Users, CircleDot } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useDelegationStore } from '@/store/delegationStore'
import type { SourceType } from '@/types/delegation'

interface Props {
  sourceType: SourceType
  sourceId: string
  content: string
  size?: number
  className?: string
  label?: string
  columnId?: string
  columnTitle?: string
  availableColumns?: { id: string; title: string }[]
}

export function AssignButton({ sourceType, sourceId, content, size = 14, className = '', label, columnId, columnTitle, availableColumns }: Props) {
  const isDark = useThemeStore((s) => s.isDark)
  const { openAssignModal, getAssignmentsForSource } = useDelegationStore()

  const existing = getAssignmentsForSource(sourceType, sourceId)
  const activeAssignments = existing.filter((a) => a.status !== 'completed')
  const completedAssignments = existing.filter((a) => a.status === 'completed')
  const totalCount = existing.length
  const completedCount = completedAssignments.length
  const assigneeCount = activeAssignments.length
  const isAssigned = totalCount > 0

  // Partial completion: some done, some not
  const isPartiallyCompleted = totalCount > 1 && completedCount > 0 && completedCount < totalCount
  const isFullyCompleted = totalCount > 0 && completedCount === totalCount

  // Determine color state
  const colorClass = isFullyCompleted
    ? isDark
      ? 'text-emerald-400 hover:bg-emerald-900/30'
      : 'text-emerald-600 hover:bg-emerald-50'
    : isPartiallyCompleted
      ? isDark
        ? 'text-amber-400 hover:bg-amber-900/30'
        : 'text-amber-600 hover:bg-amber-50'
      : isAssigned
        ? isDark
          ? 'text-emerald-400 hover:bg-emerald-900/30'
          : 'text-emerald-600 hover:bg-emerald-50'
        : isDark
          ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
          : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'

  const titleText = isFullyCompleted
    ? `All ${totalCount} assignees completed`
    : isPartiallyCompleted
      ? `${completedCount}/${totalCount} completed`
      : isAssigned
        ? `Assigned to ${assigneeCount} employee${assigneeCount > 1 ? 's' : ''}`
        : 'Assign task'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        openAssignModal({ sourceType, sourceId, content, columnId, columnTitle, availableColumns })
      }}
      title={titleText}
      className={`inline-flex items-center gap-0.5 p-1 rounded-md transition-all ${colorClass} ${className}`}
    >
      {isPartiallyCompleted ? (
        <CircleDot size={size} />
      ) : isFullyCompleted ? (
        <UserCheck size={size} />
      ) : isAssigned ? (
        totalCount > 1 ? <Users size={size} /> : <UserCheck size={size} />
      ) : (
        <UserPlus size={size} />
      )}
      {label && <span>{label}</span>}
      {totalCount > 1 && (
        <span className="text-[10px] font-bold leading-none">
          {isPartiallyCompleted || isFullyCompleted ? `${completedCount}/${totalCount}` : totalCount}
        </span>
      )}
    </button>
  )
}
