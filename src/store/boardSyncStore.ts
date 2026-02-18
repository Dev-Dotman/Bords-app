import { create } from 'zustand'
import { toast } from 'react-hot-toast'
import { useBoardStore } from './boardStore'
import { useChecklistStore } from './checklistStore'
import { useKanbanStore } from './kanbanStore'
import { useNoteStore } from './stickyNoteStore'
import { useMediaStore } from './mediaStore'
import { useTextStore } from './textStore'
import { useDrawingStore } from './drawingStore'
import { useCommentStore } from './commentStore'
import { useConnectionStore } from './connectionStore'
import { useConnectionLineStore } from './connectionLineStore'
import { useGridStore } from './gridStore'
import { useThemeStore } from './themeStore'
import { useZIndexStore } from './zIndexStore'

/* ─────────────────────── Types ─────────────────────── */

export interface CloudBoardMeta {
  _id: string
  localBoardId: string
  name: string
  visibility: 'private' | 'public' | 'shared'
  contentHash?: string
  lastSyncedAt: string
  createdAt: string
  updatedAt: string
}

export interface ShareEntry {
  userId: string
  email: string
  permission: 'view' | 'edit'
  addedAt: string
}

interface BoardSyncStore {
  // State
  isSyncing: boolean
  isInitialLoading: boolean
  hasLoadedFromCloud: boolean
  lastSyncedAt: Record<string, Date>
  contentHashes: Record<string, string>   // localBoardId → last-known cloud hash
  dirtyBoards: Set<string>                // boards with unsaved local changes
  staleBoards: Set<string>                // boards with newer cloud versions
  cloudBoards: CloudBoardMeta[]
  error: string | null

  // Core sync actions
  syncBoardToCloud: (localBoardId: string) => Promise<void>
  loadBoardFromCloud: (localBoardId: string) => Promise<void>
  deleteBoardFromCloud: (localBoardId: string) => Promise<void>
  listCloudBoards: () => Promise<void>
  loadAllCloudBoards: () => Promise<void>

  // Smart sync
  markDirty: (localBoardId: string) => void
  computeLocalHash: (localBoardId: string) => string
  syncDirtyBoards: () => Promise<void>
  checkForStaleBoards: () => Promise<void>   // Tab-focus check (no auto-apply)
  refreshStaleBoards: () => Promise<void>    // User-triggered: pull stale boards
  dismissStale: (localBoardId: string) => void

  // Share actions
  getShareSettings: (localBoardId: string) => Promise<{ visibility: string; shareToken: string | null; sharedWith: ShareEntry[] } | null>
  updateVisibility: (localBoardId: string, visibility: 'private' | 'public' | 'shared') => Promise<void>
  addShareUser: (localBoardId: string, email: string, permission: 'view' | 'edit') => Promise<void>
  removeShareUser: (localBoardId: string, userId: string) => Promise<void>
  updateSharePermission: (localBoardId: string, userId: string, permission: 'view' | 'edit') => Promise<void>
}

/* ─────── Fast hash (djb2 — no crypto import needed on client) ─────── */

function djb2Hash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

function computeHash(localBoardId: string): string {
  const boardStore = useBoardStore.getState()
  const board = boardStore.boards.find(b => b.id === localBoardId)
  if (!board) return ''

  const checklistStore = useChecklistStore.getState()
  const kanbanStore = useKanbanStore.getState()
  const stickyStore = useNoteStore.getState()
  const mediaStore = useMediaStore.getState()
  const textStore = useTextStore.getState()
  const drawingStore = useDrawingStore.getState()
  const commentStore = useCommentStore.getState()
  const connectionStore = useConnectionStore.getState()
  const connectionLineStore = useConnectionLineStore.getState()
  const gridStore = useGridStore.getState()
  const themeStore = useThemeStore.getState()
  const zIndexStore = useZIndexStore.getState()

  const checklists = checklistStore.checklists.filter((c: any) => board.checklists.includes(c.id))
  const kanbans = kanbanStore.boards.filter((k: any) => board.kanbans.includes(k.id))
  const notes = stickyStore.notes.filter((n: any) => board.notes.includes(n.id))
  const medias = mediaStore.medias.filter((m: any) => board.medias.includes(m.id))
  const texts = textStore.texts.filter((t: any) => board.texts.includes(t.id))
  const drawings = drawingStore.drawings.filter((d: any) => board.drawings.includes(d.id))
  const comments = commentStore.comments.filter((c: any) => c.boardId === localBoardId)
  const connections = connectionStore.connections.filter((c: any) => c.boardId === localBoardId)

  const allItemIds = new Set([
    ...board.notes, ...board.checklists, ...board.texts,
    ...board.kanbans, ...board.medias, ...board.drawings,
  ])
  const zEntries = Object.entries(zIndexStore.zIndexMap)
    .filter(([id]) => allItemIds.has(id))
    .map(([itemId, zIndex]) => ({ itemId, zIndex }))

  // Build a deterministic string of all content
  const payload = JSON.stringify({
    checklists, kanbans, notes, medias, texts, drawings, comments, connections,
    itemIds: {
      notes: board.notes, checklists: board.checklists, texts: board.texts,
      connections: board.connections, drawings: board.drawings,
      kanbans: board.kanbans, medias: board.medias,
    },
    bg: [board.backgroundImage, board.backgroundColor, board.backgroundOverlay,
         board.backgroundOverlayColor, board.backgroundBlurLevel],
    settings: [
      { colorMode: connectionLineStore.colorMode, monochromaticColor: connectionLineStore.monochromaticColor },
      { isGridVisible: gridStore.isGridVisible, gridColor: gridStore.gridColor, zoom: gridStore.zoom,
        gridSize: gridStore.gridSize, snapEnabled: gridStore.snapEnabled },
      { isDark: themeStore.isDark, colorTheme: themeStore.colorTheme },
    ],
    zIndex: { counter: zIndexStore.counter, entries: zEntries },
  })

  return djb2Hash(payload)
}

/* ─────────────── Helpers: gather all data for a board ─────────────── */

function gatherBoardData(localBoardId: string) {
  const boardStore = useBoardStore.getState()
  const board = boardStore.boards.find(b => b.id === localBoardId)
  if (!board) return null

  const checklistStore = useChecklistStore.getState()
  const kanbanStore = useKanbanStore.getState()
  const stickyStore = useNoteStore.getState()
  const mediaStore = useMediaStore.getState()
  const textStore = useTextStore.getState()
  const drawingStore = useDrawingStore.getState()
  const commentStore = useCommentStore.getState()
  const connectionStore = useConnectionStore.getState()
  const connectionLineStore = useConnectionLineStore.getState()
  const gridStore = useGridStore.getState()
  const themeStore = useThemeStore.getState()
  const zIndexStore = useZIndexStore.getState()

  // Filter items belonging to this board by ID arrays
  const checklists = checklistStore.checklists.filter((c: any) => board.checklists.includes(c.id))
  const kanbanBoards = kanbanStore.boards.filter((k: any) => board.kanbans.includes(k.id))
  const stickyNotes = stickyStore.notes.filter((n: any) => board.notes.includes(n.id))
  const mediaItems = mediaStore.medias.filter((m: any) => board.medias.includes(m.id))
  const textElements = textStore.texts.filter((t: any) => board.texts.includes(t.id))
  const drawings = drawingStore.drawings.filter((d: any) => board.drawings.includes(d.id))
  const comments = commentStore.comments.filter((c: any) => c.boardId === localBoardId)
  const connections = connectionStore.connections.filter((c: any) => c.boardId === localBoardId)

  // Z-index data: only entries for items in this board
  const allItemIds = new Set([
    ...board.notes, ...board.checklists, ...board.texts,
    ...board.kanbans, ...board.medias, ...board.drawings,
  ])
  const zEntries = Object.entries(zIndexStore.zIndexMap)
    .filter(([id]) => allItemIds.has(id))
    .map(([itemId, zIndex]) => ({ itemId, zIndex }))

  return {
    backgroundImage:        board.backgroundImage || null,
    backgroundColor:        board.backgroundColor || null,
    backgroundOverlay:      board.backgroundOverlay || false,
    backgroundOverlayColor: board.backgroundOverlayColor || null,
    backgroundBlurLevel:    board.backgroundBlurLevel || null,
    checklists,
    kanbanBoards,
    stickyNotes,
    mediaItems,
    textElements,
    drawings,
    comments,
    connections,
    connectionLineSettings: {
      colorMode: connectionLineStore.colorMode,
      monochromaticColor: connectionLineStore.monochromaticColor,
    },
    gridSettings: {
      isGridVisible: gridStore.isGridVisible,
      gridColor: gridStore.gridColor,
      zoom: gridStore.zoom,
      gridSize: gridStore.gridSize,
      snapEnabled: gridStore.snapEnabled,
    },
    themeSettings: {
      isDark: themeStore.isDark,
      colorTheme: themeStore.colorTheme,
    },
    zIndexData: {
      counter: zIndexStore.counter,
      entries: zEntries,
    },
    itemIds: {
      notes: board.notes,
      checklists: board.checklists,
      texts: board.texts,
      connections: board.connections,
      drawings: board.drawings,
      kanbans: board.kanbans,
      medias: board.medias,
    },
  }
}

/* ─────────────── Helper: apply cloud data to local stores ─────────────── */

function applyCloudData(localBoardId: string, cloud: any) {
  const boardStore = useBoardStore.getState()
  const checklistStore = useChecklistStore.getState()
  const kanbanStore = useKanbanStore.getState()
  const stickyStore = useNoteStore.getState()
  const mediaStore = useMediaStore.getState()
  const textStore = useTextStore.getState()
  const drawingStore = useDrawingStore.getState()
  const commentStore = useCommentStore.getState()
  const connectionStore = useConnectionStore.getState()
  const connectionLineStore = useConnectionLineStore.getState()
  const gridStore = useGridStore.getState()
  const themeStore = useThemeStore.getState()
  const zIndexStore = useZIndexStore.getState()

  const board = boardStore.boards.find((b: any) => b.id === localBoardId)

  // If the local board doesn't exist, create it
  if (!board) {
    const newBoard = {
      id: localBoardId,
      userId: boardStore.currentUserId || '',
      name: cloud.name || 'Synced Board',
      createdAt: new Date(),
      lastModified: new Date(),
      notes: cloud.itemIds?.notes || [],
      checklists: cloud.itemIds?.checklists || [],
      texts: cloud.itemIds?.texts || [],
      connections: cloud.itemIds?.connections || [],
      drawings: cloud.itemIds?.drawings || [],
      kanbans: cloud.itemIds?.kanbans || [],
      medias: cloud.itemIds?.medias || [],
      backgroundImage: cloud.backgroundImage || undefined,
      backgroundColor: cloud.backgroundColor || undefined,
      backgroundOverlay: cloud.backgroundOverlay || undefined,
      backgroundOverlayColor: cloud.backgroundOverlayColor || undefined,
      backgroundBlurLevel: cloud.backgroundBlurLevel || undefined,
    }
    boardStore.boards.push(newBoard)
    useBoardStore.setState({ boards: [...boardStore.boards] })
  } else {
    // Update board metadata
    boardStore.updateBoard(localBoardId, {
      name: cloud.name || board.name,
      notes: cloud.itemIds?.notes || board.notes,
      checklists: cloud.itemIds?.checklists || board.checklists,
      texts: cloud.itemIds?.texts || board.texts,
      connections: cloud.itemIds?.connections || board.connections,
      drawings: cloud.itemIds?.drawings || board.drawings,
      kanbans: cloud.itemIds?.kanbans || board.kanbans,
      medias: cloud.itemIds?.medias || board.medias,
      backgroundImage: cloud.backgroundImage || undefined,
      backgroundColor: cloud.backgroundColor || undefined,
      backgroundOverlay: cloud.backgroundOverlay ?? undefined,
      backgroundOverlayColor: cloud.backgroundOverlayColor || undefined,
      backgroundBlurLevel: cloud.backgroundBlurLevel || undefined,
    })
  }

  // Replace content in each store — remove old items for this board, add cloud items

  // Checklists
  if (cloud.checklists) {
    const boardChecklistIds = new Set(cloud.itemIds?.checklists || [])
    const otherChecklists = checklistStore.checklists.filter((c: any) => !boardChecklistIds.has(c.id))
    useChecklistStore.setState({ checklists: [...otherChecklists, ...cloud.checklists] })
  }

  // Kanban boards
  if (cloud.kanbanBoards) {
    const boardKanbanIds = new Set(cloud.itemIds?.kanbans || [])
    const otherKanbans = kanbanStore.boards.filter((k: any) => !boardKanbanIds.has(k.id))
    useKanbanStore.setState({ boards: [...otherKanbans, ...cloud.kanbanBoards] })
  }

  // Sticky notes
  if (cloud.stickyNotes) {
    const boardNoteIds = new Set(cloud.itemIds?.notes || [])
    const otherNotes = stickyStore.notes.filter((n: any) => !boardNoteIds.has(n.id))
    useNoteStore.setState({ notes: [...otherNotes, ...cloud.stickyNotes] })
  }

  // Media
  if (cloud.mediaItems) {
    const boardMediaIds = new Set(cloud.itemIds?.medias || [])
    const otherMedia = mediaStore.medias.filter((m: any) => !boardMediaIds.has(m.id))
    useMediaStore.setState({ medias: [...otherMedia, ...cloud.mediaItems] })
  }

  // Texts
  if (cloud.textElements) {
    const boardTextIds = new Set(cloud.itemIds?.texts || [])
    const otherTexts = textStore.texts.filter((t: any) => !boardTextIds.has(t.id))
    useTextStore.setState({ texts: [...otherTexts, ...cloud.textElements] })
  }

  // Drawings
  if (cloud.drawings) {
    const boardDrawingIds = new Set(cloud.itemIds?.drawings || [])
    const otherDrawings = drawingStore.drawings.filter((d: any) => !boardDrawingIds.has(d.id))
    useDrawingStore.setState({ drawings: [...otherDrawings, ...cloud.drawings] })
  }

  // Comments
  if (cloud.comments) {
    const otherComments = commentStore.comments.filter((c: any) => c.boardId !== localBoardId)
    useCommentStore.setState({ comments: [...otherComments, ...cloud.comments] })
  }

  // Connections
  if (cloud.connections) {
    const otherConnections = connectionStore.connections.filter((c: any) => c.boardId !== localBoardId)
    useConnectionStore.setState({ connections: [...otherConnections, ...cloud.connections] })
  }

  // Connection line settings
  if (cloud.connectionLineSettings) {
    connectionLineStore.setColorMode(cloud.connectionLineSettings.colorMode)
    connectionLineStore.setMonochromaticColor(cloud.connectionLineSettings.monochromaticColor)
  }

  // Grid settings
  if (cloud.gridSettings) {
    if (cloud.gridSettings.isGridVisible !== gridStore.isGridVisible) gridStore.toggleGrid()
    gridStore.setGridColor(cloud.gridSettings.gridColor)
    gridStore.setGridSize(cloud.gridSettings.gridSize)
    if (cloud.gridSettings.snapEnabled !== gridStore.snapEnabled) gridStore.toggleSnap()
    gridStore.setZoom(cloud.gridSettings.zoom)
  }

  // Theme settings
  if (cloud.themeSettings) {
    if (cloud.themeSettings.isDark !== themeStore.isDark) themeStore.toggleDark()
    themeStore.setColorTheme(cloud.themeSettings.colorTheme)
  }

  // Z-index data
  if (cloud.zIndexData) {
    const newMap = { ...zIndexStore.zIndexMap }
    for (const entry of cloud.zIndexData.entries || []) {
      newMap[entry.itemId] = entry.zIndex
    }
    useZIndexStore.setState({
      counter: Math.max(zIndexStore.counter, cloud.zIndexData.counter || 0),
      zIndexMap: newMap,
    })
  }
}

/* ─────────────────────── Store ─────────────────────── */

export const useBoardSyncStore = create<BoardSyncStore>()((set, get) => ({
  isSyncing: false,
  isInitialLoading: false,
  hasLoadedFromCloud: false,
  lastSyncedAt: {},
  contentHashes: {},
  dirtyBoards: new Set<string>(),
  staleBoards: new Set<string>(),
  cloudBoards: [],
  error: null,

  /* ── Push to cloud ── */
  syncBoardToCloud: async (localBoardId: string) => {
    const boardStore = useBoardStore.getState()
    const board = boardStore.boards.find(b => b.id === localBoardId)
    if (!board) {
      toast.error('Board not found')
      return
    }

    set({ isSyncing: true, error: null })

    try {
      const boardData = gatherBoardData(localBoardId)
      if (!boardData) throw new Error('Could not gather board data')

      const res = await fetch('/api/boards/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localBoardId,
          name: board.name,
          board: boardData,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to sync')
      }

      const data = await res.json()
      const newDirty = new Set(get().dirtyBoards)
      newDirty.delete(localBoardId)
      set(s => ({
        isSyncing: false,
        lastSyncedAt: { ...s.lastSyncedAt, [localBoardId]: new Date(data.lastSyncedAt) },
        contentHashes: { ...s.contentHashes, [localBoardId]: data.contentHash || '' },
        dirtyBoards: newDirty,
      }))
      toast.success('Board synced to cloud')
    } catch (error: any) {
      set({ isSyncing: false, error: error.message })
      toast.error(`Sync failed: ${error.message}`)
    }
  },

  /* ── Pull from cloud ── */
  loadBoardFromCloud: async (localBoardId: string) => {
    set({ isSyncing: true, error: null })

    try {
      const res = await fetch(`/api/boards/sync/${localBoardId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to load')
      }

      const { board } = await res.json()
      applyCloudData(localBoardId, board)

      set(s => ({
        isSyncing: false,
        lastSyncedAt: { ...s.lastSyncedAt, [localBoardId]: new Date(board.lastSyncedAt) },
      }))
      toast.success('Board loaded from cloud')
    } catch (error: any) {
      set({ isSyncing: false, error: error.message })
      toast.error(`Load failed: ${error.message}`)
    }
  },

  /* ── Delete from cloud ── */
  deleteBoardFromCloud: async (localBoardId: string) => {
    try {
      const res = await fetch(`/api/boards/sync/${localBoardId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete from cloud')
      }

      set(s => {
        const updated = { ...s.lastSyncedAt }
        delete updated[localBoardId]
        return { lastSyncedAt: updated }
      })
      toast.success('Board removed from cloud')
    } catch (error: any) {
      toast.error(`Cloud delete failed: ${error.message}`)
    }
  },

  /* ── List all cloud boards ── */
  listCloudBoards: async () => {
    try {
      const res = await fetch('/api/boards/sync')
      if (!res.ok) return

      const data = await res.json()
      const all: CloudBoardMeta[] = [
        ...(data.owned || []),
        ...(data.shared || []).map((b: any) => ({ ...b, _shared: true })),
      ]
      set({ cloudBoards: all })
    } catch {
      // silent
    }
  },

  /* ── Load ALL cloud boards on login (hash-based smart sync) ── */
  loadAllCloudBoards: async () => {
    if (get().hasLoadedFromCloud || get().isInitialLoading) return

    set({ isInitialLoading: true, error: null })

    try {
      // Step 1: Lightweight check — only fetches boardId + contentHash (~50 bytes each)
      const checkRes = await fetch('/api/boards/sync/check')
      if (!checkRes.ok) {
        set({ isInitialLoading: false, hasLoadedFromCloud: true })
        return
      }

      const { boards: cloudHashes } = await checkRes.json()
      if (!cloudHashes || cloudHashes.length === 0) {
        set({ isInitialLoading: false, hasLoadedFromCloud: true })
        return
      }

      // Step 2: Compare hashes — figure out which boards actually need fetching
      const boardsToFetch: string[] = []
      const knownHashes = get().contentHashes

      for (const entry of cloudHashes) {
        const localBoardId = entry.localBoardId
        if (!localBoardId) continue

        const boardStore = useBoardStore.getState()
        const localBoard = boardStore.boards.find((b: any) => b.id === localBoardId)

        if (!localBoard) {
          // Board doesn't exist locally — must fetch
          boardsToFetch.push(localBoardId)
        } else {
          // Board exists — compare hashes
          const localHash = computeHash(localBoardId)
          const cloudHash = entry.contentHash || ''
          const lastKnownHash = knownHashes[localBoardId] || ''

          // Fetch if: cloud hash differs from our last-known cloud hash,
          // AND cloud hash differs from current local content
          if (cloudHash && cloudHash !== localHash && cloudHash !== lastKnownHash) {
            boardsToFetch.push(localBoardId)
          }
        }
      }

      if (boardsToFetch.length === 0) {
        // Everything is up to date — update metadata only
        const all: CloudBoardMeta[] = cloudHashes.map((h: any) => ({
          _id: '',
          localBoardId: h.localBoardId,
          name: h.name,
          visibility: 'private',
          lastSyncedAt: '',
          createdAt: '',
          updatedAt: '',
        }))
        set({ cloudBoards: all, isInitialLoading: false, hasLoadedFromCloud: true })
        return
      }

      // Step 3: Fetch ONLY the boards that changed (one request each)
      let loadedCount = 0
      const newHashes = { ...get().contentHashes }

      for (const localBoardId of boardsToFetch) {
        try {
          const res = await fetch(`/api/boards/sync/${localBoardId}`)
          if (!res.ok) continue

          const { board } = await res.json()
          applyCloudData(localBoardId, board)
          loadedCount++

          // Store the cloud hash so we don't re-fetch next time
          const cloudEntry = cloudHashes.find((h: any) => h.localBoardId === localBoardId)
          if (cloudEntry?.contentHash) {
            newHashes[localBoardId] = cloudEntry.contentHash
          }
        } catch (err) {
          console.error(`Failed to load board ${localBoardId} from cloud:`, err)
        }
      }

      set({ contentHashes: newHashes })

      // Update cloud boards metadata
      const all: CloudBoardMeta[] = cloudHashes.map((h: any) => ({
        _id: '',
        localBoardId: h.localBoardId,
        name: h.name,
        visibility: 'private',
        contentHash: h.contentHash,
        lastSyncedAt: '',
        createdAt: '',
        updatedAt: '',
      }))
      set({ cloudBoards: all })

      // Select a board if none selected
      if (loadedCount > 0) {
        const currentId = useBoardStore.getState().currentBoardId
        const currentUserId = useBoardStore.getState().currentUserId
        if (!currentId && currentUserId) {
          const userBoards = useBoardStore.getState().boards.filter(
            (b: any) => b.userId === currentUserId
          )
          if (userBoards.length > 0) {
            useBoardStore.getState().setCurrentBoard(userBoards[0].id)
          }
        }

        toast.success(
          loadedCount === 1
            ? '1 board synced from cloud'
            : `${loadedCount} boards synced from cloud`
        )
      }

      set({ isInitialLoading: false, hasLoadedFromCloud: true })
    } catch (error: any) {
      console.error('Cloud board auto-load error:', error)
      set({ isInitialLoading: false, hasLoadedFromCloud: true, error: error.message })
    }
  },

  /* ── Mark a board as having unsaved local changes ── */
  markDirty: (localBoardId: string) => {
    const newDirty = new Set(get().dirtyBoards)
    newDirty.add(localBoardId)
    set({ dirtyBoards: newDirty })
  },

  /* ── Compute local content hash for a board ── */
  computeLocalHash: (localBoardId: string) => {
    return computeHash(localBoardId)
  },

  /* ── Push all dirty boards to cloud (debounced caller) ── */
  syncDirtyBoards: async () => {
    const { dirtyBoards, contentHashes } = get()
    if (dirtyBoards.size === 0) return

    const boardsToSync = Array.from(dirtyBoards)

    for (const localBoardId of boardsToSync) {
      // Recompute hash — only sync if actually different from cloud
      const localHash = computeHash(localBoardId)
      const cloudHash = contentHashes[localBoardId] || ''

      if (localHash === cloudHash) {
        // Hash matches cloud — just remove dirty flag, no network call
        const newDirty = new Set(get().dirtyBoards)
        newDirty.delete(localBoardId)
        set({ dirtyBoards: newDirty })
        continue
      }

      // Hash differs — actually push to cloud
      await get().syncBoardToCloud(localBoardId)
    }
  },

  /* ── Check for stale boards (login + tab-focus, lightweight) ── */
  /* Hits /sync/check (~50 bytes/board). For boards that don't exist locally     */
  /* (new device), auto-loads them. For existing boards with changes, marks them  */
  /* stale and shows a banner so the user can refresh when ready.                */
  checkForStaleBoards: async () => {
    if (get().isSyncing || get().isInitialLoading) return

    try {
      const res = await fetch('/api/boards/sync/check')
      if (!res.ok) return

      const { boards: cloudEntries } = await res.json()
      if (!cloudEntries || cloudEntries.length === 0) return

      const currentHashes = get().contentHashes
      const newStale = new Set(get().staleBoards)
      const boardsToAutoLoad: string[] = []  // boards that don't exist locally at all

      for (const entry of cloudEntries) {
        const { localBoardId, contentHash: cloudHash } = entry
        if (!localBoardId || !cloudHash) continue

        // Skip boards with pending local changes (local wins)
        if (get().dirtyBoards.has(localBoardId)) continue

        const boardStore = useBoardStore.getState()
        const localBoard = boardStore.boards.find((b: any) => b.id === localBoardId)

        if (!localBoard) {
          // Board doesn't exist locally (new device) — auto-load silently
          boardsToAutoLoad.push(localBoardId)
          continue
        }

        const lastKnownCloudHash = currentHashes[localBoardId] || ''

        // Cloud hash changed since we last synced
        if (cloudHash !== lastKnownCloudHash) {
          // Board exists — double-check local content doesn't already match
          const localHash = computeHash(localBoardId)
          if (localHash !== cloudHash) {
            newStale.add(localBoardId)
          } else {
            // Already matches — update hash silently
            set(s => ({
              contentHashes: { ...s.contentHashes, [localBoardId]: cloudHash },
            }))
          }
        }
      }

      if (newStale.size !== get().staleBoards.size) {
        set({ staleBoards: newStale })
      }

      // Auto-load boards that don't exist locally (new device scenario)
      if (boardsToAutoLoad.length > 0) {
        const newHashes = { ...get().contentHashes }
        let loadedCount = 0

        for (const localBoardId of boardsToAutoLoad) {
          try {
            const boardRes = await fetch(`/api/boards/sync/${localBoardId}`)
            if (!boardRes.ok) continue

            const { board } = await boardRes.json()
            applyCloudData(localBoardId, board)
            loadedCount++

            const cloudEntry = cloudEntries.find((h: any) => h.localBoardId === localBoardId)
            if (cloudEntry?.contentHash) {
              newHashes[localBoardId] = cloudEntry.contentHash
            }
          } catch (err) {
            console.error(`Auto-load: failed to load board ${localBoardId}:`, err)
          }
        }

        set({ contentHashes: newHashes })

        // Select first board if none selected
        if (loadedCount > 0) {
          const currentId = useBoardStore.getState().currentBoardId
          const currentUserId = useBoardStore.getState().currentUserId
          if (!currentId && currentUserId) {
            const userBoards = useBoardStore.getState().boards.filter(
              (b: any) => b.userId === currentUserId
            )
            if (userBoards.length > 0) {
              useBoardStore.getState().setCurrentBoard(userBoards[0].id)
            }
          }

          toast.success(
            loadedCount === 1
              ? '1 board loaded from cloud'
              : `${loadedCount} boards loaded from cloud`
          )
        }
      }
    } catch {
      // Silent — check failures shouldn't interrupt the user
    }
  },

  /* ── Refresh stale boards (user-triggered) ── */
  refreshStaleBoards: async () => {
    const { staleBoards } = get()
    if (staleBoards.size === 0) return

    set({ isSyncing: true })

    const boardsToFetch = Array.from(staleBoards)
    const newHashes = { ...get().contentHashes }
    let updatedCount = 0

    for (const localBoardId of boardsToFetch) {
      try {
        const res = await fetch(`/api/boards/sync/${localBoardId}`)
        if (!res.ok) continue

        const { board } = await res.json()
        applyCloudData(localBoardId, board)
        updatedCount++

        if (board.contentHash) {
          newHashes[localBoardId] = board.contentHash
        }
      } catch (err) {
        console.error(`Refresh: failed to load board ${localBoardId}:`, err)
      }
    }

    set({
      isSyncing: false,
      staleBoards: new Set<string>(),
      contentHashes: newHashes,
    })

    if (updatedCount > 0) {
      toast.success(
        updatedCount === 1
          ? 'Board updated from cloud'
          : `${updatedCount} boards updated from cloud`
      )
    }
  },

  /* ── Dismiss stale notification for a board ── */
  dismissStale: (localBoardId: string) => {
    const newStale = new Set(get().staleBoards)
    newStale.delete(localBoardId)
    set({ staleBoards: newStale })
  },

  /* ── Sharing ── */
  getShareSettings: async (localBoardId: string) => {
    try {
      const res = await fetch(`/api/boards/sync/${localBoardId}/share`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },

  updateVisibility: async (localBoardId, visibility) => {
    try {
      const res = await fetch(`/api/boards/sync/${localBoardId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      })
      if (!res.ok) throw new Error('Failed to update visibility')
      const data = await res.json()
      toast.success(`Board is now ${visibility}`)
      return data
    } catch (error: any) {
      toast.error(error.message)
    }
  },

  addShareUser: async (localBoardId, email, permission) => {
    try {
      const res = await fetch(`/api/boards/sync/${localBoardId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addEmail: email, permission }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to share')
      }
      toast.success(`Shared with ${email}`)
    } catch (error: any) {
      toast.error(error.message)
    }
  },

  removeShareUser: async (localBoardId, userId) => {
    try {
      await fetch(`/api/boards/sync/${localBoardId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeUserId: userId }),
      })
      toast.success('User removed from shared list')
    } catch (error: any) {
      toast.error(error.message)
    }
  },

  updateSharePermission: async (localBoardId, userId, permission) => {
    try {
      await fetch(`/api/boards/sync/${localBoardId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatePermission: { userId, permission } }),
      })
      toast.success('Permission updated')
    } catch (error: any) {
      toast.error(error.message)
    }
  },
}))

/* ── Export helper for sendBeacon on page close ── */
export function gatherBoardDataForBeacon(localBoardId: string) {
  const boardStore = useBoardStore.getState()
  const board = boardStore.boards.find(b => b.id === localBoardId)
  if (!board) return null

  const data = gatherBoardData(localBoardId)
  if (!data) return null

  return {
    localBoardId,
    name: board.name,
    board: data,
  }
}