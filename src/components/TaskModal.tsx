import { useState } from 'react'
import { XCircle, Calendar, Clock, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TaskModalProps {
  onClose: () => void
  onSubmit: (data: { text: string; date: string; time: string }) => void
  initialData?: {
    text: string
    date?: string
    time?: string
  }
  title: string
}

export function TaskModal({ onClose, onSubmit, initialData, title }: TaskModalProps) {
  const [text, setText] = useState(initialData?.text || '')
  const [date, setDate] = useState(initialData?.date || '')
  const [time, setTime] = useState(initialData?.time || '')

  const validateDateTime = (date: string, time: string) => {
    if ((date && !time) || (!date && time)) {
      return false;
    }
    if (!date || !time) return true;

    const dateTime = new Date(`${date}T${time}`);
    return dateTime > new Date();
  }

  const getMinTime = (date: string) => {
    if (date === new Date().toISOString().split('T')[0]) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    return '00:00';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Task description is required');
      return;
    }
    
    if (!validateDateTime(date, time)) {
      toast.error('Please provide both date and time, and ensure they are in the future');
      return;
    }

    onSubmit({ text, date, time });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-[95vw] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Task Description */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <FileText size={14} className="text-blue-500" />
              Task Description
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl min-h-[100px] text-sm text-gray-800
                         placeholder:text-gray-400 resize-none
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                         transition-all duration-150"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Deadline Section */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Clock size={14} className="text-amber-500" />
              Deadline
              <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setTime('');
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                               transition-all duration-150 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="w-[130px]">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  min={date ? getMinTime(date) : undefined}
                  className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                             transition-all duration-150
                             ${!date ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-800'}`}
                  disabled={!date}
                />
              </div>
            </div>
            {!date && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5 ml-0.5">
                <AlertCircle size={11} />
                Set a date first to enable time selection
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800
                         hover:bg-gray-100 rounded-xl transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm
                         ${text.trim()
                           ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-[0.98]'
                           : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              disabled={!text.trim()}
            >
              {initialData ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
