import { useState, useEffect } from 'react'
import { X, Download, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useExportStore } from '../store/exportStore'
import { useBoardStore } from '../store/boardStore'
import { useThemeStore } from '../store/themeStore'
import { useNoteStore } from '../store/stickyNoteStore'
import { useChecklistStore } from '../store/checklistStore'
import { useTextStore } from '../store/textStore'
import { useKanbanStore } from '../store/kanbanStore'
import { useMediaStore } from '../store/mediaStore'
import { useDrawingStore } from '../store/drawingStore'
import { toPng } from 'html-to-image'

export function ExportModal() {
  const { isExportModalOpen, closeExportModal } = useExportStore()
  const { currentBoardId, boards } = useBoardStore()
  const isDark = useThemeStore((state) => state.isDark)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png'>('png')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { notes } = useNoteStore()
  const { checklists } = useChecklistStore()
  const { texts } = useTextStore()
  const { boards: kanbanBoards } = useKanbanStore()
  const { medias } = useMediaStore()
  const { drawings } = useDrawingStore()

  const currentBoard = boards.find(b => b.id === currentBoardId)
  const boardName = currentBoard?.name || 'Untitled Board'

  // Get items for current board - filter by board membership
  const filteredNotes = notes.filter(n => currentBoard?.notes.includes(n.id))
  const filteredChecklists = checklists.filter(c => currentBoard?.checklists.includes(c.id))
  const filteredTexts = texts.filter(t => currentBoard?.texts.includes(t.id))
  const filteredKanbans = kanbanBoards.filter(k => currentBoard?.kanbans.includes(k.id))
  const filteredMedias = medias.filter(m => currentBoard?.medias.includes(m.id))
  const filteredDrawings = drawings.filter(d => currentBoard?.drawings.includes(d.id))
  const totalItems = filteredNotes.length + filteredChecklists.length + filteredTexts.length + filteredKanbans.length + filteredMedias.length + filteredDrawings.length

  // Generate preview when modal opens
  useEffect(() => {
    if (isExportModalOpen) {
      generatePreview()
    } else {
      setPreviewUrl(null)
    }
  }, [isExportModalOpen])

  const generatePreview = async () => {
    try {
      const canvasElement = document.querySelector('[data-board-canvas]') as HTMLElement
      if (!canvasElement) {
        console.error('Canvas element not found')
        return
      }

      // Calculate bounds from actual store data, not DOM positions
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      
      // Check all notes
      filteredNotes.forEach(note => {
        const element = document.querySelector(`[data-node-id="${note.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 192
        const height = element?.offsetHeight || 128
        minX = Math.min(minX, note.position.x)
        minY = Math.min(minY, note.position.y)
        maxX = Math.max(maxX, note.position.x + width)
        maxY = Math.max(maxY, note.position.y + height)
      })

      // Check all checklists
      filteredChecklists.forEach(checklist => {
        const element = document.querySelector(`[data-node-id="${checklist.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 300
        const height = element?.offsetHeight || 200
        minX = Math.min(minX, checklist.position.x)
        minY = Math.min(minY, checklist.position.y)
        maxX = Math.max(maxX, checklist.position.x + width)
        maxY = Math.max(maxY, checklist.position.y + height)
      })

      // Check all texts
      filteredTexts.forEach(text => {
        const element = document.querySelector(`[data-node-id="${text.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 200
        const height = element?.offsetHeight || 100
        minX = Math.min(minX, text.position.x)
        minY = Math.min(minY, text.position.y)
        maxX = Math.max(maxX, text.position.x + width)
        maxY = Math.max(maxY, text.position.y + height)
      })

      // Check all kanbans
      filteredKanbans.forEach(kanban => {
        const element = document.querySelector(`[data-node-id="${kanban.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 800
        const height = element?.offsetHeight || 400
        minX = Math.min(minX, kanban.position.x)
        minY = Math.min(minY, kanban.position.y)
        maxX = Math.max(maxX, kanban.position.x + width)
        maxY = Math.max(maxY, kanban.position.y + height)
      })

      // Check all media items
      filteredMedias.forEach(media => {
        const element = document.querySelector(`[data-node-id="${media.id}"]`) as HTMLElement
        const actualWidth = media.type === 'video' ? (media.width || 300) * 0.7 : (media.width || 250)
        const width = element?.offsetWidth || actualWidth
        const height = element?.offsetHeight || media.height || 300
        minX = Math.min(minX, media.position.x)
        minY = Math.min(minY, media.position.y)
        maxX = Math.max(maxX, media.position.x + width)
        maxY = Math.max(maxY, media.position.y + height)
      })

      // Check all drawings
      filteredDrawings.forEach(drawing => {
        drawing.paths.forEach(path => {
          path.points.forEach(point => {
            minX = Math.min(minX, point.x)
            minY = Math.min(minY, point.y)
            maxX = Math.max(maxX, point.x)
            maxY = Math.max(maxY, point.y)
          })
        })
      })

      // If no items, use default bounds
      if (!isFinite(minX)) {
        minX = 0
        minY = 0
        maxX = 800
        maxY = 600
      }

      // Add board title at top
      minY = Math.min(minY, 32)
      minX = Math.min(minX, 32)

      // Ensure bottom padding ends 10px below the bottommost item
      const padding = 100
      const bottomPadding = 100
      const width = maxX - minX + padding * 2
      const height = maxY - minY + padding * 5 + bottomPadding

      console.log('Preview bounds:', { width, height, minX, minY, maxX, maxY, totalItems })

      if (width <= 0 || height <= 0) {
        console.error('Invalid dimensions', { width, height })
        return
      }

      // Scroll to top-left to reset connection line positions
      const scrollContainer = document.querySelector('.fixed.inset-0.overflow-auto') as HTMLElement
      const originalScrollTop = scrollContainer?.scrollTop || 0
      const originalScrollLeft = scrollContainer?.scrollLeft || 0
      
      if (scrollContainer) {
        scrollContainer.scrollTop = 0
        scrollContainer.scrollLeft = 0
      }

      // Wait for connection lines to re-render
      await new Promise(resolve => setTimeout(resolve, 100))

      const preview = await toPng(canvasElement, {
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        width: width,
        height: height,
        style: {
          transform: `translate(${-(minX - padding)}px, ${-(minY - padding)}px)`,
        },
        pixelRatio: 1,
        cacheBust: true,
        skipAutoScale: true,
        filter: (node) => {
          // Skip iframes (YouTube embeds) - thumbnail will be visible instead
          if (node.tagName === 'IFRAME') return false
          return true
        },
      })

      // Restore scroll position
      if (scrollContainer) {
        scrollContainer.scrollTop = originalScrollTop
        scrollContainer.scrollLeft = originalScrollLeft
      }

      setPreviewUrl(preview)
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const canvasElement = document.querySelector('[data-board-canvas]') as HTMLElement
      
      if (!canvasElement) {
        console.error('Canvas element not found')
        setIsExporting(false)
        return
      }

      // Calculate bounds from actual store data and element sizes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      
      // Check all notes
      filteredNotes.forEach(note => {
        const element = document.querySelector(`[data-node-id="${note.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 192
        const height = element?.offsetHeight || 128
        minX = Math.min(minX, note.position.x)
        minY = Math.min(minY, note.position.y)
        maxX = Math.max(maxX, note.position.x + width)
        maxY = Math.max(maxY, note.position.y + height)
      })

      // Check all checklists
      filteredChecklists.forEach(checklist => {
        const element = document.querySelector(`[data-node-id="${checklist.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 300
        const height = element?.offsetHeight || 200
        minX = Math.min(minX, checklist.position.x)
        minY = Math.min(minY, checklist.position.y)
        maxX = Math.max(maxX, checklist.position.x + width)
        maxY = Math.max(maxY, checklist.position.y + height)
      })

      // Check all texts
      filteredTexts.forEach(text => {
        const element = document.querySelector(`[data-node-id="${text.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 200
        const height = element?.offsetHeight || 100
        minX = Math.min(minX, text.position.x)
        minY = Math.min(minY, text.position.y)
        maxX = Math.max(maxX, text.position.x + width)
        maxY = Math.max(maxY, text.position.y + height)
      })

      // Check all kanbans
      filteredKanbans.forEach(kanban => {
        const element = document.querySelector(`[data-node-id="${kanban.id}"]`) as HTMLElement
        const width = element?.offsetWidth || 800
        const height = element?.offsetHeight || 400
        minX = Math.min(minX, kanban.position.x)
        minY = Math.min(minY, kanban.position.y)
        maxX = Math.max(maxX, kanban.position.x + width)
        maxY = Math.max(maxY, kanban.position.y + height)
      })

      // Check all drawings
      filteredDrawings.forEach(drawing => {
        drawing.paths.forEach(path => {
          path.points.forEach(point => {
            minX = Math.min(minX, point.x)
            minY = Math.min(minY, point.y)
            maxX = Math.max(maxX, point.x)
            maxY = Math.max(maxY, point.y)
          })
        })
      })

      // Check all media items
      filteredMedias.forEach(media => {
        const element = document.querySelector(`[data-node-id="${media.id}"]`) as HTMLElement
        const actualWidth = media.type === 'video' ? (media.width || 300) * 0.7 : (media.width || 250)
        const width = element?.offsetWidth || actualWidth
        const height = element?.offsetHeight || media.height || 300
        minX = Math.min(minX, media.position.x)
        minY = Math.min(minY, media.position.y)
        maxX = Math.max(maxX, media.position.x + width)
        maxY = Math.max(maxY, media.position.y + height)
      })

      // If no items, show error
      if (!isFinite(minX)) {
        console.error('No items to export')
        setIsExporting(false)
        return
      }

      // Add board title at top
      minY = Math.min(minY, 32)
      minX = Math.min(minX, 32)

      // Ensure bottom padding ends 10px below the bottommost item
      const padding = 100
      const bottomPadding = 100
      const exportWidth = maxX - minX + padding * 2
      const exportHeight = maxY - minY + padding * 5 +  bottomPadding

      console.log('Export dimensions:', { exportWidth, exportHeight, minX, minY, maxX, maxY, totalItems })

      if (exportWidth <= 0 || exportHeight <= 0) {
        console.error('Invalid export dimensions', { exportWidth, exportHeight })
        setIsExporting(false)
        return
      }

      // Scroll to top-left to reset connection line positions
      const scrollContainer = document.querySelector('.fixed.inset-0.overflow-auto') as HTMLElement
      const originalScrollTop = scrollContainer?.scrollTop || 0
      const originalScrollLeft = scrollContainer?.scrollLeft || 0
      
      if (scrollContainer) {
        scrollContainer.scrollTop = 0
        scrollContainer.scrollLeft = 0
      }

      // Wait for connection lines to re-render
      await new Promise(resolve => setTimeout(resolve, 100))

      // Export the canvas with calculated dimensions
      const dataUrl = await toPng(canvasElement, {
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        width: exportWidth,
        height: exportHeight,
        style: {
          transform: `translate(${-(minX - padding)}px, ${-(minY - padding)}px)`,
        },
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
        filter: (node) => {
          // Skip iframes (YouTube embeds) - thumbnail will be visible instead
          if (node.tagName === 'IFRAME') return false
          return true
        },
      })

      // Restore scroll position
      if (scrollContainer) {
        scrollContainer.scrollTop = originalScrollTop
        scrollContainer.scrollLeft = originalScrollLeft
      }

      // Download the image
      const link = document.createElement('a')
      link.download = `${boardName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${exportFormat}`
      link.href = dataUrl
      link.click()

      setIsExporting(false)
      closeExportModal()
    } catch (error) {
      console.error('Error exporting board:', error)
      setIsExporting(false)
    }
  }

  if (!isExportModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`relative w-[90vw] max-w-5xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden
        ${isDark 
          ? 'bg-zinc-900 border border-zinc-800' 
          : 'bg-white border border-zinc-200'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b
          ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl
              ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <Download className={`w-5 h-5
                ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold
                ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Export Board
              </h2>
              <p className={`text-sm
                ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {boardName}
              </p>
            </div>
          </div>
          <button
            onClick={closeExportModal}
            className={`p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' 
                : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-140px)]">
          {/* Left: Preview */}
          <div className={`flex-1 p-6 border-r overflow-auto
            ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
            {previewUrl ? (
              <div className="w-full flex items-start justify-center">
                <img 
                  src={previewUrl} 
                  alt="Export preview" 
                  className="max-w-full rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className={`w-full max-w-md aspect-video rounded-xl border-2 border-dashed flex items-center justify-center
                  ${isDark ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-300 bg-white'}`}>
                  <div className="text-center space-y-3">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center
                      ${isDark ? 'bg-zinc-700/50' : 'bg-zinc-200'}`}>
                      <Loader2 className={`w-8 h-8 animate-spin
                        ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium
                        ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        Generating Preview...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Options */}
          <div className="w-80 p-6 space-y-6">
            <div>
              <h3 className={`text-sm font-semibold mb-3
                ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Export Details
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg
                  ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}>
                  <p className={`text-xs font-medium mb-1
                    ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Board Name
                  </p>
                  <p className={`text-sm font-medium
                    ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {boardName}
                  </p>
                </div>

                {/* <div className={`p-3 rounded-lg
                  ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}>
                  <p className={`text-xs font-medium mb-1
                    ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Items Count
                  </p>
                  <p className={`text-sm font-medium
                    ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {totalItems} items
                  </p>
                </div> */}

                <div className={`p-3 rounded-lg
                  ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}>
                  <p className={`text-xs font-medium mb-1
                    ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Format
                  </p>
                  <p className={`text-sm font-medium, drawings
                    ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    PNG (2x quality)
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border
              ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-xs leading-relaxed
                ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <strong>Note:</strong> The export includes all board items (sticky notes, tasks, checklists, text) including those outside the visible viewport. UI elements (dock, sidebar, connections) are excluded.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`absolute bottom-0 left-0 right-0 px-6 py-4 border-t flex items-center justify-between
          ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
          <button
            onClick={closeExportModal}
            className={`px-4 py-2 rounded-lg font-medium transition-colors
              ${isDark 
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' 
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2
              ${isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export as PNG
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
