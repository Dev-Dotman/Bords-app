'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Building2,
  MessageSquare,
  Loader2,
  Inbox,
  Monitor,
  ChevronDown,
  CheckSquare,
  LayoutGrid,
  ArrowLeft,
  Star,
} from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { motion, AnimatePresence } from 'framer-motion'

interface TaskItem {
  _id: string
  bordId: string
  bordTitle: string
  sourceType: string
  sourceId: string
  content: string
  priority: 'low' | 'normal' | 'high'
  dueDate: string | null
  executionNote: string | null
  status: 'assigned' | 'completed'
  completedAt: string | null
  createdAt: string
  columnId: string | null
  columnTitle: string | null
  availableColumns: { id: string; title: string }[]
  assigner?: { firstName: string; lastName: string }
}

interface OrgTaskGroup {
  organization: { _id: string; name: string }
  tasks: TaskItem[]
}

const PRIORITY_MAP: Record<string, { label: string; color: string; darkColor: string }> = {
  high: { label: 'High', color: 'text-red-600', darkColor: 'text-red-400' },
  normal: { label: 'Normal', color: 'text-zinc-500', darkColor: 'text-zinc-500' },
  low: { label: 'Low', color: 'text-blue-600', darkColor: 'text-blue-400' },
}

type FilterTab = 'all' | 'checklist' | 'kanban' | 'completed'

export default function ExecutionInbox() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isDark = useThemeStore((s) => s.isDark)
  const [taskGroups, setTaskGroups] = useState<OrgTaskGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [columnDropdownId, setColumnDropdownId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => { fetchTasks() }, [])

  useEffect(() => {
    const handleClick = () => setColumnDropdownId(null)
    if (columnDropdownId) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [columnDropdownId])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/execution/tasks')
      const data = await res.json()
      if (res.ok) {
        setTaskGroups(data.tasksByOrganization || [])
        // Auto-expand first org
        if (data.tasksByOrganization?.length > 0) {
          setExpandedOrg(data.tasksByOrganization[0].organization._id)
        }
      }
    } catch { /* silent */ } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (taskId: string) => {
    setCompletingId(taskId)
    try {
      const res = await fetch(`/api/execution/tasks/${taskId}/complete`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setTaskGroups((prev) =>
          prev.map((group) => ({
            ...group,
            tasks: group.tasks.map((task) =>
              task._id === taskId
                ? { ...task, status: data.task.status, completedAt: data.task.completedAt || null }
                : task
            ),
          }))
        )
      }
    } catch { /* silent */ } finally {
      setCompletingId(null)
    }
  }

  const handleMoveColumn = async (taskId: string, newColumnId: string, newColumnTitle: string) => {
    setMovingId(taskId)
    setColumnDropdownId(null)
    try {
      const res = await fetch(`/api/execution/tasks/${taskId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: newColumnId, columnTitle: newColumnTitle }),
      })
      if (res.ok) {
        setTaskGroups((prev) =>
          prev.map((group) => ({
            ...group,
            tasks: group.tasks.map((task) =>
              task._id === taskId ? { ...task, columnId: newColumnId, columnTitle: newColumnTitle } : task
            ),
          }))
        )
      }
    } catch { /* silent */ } finally {
      setMovingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, overdue: true }
    if (days === 0) return { text: 'Today', overdue: false }
    if (days === 1) return { text: 'Tomorrow', overdue: false }
    if (days <= 7) return { text: `${days}d`, overdue: false }
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false }
  }

  const formatCreatedDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Flatten all tasks for counting
  const allTasks = taskGroups.flatMap((g) => g.tasks)
  const checklistTasks = allTasks.filter((t) => t.sourceType === 'checklist_item')
  const kanbanTasks = allTasks.filter((t) => t.sourceType === 'kanban_task')
  const pendingTasks = allTasks.filter((t) => t.status === 'assigned')
  const completedTasks = allTasks.filter((t) => t.status === 'completed')

  // Filter logic — clean separation
  const filterTask = (task: TaskItem): boolean => {
    switch (filter) {
      case 'checklist': return task.sourceType === 'checklist_item' && task.status === 'assigned'
      case 'kanban': return task.sourceType === 'kanban_task' && task.status === 'assigned'
      case 'completed': return task.status === 'completed'
      case 'all':
      default: return task.status === 'assigned'
    }
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Inbox', count: pendingTasks.length },
    { key: 'checklist', label: 'Checklists', count: checklistTasks.filter(t => t.status === 'assigned').length },
    { key: 'kanban', label: 'Kanban', count: kanbanTasks.filter(t => t.status === 'assigned').length },
    { key: 'completed', label: 'Done', count: completedTasks.length },
  ]

  if (status === 'loading' || isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
      {/* Top Bar */}
      <header className={`sticky top-0 z-10 border-b backdrop-blur-xl ${
        isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-zinc-200'
      }`}>
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          {/* Row 1: Logo + title + back button */}
          <div className="flex items-center justify-between py-3 sm:py-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => router.push('/')}
                className={`p-2 sm:p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
                }`}
              >
                <ArrowLeft size={20} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <div className="w-8 h-8 sm:w-7 sm:h-7 bg-black rounded-lg flex items-center justify-center p-1">
                <img src="/bordclear.png" alt="BORDS" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className={`text-lg sm:text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  Inbox
                </h1>
                <p className={`text-xs sm:text-[11px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {pendingTasks.length} pending
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Filter tabs — Gmail-style category tabs */}
          <div className="flex border-b-0 -mb-px overflow-x-auto scrollbar-none">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`relative px-3 sm:px-4 py-3 sm:py-2.5 text-[13px] sm:text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  filter === key
                    ? isDark
                      ? 'text-white'
                      : 'text-zinc-900'
                    : isDark
                      ? 'text-zinc-500 hover:text-zinc-300'
                      : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      filter === key
                        ? isDark ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-700'
                        : isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </span>
                {/* Active indicator bar */}
                {filter === key && (
                  <motion.div
                    layoutId="inbox-tab"
                    className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                      isDark ? 'bg-white' : 'bg-zinc-900'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Task List */}
      <main className="max-w-3xl mx-auto pb-8">
        {taskGroups.length === 0 ? (
          <div className="text-center py-24 px-6">
            <Inbox size={44} className={`mx-auto mb-4 ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`} />
            <h2 className={`text-lg sm:text-base font-semibold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              No tasks or messages yet
            </h2>
            <p className={`text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Your tasks will also appear here
            </p>
          </div>
        ) : (
          <div>
            {taskGroups.map((group) => {
              const filteredTasks = group.tasks.filter(filterTask)
              if (filteredTasks.length === 0) return null

              const isExpanded = expandedOrg === group.organization._id || expandedOrg === null

              // Sort: overdue first, then by due date, then by priority
              const sorted = [...filteredTasks].sort((a, b) => {
                // Priority order: high > normal > low
                const priOrder = { high: 0, normal: 1, low: 2 }
                const aPri = priOrder[a.priority] ?? 1
                const bPri = priOrder[b.priority] ?? 1
                if (aPri !== bPri) return aPri - bPri
                // Then by due date (earliest first, null last)
                if (a.dueDate && !b.dueDate) return -1
                if (!a.dueDate && b.dueDate) return 1
                if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                return 0
              })

              return (
                <div key={group.organization._id}>
                  {/* Organization header — collapsible */}
                  <button
                    onClick={() => setExpandedOrg(isExpanded ? (expandedOrg === null ? group.organization._id : null) : group.organization._id)}
                    className={`w-full flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 text-left transition-colors ${
                      isDark ? 'bg-zinc-800/50 hover:bg-zinc-800' : 'bg-zinc-100/80 hover:bg-zinc-100'
                    }`}
                  >
                    <Building2 size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                    <span className={`text-[13px] sm:text-xs font-semibold flex-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {group.organization.name}
                    </span>
                    <span className={`text-[11px] sm:text-[10px] font-medium ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {filteredTasks.length}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${isDark ? 'text-zinc-600' : 'text-zinc-400'} ${isExpanded ? '' : '-rotate-90'}`} />
                  </button>

                  {/* Task rows */}
                  <AnimatePresence>
                    {isExpanded && sorted.map((task) => (
                      <TaskRow
                        key={task._id}
                        task={task}
                        isDark={isDark}
                        completingId={completingId}
                        movingId={movingId}
                        columnDropdownId={columnDropdownId}
                        onComplete={handleComplete}
                        onMoveColumn={handleMoveColumn}
                        onToggleDropdown={(id) => setColumnDropdownId(columnDropdownId === id ? null : id)}
                        formatDate={formatDate}
                        formatCreatedDate={formatCreatedDate}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )
            })}

            {/* Show empty state for current filter */}
            {taskGroups.every(g => g.tasks.filter(filterTask).length === 0) && (
              <div className="text-center py-20">
                <Inbox size={36} className={`mx-auto mb-3 ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {filter === 'completed' ? 'No completed tasks' : filter === 'checklist' ? 'No checklist tasks' : filter === 'kanban' ? 'No kanban tasks' : 'All caught up!'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── Gmail-inspired task row ─── */
function TaskRow({
  task,
  isDark,
  completingId,
  movingId,
  columnDropdownId,
  onComplete,
  onMoveColumn,
  onToggleDropdown,
  formatDate,
  formatCreatedDate,
}: {
  task: TaskItem
  isDark: boolean
  completingId: string | null
  movingId: string | null
  columnDropdownId: string | null
  onComplete: (id: string) => void
  onMoveColumn: (id: string, colId: string, colTitle: string) => void
  onToggleDropdown: (id: string) => void
  formatDate: (d: string) => { text: string; overdue: boolean }
  formatCreatedDate: (d: string) => string
}) {
  const isCompleted = task.status === 'completed'
  const isCompleting = completingId === task._id
  const isMoving = movingId === task._id
  const isKanban = task.sourceType === 'kanban_task'
  const hasColumns = isKanban && task.availableColumns && task.availableColumns.length > 0
  const dueDateInfo = task.dueDate ? formatDate(task.dueDate) : null
  const pri = PRIORITY_MAP[task.priority] || PRIORITY_MAP.normal

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`border-b transition-colors group ${
        isCompleted
          ? isDark ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-zinc-50/50 border-zinc-100'
          : isDark
            ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/60'
            : 'bg-white border-zinc-200 hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 px-3 py-3.5 sm:px-5 sm:py-4 sm:gap-4">
        {/* Check / status toggle */}
        <button
          onClick={() => onComplete(task._id)}
          disabled={isCompleting}
          className={`flex-shrink-0 mt-0.5 sm:mt-0 p-1 -m-1 transition-colors ${
            isCompleted
              ? isDark ? 'text-emerald-400 hover:text-zinc-500' : 'text-emerald-500 hover:text-zinc-400'
              : isCompleting
                ? 'text-amber-500'
                : isDark ? 'text-zinc-600 hover:text-emerald-400' : 'text-zinc-300 hover:text-emerald-500'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleting ? (
            <Loader2 size={20} className="animate-spin sm:w-[18px] sm:h-[18px]" />
          ) : isCompleted ? (
            <CheckCircle2 size={20} className="sm:w-[18px] sm:h-[18px]" />
          ) : (
            <Circle size={20} className="sm:w-[18px] sm:h-[18px]" />
          )}
        </button>

        {/* Type icon */}
        <div className={`flex-shrink-0 w-7 h-7 sm:w-7 sm:h-7 rounded-lg sm:rounded-md flex items-center justify-center ${
          isKanban
            ? isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
            : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
        }`}>
          {isKanban ? <LayoutGrid size={13} /> : <CheckSquare size={13} />}
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile: stacked layout. Desktop: inline layout */}
          <div className="sm:flex sm:items-center sm:gap-3">
            {/* Sender / board info */}
            <div className="hidden sm:block sm:w-[120px] flex-shrink-0">
              <p className={`text-[13px] font-medium truncate ${
                isCompleted
                  ? isDark ? 'text-zinc-600' : 'text-zinc-400'
                  : isDark ? 'text-zinc-300' : 'text-zinc-700'
              }`}>
                {task.assigner ? `${task.assigner.firstName}` : 'System'}
              </p>
              <p className={`text-[10px] truncate ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {task.bordTitle}
              </p>
            </div>

            {/* Task content + meta */}
            <div className="flex-1 min-w-0">
              {/* Task title */}
              <div className="flex items-start sm:items-center gap-2">
                <p className={`text-[15px] sm:text-[15px] leading-snug ${
                  isCompleted
                    ? isDark ? 'text-zinc-600 line-through' : 'text-zinc-400 line-through'
                    : task.priority === 'high'
                      ? isDark ? 'text-zinc-100 font-semibold' : 'text-zinc-900 font-semibold'
                      : isDark ? 'text-zinc-200' : 'text-zinc-800'
                }`}>
                  {task.content}
                </p>
                {task.executionNote && (
                  <span className={`hidden sm:inline text-xs truncate ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    — {task.executionNote}
                  </span>
                )}
              </div>

              {/* Mobile: assigner + board + date on second row */}
              <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                <p className={`text-[12px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {task.assigner ? task.assigner.firstName : 'System'}
                </p>
                <span className={`text-[12px] ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>·</span>
                <p className={`text-[12px] truncate ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {task.bordTitle}
                </p>
                {dueDateInfo && (
                  <>
                    <span className={`text-[12px] ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>·</span>
                    <span className={`text-[11px] font-medium ${
                      dueDateInfo.overdue
                        ? 'text-red-500 font-semibold'
                        : isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                      {dueDateInfo.text}
                    </span>
                  </>
                )}
                {task.priority === 'high' && (
                  <Flag size={11} className={isDark ? 'text-red-400 ml-0.5' : 'text-red-500 ml-0.5'} />
                )}
              </div>

              {task.executionNote && (
                <p className={`sm:hidden text-[12px] mt-0.5 truncate ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {task.executionNote}
                </p>
              )}

              {/* Kanban column selector — inline pill */}
              {isKanban && hasColumns && (
                <div className="relative inline-block mt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleDropdown(task._id) }}
                    disabled={isMoving}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                      isMoving
                        ? isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
                        : isDark
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {isMoving && <Loader2 size={8} className="animate-spin" />}
                    {task.columnTitle || 'No column'}
                    <ChevronDown size={8} />
                  </button>

                  {columnDropdownId === task._id && (
                    <div
                      className={`absolute top-full left-0 mt-1 rounded-lg border shadow-xl z-30 min-w-[140px] overflow-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.availableColumns.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => onMoveColumn(task._id, col.id, col.title)}
                          disabled={col.id === task.columnId}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                            col.id === task.columnId
                              ? isDark ? 'bg-zinc-700/50 text-zinc-300 font-medium' : 'bg-zinc-100 text-zinc-600 font-medium'
                              : isDark ? 'text-zinc-200 hover:bg-zinc-700' : 'text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {col.id === task.columnId && <CheckCircle2 size={10} className="text-zinc-400 flex-shrink-0" />}
                          <span className={col.id === task.columnId ? '' : 'ml-[18px]'}>{col.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Kanban column label only (no available columns) */}
              {isKanban && !hasColumns && task.columnTitle && (
                <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {task.columnTitle}
                </span>
              )}
            </div>
          </div>

          {/* Right side: badges + date — desktop only */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {/* Priority flag (non-normal only) */}
            {task.priority === 'high' && (
              <Flag size={12} className={isDark ? 'text-red-400' : 'text-red-500'} />
            )}

            {/* Due date */}
            {dueDateInfo && (
              <span className={`text-[11px] font-medium whitespace-nowrap ${
                dueDateInfo.overdue
                  ? 'text-red-500 font-semibold'
                  : isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {dueDateInfo.text}
              </span>
            )}

            {/* Created date as fallback */}
            {!dueDateInfo && (
              <span className={`text-[11px] whitespace-nowrap ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {formatCreatedDate(task.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
