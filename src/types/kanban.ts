export interface KanbanTask {
  id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  completed?: boolean
}

export interface KanbanColumn {
  id: string
  title: string
  tasks: KanbanTask[]
}

export interface KanbanBoard {
  id: string
  title: string
  columns: KanbanColumn[]
  position: { x: number; y: number }
  color: string
  width?: number
  height?: number
}
