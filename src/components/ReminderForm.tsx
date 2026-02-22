'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calendar, Clock, Bell, UserPlus } from 'lucide-react'
import { useReminderStore, REMINDER_COLORS } from '../store/reminderStore'
import { useThemeStore } from '../store/themeStore'
import { useBoardStore } from '../store/boardStore'
import { useZIndexStore } from '../store/zIndexStore'
import { useWorkspaceStore, Friend } from '../store/workspaceStore'
import toast from 'react-hot-toast'

interface ReminderItemDraft {
  id: string
  text: string
  date: string
  time: string
}

interface ReminderFormProps {
  onClose: () => void
  position: { x: number; y: number }
}

export function ReminderForm({ onClose, position }: ReminderFormProps) {
  const isDark = useThemeStore((s) => s.isDark)
  const addReminder = useReminderStore((s) => s.addReminder)
  const currentBoardId = useBoardStore((s) => s.currentBoardId)
  const addItemToBoard = useBoardStore((s) => s.addItemToBoard)
  const bringToFront = useZIndexStore((s) => s.bringToFront)
  const isOrgContext = useWorkspaceStore((s) => s.isOrgContext())
  const friends = useWorkspaceStore((s) => s.friends)
  const fetchFriends = useWorkspaceStore((s) => s.fetchFriends)

  const [title, setTitle] = useState('')
  const [color, setColor] = useState('bg-amber-100/90')
  const [items, setItems] = useState<ReminderItemDraft[]>([
    { id: Date.now().toString(), text: '', date: '', time: '' },
  ])
  const [assignTo, setAssignTo] = useState<Friend | null>(null)
  const [showFriendPicker, setShowFriendPicker] = useState(false)
  const [friendSearch, setFriendSearch] = useState('')

  // Fetch friends when in personal context
  useEffect(() => {
    if (!isOrgContext) {
      fetchFriends()
    }
  }, [isOrgContext, fetchFriends])

  const filteredFriends = friends.filter(
    (f) =>
      f.firstName.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.lastName.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.email.toLowerCase().includes(friendSearch.toLowerCase())
  )

  const addNewItem = () => {
    setItems([...items, { id: Date.now().toString(), text: '', date: '', time: '' }])
  }

  const updateItem = (id: string, updates: Partial<ReminderItemDraft>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.id !== id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a reminder title')
      return
    }

    const validItems = items.filter((i) => i.text.trim())
    if (validItems.length === 0) {
      toast.error('Add at least one reminder item')
      return
    }

    // Validate date/time pairs
    for (const item of validItems) {
      if ((item.date && !item.time) || (!item.date && item.time)) {
        toast.error('Please set both date and time, or neither')
        return
      }
      if (item.date && item.time) {
        const dt = new Date(`${item.date}T${item.time}`)
        if (dt <= new Date()) {
          toast.error('Reminder date/time must be in the future')
          return
        }
      }
    }

    const reminderId = Date.now().toString()

    const newReminder = {
      id: reminderId,
      title: title.trim(),
      color,
      position,
      createdAt: new Date().toISOString(),
      items: validItems.map((i) => ({
        id: i.id,
        text: i.text.trim(),
        dueDate: i.date || undefined,
        dueTime: i.time || undefined,
        completed: false,
      })),
      assignedTo: assignTo
        ? {
            friendId: assignTo._id,
            userId: assignTo.userId,
            firstName: assignTo.firstName,
            lastName: assignTo.lastName,
            email: assignTo.email,
          }
        : null,
    }

    addReminder(newReminder)
    bringToFront(reminderId)

    if (currentBoardId) {
      addItemToBoard(currentBoardId, 'reminders', reminderId)
    }

    toast.success(
      assignTo
        ? `Reminder created & assigned to ${assignTo.firstName}`
        : 'Reminder created!'
    )
    onClose()
  }

  const getMinDate = () => new Date().toISOString().split('T')[0]

  const getMinTime = (date: string) => {
    if (date === new Date().toISOString().split('T')[0]) {
      const now = new Date()
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }
    return '00:00'
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className={`${color} p-8 rounded-3xl shadow-2xl border border-white/20 w-[90vw] max-w-[600px]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell size={22} className="text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-800">Create Reminder</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-white/60 backdrop-blur-sm rounded-full p-2 transition-all duration-200 hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reminder title..."
          className="w-full p-3 border-0 rounded-2xl focus:ring-2 focus:ring-amber-400/50 focus:outline-none bg-white/90 backdrop-blur-sm shadow-sm text-gray-900 placeholder:text-gray-500 mb-4"
          autoFocus
        />

        {/* Color Picker */}
        <div className="flex gap-3 justify-center flex-wrap mb-5">
          {Object.entries(REMINDER_COLORS).map(([name, colorClass]) => (
            <button
              key={name}
              type="button"
              onClick={() => setColor(colorClass)}
              className={`
                w-9 h-9 rounded-full ${colorClass}
                ${color === colorClass ? 'ring-2 ring-offset-2 ring-amber-500 scale-110' : 'hover:scale-105'}
                transition-all duration-200 border border-black/5 shadow-md hover:shadow-lg
              `}
            />
          ))}
        </div>

        {/* Items */}
        <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1 mb-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-white/40"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-amber-600/70 w-5">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItem(item.id, { text: e.target.value })}
                  placeholder="What do you need to remember?"
                  className="flex-1 px-3 py-2 rounded-xl border-0 bg-white/80 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400/50 focus:outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addNewItem()
                    }
                  }}
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50/80 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {/* Date & Time */}
              <div className="flex items-center gap-2 ml-7">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={item.date}
                  min={getMinDate()}
                  onChange={(e) => updateItem(item.id, { date: e.target.value })}
                  className="px-2 py-1 text-xs rounded-lg border-0 bg-white/80 text-gray-700 focus:ring-2 focus:ring-amber-400/50 focus:outline-none"
                />
                <Clock size={13} className="text-gray-400 shrink-0" />
                <input
                  type="time"
                  value={item.time}
                  min={item.date ? getMinTime(item.date) : undefined}
                  onChange={(e) => updateItem(item.id, { time: e.target.value })}
                  className="px-2 py-1 text-xs rounded-lg border-0 bg-white/80 text-gray-700 focus:ring-2 focus:ring-amber-400/50 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <button
          type="button"
          onClick={addNewItem}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-300/60 text-amber-700 hover:border-amber-400 hover:bg-amber-50/50 transition-all flex items-center justify-center gap-2 text-sm font-medium mb-4"
        >
          <Plus size={16} />
          Add another item
        </button>

        {/* Assign to Friend (personal context only) */}
        {!isOrgContext && (
          <div className="mb-4">
            {!assignTo ? (
              <button
                type="button"
                onClick={() => setShowFriendPicker(!showFriendPicker)}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all border bg-white/70 border-amber-200/60 text-gray-600 hover:border-amber-300 hover:bg-white/90"
              >
                <UserPlus size={15} />
                Assign to a friend (optional)
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                  {assignTo.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {assignTo.firstName} {assignTo.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{assignTo.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignTo(null)}
                  className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {showFriendPicker && !assignTo && (
              <div className="mt-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/40 overflow-hidden">
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full px-3 py-2 text-sm border-b border-amber-100/60 bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
                <div className="max-h-[120px] overflow-y-auto">
                  {filteredFriends.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-gray-400 text-center">
                      {friends.length === 0 ? 'No friends added yet' : 'No match'}
                    </p>
                  ) : (
                    filteredFriends.map((f) => (
                      <button
                        key={f._id}
                        type="button"
                        onClick={() => {
                          setAssignTo(f)
                          setShowFriendPicker(false)
                          setFriendSearch('')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-50/80 transition-colors text-left"
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {f.firstName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {f.firstName} {f.lastName}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{f.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-2.5 text-gray-700 hover:bg-white/60 backdrop-blur-sm rounded-xl transition-all duration-200 font-medium hover:scale-105"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Create Reminder
          </button>
        </div>
      </form>
    </div>
  )
}
