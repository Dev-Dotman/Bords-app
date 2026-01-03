# Connection System Fixes

## Critical Loopholes Identified:

### 1. **Orphaned Connections**
**Problem:** Deleting items doesn't remove their connections
**Fix:** Add cleanup in each component's delete handler

```typescript
// In StickyNote.tsx, Checklist.tsx, etc.
const handleDelete = () => {
  // Remove all connections for this item
  const itemConnections = connections.filter(
    conn => conn.fromId === id || conn.toId === id
  )
  itemConnections.forEach(conn => removeConnection(conn.id))
  
  // Then delete the item
  deleteNote(id) // or deleteChecklist, etc.
}
```

### 2. **Missing DOM Elements**
**Problem:** ConnectionLine fails silently when indicators don't exist
**Fix:** Add error handling and retry logic

```typescript
// In ConnectionLine component
const MAX_RETRIES = 10
const RETRY_DELAY = 100

const updatePath = (retryCount = 0) => {
  const fromIndicator = document.querySelector(`[data-connection-id="${fromId}-indicator"]`)
  const toIndicator = document.querySelector(`[data-connection-id="${toId}-indicator"]`)
  
  if (!fromIndicator || !toIndicator) {
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => updatePath(retryCount + 1), RETRY_DELAY)
    } else {
      // Both items might be deleted - remove connection
      removeConnection(connectionId)
    }
    return
  }
  
  // ... rest of path calculation
}
```

### 3. **Duplicate Connection Prevention**
**Problem:** Can create multiple connections between same items
**Fix:** Check for existing connections before adding

```typescript
addConnection: (fromId, toId, fromType, toType, positions, boardId) => {
  set((state) => {
    // Check if connection already exists
    const exists = state.connections.some(
      conn => 
        (conn.fromId === fromId && conn.toId === toId) ||
        (conn.fromId === toId && conn.toId === fromId)
    )
    
    if (exists) {
      console.warn('Connection already exists')
      return { selectedItems: [] }
    }
    
    // ... rest of add logic
  })
}
```

### 4. **Validate Items Exist**
**Problem:** No check if items exist when creating connection
**Fix:** Validate items in current board

```typescript
// In Connections.tsx connect button
onClick={() => {
  if (selectedItems.length === 2) {
    // Validate both items exist in DOM
    const item1Exists = document.querySelector(`[data-node-id="${selectedItems[0].id}"]`)
    const item2Exists = document.querySelector(`[data-node-id="${selectedItems[1].id}"]`)
    
    if (!item1Exists || !item2Exists) {
      toast.error('Cannot connect: One or more items not found')
      return
    }
    
    addConnection(...)
  }
}}
```

### 5. **Debounce Path Updates**
**Problem:** Excessive re-renders during drag
**Fix:** Add debouncing to update function

```typescript
// In ConnectionLine component
import { debounce } from 'lodash' // or implement your own

const debouncedUpdate = useCallback(
  debounce(() => updatePath(), 16), // ~60fps
  [fromId, toId]
)

// Use debouncedUpdate instead of updatePath in observers
```

### 6. **Cleanup on Board Switch**
**Problem:** Connections linger when switching boards
**Fix:** Clear invalid connections when board changes

```typescript
// In page.tsx or wherever board changes
useEffect(() => {
  if (currentBoardId) {
    // Get all items in current board
    const currentItemIds = new Set([
      ...filteredNotes.map(n => n.id),
      ...filteredChecklists.map(c => c.id),
      ...filteredTexts.map(t => t.id),
      ...filteredKanbans.map(k => k.id),
      ...filteredMedias.map(m => m.id),
    ])
    
    // Remove connections to items not in current board
    connections
      .filter(conn => conn.boardId === currentBoardId)
      .forEach(conn => {
        if (!currentItemIds.has(conn.fromId) || !currentItemIds.has(conn.toId)) {
          removeConnection(conn.id)
        }
      })
  }
}, [currentBoardId])
```

### 7. **Connection Persistence**
**Problem:** Connections saved but items might be deleted
**Fix:** Validate on load

```typescript
// Add to connectionStore
export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      // ... existing store
      
      // Add validation method
      validateConnections: (validItemIds: string[]) => {
        const validIds = new Set(validItemIds)
        set((state) => ({
          connections: state.connections.filter(
            conn => validIds.has(conn.fromId) && validIds.has(conn.toId)
          )
        }))
      }
    }),
    {
      name: 'connection-storage',
      onRehydrateStorage: () => (state) => {
        // Validate connections after rehydration
        if (state) {
          // You'll need to call validateConnections from page.tsx
          // after all items are loaded
        }
      }
    }
  )
)
```

## Priority Order:

1. **HIGH:** Fix orphaned connections (item deletion cleanup)
2. **HIGH:** Validate items exist before creating connections
3. **MEDIUM:** Add retry logic for missing DOM elements
4. **MEDIUM:** Prevent duplicate connections
5. **LOW:** Debounce path updates for performance
6. **LOW:** Cleanup on board switch

Would you like me to implement any of these fixes?
