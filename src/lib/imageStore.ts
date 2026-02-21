/**
 * IndexedDB-based storage for large binary data (background images).
 * 
 * Background images are stored as base64 data URLs which can be 2-4MB each.
 * localStorage has a ~5-10MB total budget, so storing images there causes
 * quota exceeded errors → silent failures → blank screens.
 * 
 * This module provides a simple key-value store backed by IndexedDB,
 * which has a much higher storage limit (typically 50% of disk).
 */

const DB_NAME = 'boards-images'
const DB_VERSION = 1
const STORE_NAME = 'images'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })

  return dbPromise
}

/**
 * Store a background image for a board.
 * @param boardId - The board's ID
 * @param dataUrl - The base64 data URL (or undefined to remove)
 */
export async function saveBackgroundImage(boardId: string, dataUrl: string | undefined): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    if (dataUrl) {
      store.put(dataUrl, `bg-${boardId}`)
    } else {
      store.delete(`bg-${boardId}`)
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('[imageStore] Failed to save background image:', e)
  }
}

/**
 * Load a background image for a board.
 * @param boardId - The board's ID
 * @returns The data URL string, or undefined if not found
 */
export async function loadBackgroundImage(boardId: string): Promise<string | undefined> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(`bg-${boardId}`)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? undefined)
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('[imageStore] Failed to load background image:', e)
    return undefined
  }
}

/**
 * Delete a background image for a board.
 * @param boardId - The board's ID
 */
export async function deleteBackgroundImage(boardId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(`bg-${boardId}`)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('[imageStore] Failed to delete background image:', e)
  }
}

/**
 * Migrate any base64 background images from Zustand/localStorage to IndexedDB.
 * Call once on app start. Clears the data URL from the board store after migration.
 */
export async function migrateBackgroundImages(
  boards: Array<{ id: string; backgroundImage?: string }>,
  clearImage: (boardId: string) => void
): Promise<void> {
  for (const board of boards) {
    if (board.backgroundImage && board.backgroundImage.startsWith('data:')) {
      await saveBackgroundImage(board.id, board.backgroundImage)
      clearImage(board.id)
    }
  }
}
