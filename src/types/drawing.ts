export interface Point {
  x: number
  y: number
  pressure?: number
}

export interface DrawingPath {
  id: string
  points: Point[]
  color: string
  strokeWidth: number
  timestamp: number
}

export interface Drawing {
  id: string
  paths: DrawingPath[]
  position: { x: number; y: number }
}
