'use client'
import { useState } from 'react'
import { Task } from '../types/task'

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id'>) => void
  onCancel: () => void
  position: { x: number; y: number }
}

export function TaskForm({ onSubmit, onCancel, position }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      position,
      connections: [],
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-lg border border-zinc-200">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full bg-zinc-50 p-2 rounded mb-2 text-zinc-800 placeholder-zinc-400 border border-zinc-200"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full bg-zinc-50 p-2 rounded mb-2 text-zinc-800 placeholder-zinc-400 border border-zinc-200"
      />
      <div className="flex justify-end gap-2">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors text-zinc-700"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors text-white"
        >
          Create
        </button>
      </div>
    </form>
  )
}
