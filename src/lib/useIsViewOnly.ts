/**
 * useIsViewOnly — returns true when the current board is view-only.
 *
 * Uses the persisted boardPermissions so the value is correct even
 * before the first cloud fetch completes after a page reload.
 */

import { useBoardStore } from '@/store/boardStore'
import { useBoardSyncStore } from '@/store/boardSyncStore'

export function useIsViewOnly(): boolean {
  const currentBoardId = useBoardStore((s) => s.currentBoardId)
  const perm = useBoardSyncStore(
    (s) => (currentBoardId ? s.boardPermissions[currentBoardId] : undefined) || 'owner',
  )
  return perm === 'view'
}
