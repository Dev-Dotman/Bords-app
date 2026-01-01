import { useState } from 'react'
import { XCircle, Calendar } from 'lucide-react'
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
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-xl w-[420px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Description
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded-lg min-h-[80px]"
              placeholder="Enter task description"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime(''); // Reset time when date changes
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded-lg pr-8"
                />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={date ? getMinTime(date) : undefined}
                className="w-32 p-2 border rounded-lg"
                disabled={!date}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={!text.trim()}
          >
            {initialData ? 'Update' : 'Add'} Task
          </button>
        </div>
      </form>
    </div>
  )
}
