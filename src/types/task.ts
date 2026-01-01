export interface Position {
  x: number
  y: number
}

export interface Task {
  id: string
  title: string
  description: string
  position: Position
  color?: string
  connections: string[]
  createdAt: number
  updatedAt: number
}

export interface Connection {
  sourceId: string
  targetId: string
  color?: string
}

export type TaskStatus = 'idle' | 'dragging' | 'connecting'
