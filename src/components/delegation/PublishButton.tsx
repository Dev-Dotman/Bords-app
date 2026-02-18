'use client'

import { useState } from 'react'
import { Send, Check, Loader2 } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useDelegationStore } from '@/store/delegationStore'
import { useBoardStore } from '@/store/boardStore'
import { motion, AnimatePresence } from 'framer-motion'

export function PublishButton() {
  const isDark = useThemeStore((s) => s.isDark)
  const { unpublishedChanges, publishBord, getBordForLocalBoard, isPublishing, assignments } = useDelegationStore()
  const currentBoardId = useBoardStore((s) => s.currentBoardId)
  const [showSuccess, setShowSuccess] = useState(false)
  const [publishResult, setPublishResult] = useState<{ totalDeployed: number } | null>(null)

  const bord = currentBoardId ? getBordForLocalBoard(currentBoardId) : undefined

  // Only show if board is linked and has draft assignments
  const draftCount = assignments.filter((a) => a.status === 'draft' && !a.isDeleted).length
  if (!bord || (draftCount === 0 && unpublishedChanges.changeCount === 0)) return null

  const handlePublish = async () => {
    const result = await publishBord(bord._id)
    if (result) {
      setPublishResult({ totalDeployed: result.newAssignments + result.reassignments })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  return (
    <div className="relative pointer-events-auto">
      <AnimatePresence>
        {showSuccess && publishResult && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium shadow-xl ${
              isDark
                ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-700/50'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Check size={14} />
              {publishResult.totalDeployed} task{publishResult.totalDeployed !== 1 ? 's' : ''} deployed
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handlePublish}
        disabled={isPublishing}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg border transition-all ${
          isPublishing
            ? isDark
              ? 'bg-zinc-700 border-zinc-600 text-zinc-400'
              : 'bg-zinc-100 border-zinc-200 text-zinc-400'
            : isDark
              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 text-white'
              : 'bg-black hover:bg-zinc-800 border-black/10 text-white'
        }`}
      >
        {isPublishing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {isPublishing ? 'Publishing...' : 'Publish'}

        {/* Badge */}
        {draftCount > 0 && !isPublishing && (
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
            isDark
              ? 'bg-emerald-400/20 text-emerald-300'
              : 'bg-white/20 text-white'
          }`}>
            {draftCount}
          </span>
        )}
      </button>

      {/* Unpublished changes indicator */}
      {unpublishedChanges.changeCount > 0 && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          isDark ? 'bg-amber-500' : 'bg-amber-400'
        } ring-2 ${isDark ? 'ring-zinc-800' : 'ring-white'}`} />
      )}
    </div>
  )
}
