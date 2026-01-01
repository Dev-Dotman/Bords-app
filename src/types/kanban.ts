export interface KanbanTask {
  id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
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
}
