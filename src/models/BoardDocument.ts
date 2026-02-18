import mongoose, { Schema, Model, Types } from 'mongoose'

/* ─────────────────────────── Sub-schemas ─────────────────────────── */

const PositionSchema = new Schema({ x: Number, y: Number }, { _id: false })

const ChecklistItemSchema = new Schema({
  id:        { type: String, required: true },
  text:      { type: String, default: '' },
  completed: { type: Boolean, default: false },
  deadline:  { type: Date, default: null },
  timeSpent: { type: Number, default: 0 },
  isTracking:{ type: Boolean, default: false },
}, { _id: false })

const ChecklistSchema = new Schema({
  id:       { type: String, required: true },
  title:    { type: String, default: 'Checklist' },
  items:    [ChecklistItemSchema],
  position: { type: PositionSchema, required: true },
  color:    { type: String, default: 'bg-white/70' },
  width:    { type: Number, default: null },
  height:   { type: Number, default: null },
  createdAt:{ type: Date, default: Date.now },
}, { _id: false })

const KanbanTaskSchema = new Schema({
  id:          { type: String, required: true },
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  priority:    { type: String, enum: ['low', 'medium', 'high', null], default: null },
  dueDate:     { type: String, default: null },
  completed:   { type: Boolean, default: false },
}, { _id: false })

const KanbanColumnSchema = new Schema({
  id:    { type: String, required: true },
  title: { type: String, default: '' },
  tasks: [KanbanTaskSchema],
}, { _id: false })

const KanbanBoardSchema = new Schema({
  id:       { type: String, required: true },
  title:    { type: String, default: 'Kanban' },
  columns:  [KanbanColumnSchema],
  position: { type: PositionSchema, required: true },
  color:    { type: String, default: 'bg-white/70' },
  width:    { type: Number, default: null },
  height:   { type: Number, default: null },
}, { _id: false })

const StickyNoteSchema = new Schema({
  id:       { type: String, required: true },
  text:     { type: String, default: '' },
  position: { type: PositionSchema, required: true },
  color:    { type: String, default: 'bg-yellow-200' },
  width:    { type: Number, default: null },
  height:   { type: Number, default: null },
}, { _id: false })

const MediaItemSchema = new Schema({
  id:          { type: String, required: true },
  url:         { type: String, required: true },
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['image', 'video'], required: true },
  position:    { type: PositionSchema, required: true },
  width:       { type: Number, default: 300 },
  height:      { type: Number, default: 200 },
  color:       { type: String, default: null },
  createdAt:   { type: Number, default: Date.now },
}, { _id: false })

const TextElementSchema = new Schema({
  id:       { type: String, required: true },
  text:     { type: String, default: '' },
  position: { type: PositionSchema, required: true },
  fontSize: { type: Number, default: 16 },
  color:    { type: String, default: '#000000' },
  rotation: { type: Number, default: 0 },
}, { _id: false })

const PointSchema = new Schema({
  x: Number,
  y: Number,
  pressure: { type: Number, default: null },
}, { _id: false })

const DrawingPathSchema = new Schema({
  id:          { type: String, required: true },
  points:      [PointSchema],
  color:       { type: String, default: '#000000' },
  strokeWidth: { type: Number, default: 2 },
  timestamp:   { type: Number, default: Date.now },
}, { _id: false })

const DrawingSchema = new Schema({
  id:       { type: String, required: true },
  paths:    [DrawingPathSchema],
  position: { type: PositionSchema, required: true },
}, { _id: false })

const CommentSchema = new Schema({
  id:        { type: String, required: true },
  text:      { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  position:  { type: PositionSchema, required: true },
  boardId:   { type: String, default: '' },
}, { _id: false })

const ConnectionSchema = new Schema({
  id:           { type: String, required: true },
  fromId:       { type: String, required: true },
  toId:         { type: String, required: true },
  fromType:     { type: String, enum: ['note', 'checklist', 'kanban', 'text', 'media'], required: true },
  toType:       { type: String, enum: ['note', 'checklist', 'kanban', 'text', 'media'], required: true },
  fromPosition: { type: PositionSchema, default: null },
  toPosition:   { type: PositionSchema, default: null },
  color:        { type: String, default: '#3b82f6' },
  boardId:      { type: String, default: '' },
}, { _id: false })

/* Shared-with entry */
const SharedWithSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email:      { type: String, required: true },
  permission: { type: String, enum: ['view', 'edit'], default: 'view' },
  addedAt:    { type: Date, default: Date.now },
}, { _id: false })

/* ─────────────── Board settings sub-schemas ─────────────── */

const ConnectionLineSettingsSchema = new Schema({
  colorMode:          { type: String, enum: ['multicolor', 'monochromatic'], default: 'multicolor' },
  monochromaticColor: { type: String, default: '#3b82f6' },
}, { _id: false })

const GridSettingsSchema = new Schema({
  isGridVisible: { type: Boolean, default: true },
  gridColor:     { type: String, default: '#333333' },
  zoom:          { type: Number, default: 1 },
  gridSize:      { type: Number, default: 20 },
  snapEnabled:   { type: Boolean, default: false },
}, { _id: false })

const ThemeSettingsSchema = new Schema({
  isDark:     { type: Boolean, default: true },
  colorTheme: { type: String, default: 'zinc' },
}, { _id: false })

const ZIndexEntrySchema = new Schema({
  itemId: String,
  zIndex: Number,
}, { _id: false })

/* ─────────────────────── Main Board Document ─────────────────────── */

export interface IBoardDocument {
  _id: Types.ObjectId
  owner:      Types.ObjectId
  localBoardId: string          // maps to the client-side board.id
  name:       string
  visibility: 'private' | 'public' | 'shared'
  shareToken: string | null     // for public link sharing
  sharedWith: {
    userId: Types.ObjectId
    email: string
    permission: 'view' | 'edit'
    addedAt: Date
  }[]

  // Background
  backgroundImage?:       string
  backgroundColor?:       string
  backgroundOverlay?:     boolean
  backgroundOverlayColor?: string
  backgroundBlurLevel?:   string

  // Board content — every item type
  checklists:     any[]
  kanbanBoards:   any[]
  stickyNotes:    any[]
  mediaItems:     any[]
  textElements:   any[]
  drawings:       any[]
  comments:       any[]
  connections:    any[]

  // Board settings
  connectionLineSettings: { colorMode: string; monochromaticColor: string }
  gridSettings:           { isGridVisible: boolean; gridColor: string; zoom: number; gridSize: number; snapEnabled: boolean }
  themeSettings:          { isDark: boolean; colorTheme: string }
  zIndexData:             { counter: number; entries: { itemId: string; zIndex: number }[] }

  // Item ID arrays (mirrors client boardStore.Board for reference lookup)
  itemIds: {
    notes:       string[]
    checklists:  string[]
    texts:       string[]
    connections: string[]
    drawings:    string[]
    kanbans:     string[]
    medias:      string[]
  }

  contentHash:  string         // fast hash of board content for change detection
  lastSyncedAt: Date
  createdAt:    Date
  updatedAt:    Date
}

const BoardDocumentSchema = new Schema<IBoardDocument>(
  {
    owner:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    localBoardId: { type: String, required: true },
    name:         { type: String, required: true, trim: true },
    visibility:   { type: String, enum: ['private', 'public', 'shared'], default: 'private' },
    shareToken:   { type: String, default: null, sparse: true, unique: true },
    sharedWith:   [SharedWithSchema],

    // Background
    backgroundImage:       { type: String, default: null },
    backgroundColor:       { type: String, default: null },
    backgroundOverlay:     { type: Boolean, default: false },
    backgroundOverlayColor:{ type: String, default: null },
    backgroundBlurLevel:   { type: String, default: null },

    // Board content
    checklists:   [ChecklistSchema],
    kanbanBoards: [KanbanBoardSchema],
    stickyNotes:  [StickyNoteSchema],
    mediaItems:   [MediaItemSchema],
    textElements: [TextElementSchema],
    drawings:     [DrawingSchema],
    comments:     [CommentSchema],
    connections:  [ConnectionSchema],

    // Board settings
    connectionLineSettings: { type: ConnectionLineSettingsSchema, default: () => ({}) },
    gridSettings:           { type: GridSettingsSchema, default: () => ({}) },
    themeSettings:          { type: ThemeSettingsSchema, default: () => ({}) },
    zIndexData: {
      counter: { type: Number, default: 0 },
      entries: [ZIndexEntrySchema],
    },

    // Item ID arrays (for quick reference)
    itemIds: {
      notes:       [String],
      checklists:  [String],
      texts:       [String],
      connections: [String],
      drawings:    [String],
      kanbans:     [String],
      medias:      [String],
    },

    contentHash:  { type: String, default: '' },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Compound index: one cloud doc per owner + local board
BoardDocumentSchema.index({ owner: 1, localBoardId: 1 }, { unique: true })
// For share link lookups
BoardDocumentSchema.index({ shareToken: 1 })
// For listing boards shared with a user
BoardDocumentSchema.index({ 'sharedWith.userId': 1 })

const BoardDocument: Model<IBoardDocument> =
  mongoose.models.BoardDocument || mongoose.model<IBoardDocument>('BoardDocument', BoardDocumentSchema)

export default BoardDocument
