import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Trash2, Eye, X } from 'lucide-react'
import { useConnectionStore } from '../store/connectionStore'
import { useBoardStore } from '../store/boardStore'
import { useGridStore } from '../store/gridStore'
import { useThemeStore } from '../store/themeStore'
import { ConnectionsModal } from './ConnectionsModal'
import toast from 'react-hot-toast'

interface ConnectionLineProps {
  fromId: string;
  toId: string;
  color: string;
}

export function ConnectionLine({ fromId, toId, color }: ConnectionLineProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pathD, setPathD] = useState('')

  useEffect(() => {
    const updatePath = () => {
      const fromIndicator = document.querySelector(`[data-connection-id="${fromId}-indicator"]`)
      const toIndicator = document.querySelector(`[data-connection-id="${toId}-indicator"]`)
      
      if (!fromIndicator || !toIndicator) return

      const fromRect = fromIndicator.getBoundingClientRect()
      const toRect = toIndicator.getBoundingClientRect()
      
      // Use viewport coordinates directly
      const fromX = fromRect.left + (fromRect.width / 2)
      const fromY = fromRect.top + (fromRect.height / 2)
      const toX = toRect.left + (toRect.width / 2)
      const toY = toRect.top + (toRect.height / 2)

      const midX = (fromX + toX) / 2
      const newPath = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`

      setPathD(newPath)
    }

    // Initial update
    updatePath()

    // Use IntersectionObserver for better performance
    const observerOptions = {
      root: null,
      threshold: 0,
      rootMargin: '100px' // Update even slightly before visible
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updatePath()
        }
      })
    }, observerOptions)

    const fromEl = document.querySelector(`[data-node-id="${fromId}"]`)
    const toEl = document.querySelector(`[data-node-id="${toId}"]`)
    
    if (fromEl) observer.observe(fromEl)
    if (toEl) observer.observe(toEl)

    // MutationObserver to track style changes (for drag movement)
    // Use immediate updates during drag for smooth following
    const mutationObserver = new MutationObserver(() => {
      // Call updatePath directly without any delay for instant updates
      updatePath()
    })
    
    if (fromEl) {
      mutationObserver.observe(fromEl, {
        attributes: true,
        attributeFilter: ['style'],
        attributeOldValue: false // Don't track old values for performance
      })
    }
    if (toEl) {
      mutationObserver.observe(toEl, {
        attributes: true,
        attributeFilter: ['style'],
        attributeOldValue: false
      })
    }

    // Passive scroll listener for all scroll containers
    const scrollHandler = () => {
      updatePath()
    }

    // Listen to both window scroll and overflow scroll containers
    const scrollContainers = document.querySelectorAll('.overflow-auto, [style*="overflow"]')
    window.addEventListener('scroll', scrollHandler, { passive: true })
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', scrollHandler, { passive: true })
    })
    
    window.addEventListener('resize', updatePath, { passive: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('scroll', scrollHandler)
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', scrollHandler)
      })
      window.removeEventListener('resize', updatePath)
    }
  }, [fromId, toId])

  return (
    <path
      ref={pathRef}
      d={pathD}
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      className="connection-line"
      style={{ 
        pointerEvents: 'none',
        willChange: 'd'
      }}
    />
  )
}

export function Connections() {
  const [showConnectionsView, setShowConnectionsView] = useState(false)
  const { 
    removeConnection, 
    selectedItems, 
    addConnection, 
    clearBoardConnections // Use the new method
  } = useConnectionStore()
  const connections = useConnectionStore((state) => state.connections)
  const isVisible = useConnectionStore((state) => state.isVisible)
  const currentBoardId = useBoardStore((state) => state.currentBoardId ?? '')
  const { zoom } = useGridStore()
  const isDark = useThemeStore((state) => state.isDark)

  // Filter connections by current board
  const boardConnections = connections.filter(conn => conn.boardId === currentBoardId)

  // Memoize drawConnectionLines to prevent unnecessary recreations
  const drawConnectionLines = useCallback(() => {
    if (!currentBoardId || !isVisible || boardConnections.length === 0) return null;

    return boardConnections.map(connection => {
      const fromIndicator = document.querySelector(`[data-connection-id="${connection.fromId}-indicator"]`)
      const toIndicator = document.querySelector(`[data-connection-id="${connection.toId}-indicator"]`)
      
      if (!fromIndicator || !toIndicator) return null

      const fromRect = fromIndicator.getBoundingClientRect()
      const toRect = toIndicator.getBoundingClientRect()
      
      // Get center points of indicators
      const fromX = fromRect.left + (fromRect.width / 2)
      const fromY = fromRect.top + (fromRect.height / 2)
      const toX = toRect.left + (toRect.width / 2)
      const toY = toRect.top + (toRect.height / 2)

      // Calculate control points for smooth curve
      const midX = (fromX + toX) / 2
      const distance = Math.abs(toX - fromX)
      const curvature = Math.min(distance * 0.2, 50) // Adjust curve based on distance

      // Create curved path
      const path = `
        M ${fromX} ${fromY}
        C ${midX} ${fromY},
          ${midX} ${toY},
          ${toX} ${toY}
      `

      return (
        <g key={connection.id}>
          <path
            d={path}
            stroke={connection.color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="connection-line"
            style={{ pointerEvents: 'none' }}
          />
        </g>
      )
    })
  }, [boardConnections, currentBoardId, isVisible]);

  // Initial render and update effect
  useEffect(() => {
    if (!currentBoardId || !isVisible || boardConnections.length === 0) return;

    // Immediate first render
    const immediateRender = () => {
      requestAnimationFrame(() => {
        const allIndicatorsPresent = boardConnections.every(conn => {
          return document.querySelector(`[data-connection-id="${conn.fromId}-indicator"]`) &&
                 document.querySelector(`[data-connection-id="${conn.toId}-indicator"]`)
        });

        if (allIndicatorsPresent) {
          drawConnectionLines();
        } else {
          // If not all indicators are present, try again in 50ms
          setTimeout(immediateRender, 50);
        }
      });
    };

    // Start immediate render
    immediateRender();

    // Regular updates with better performance
    const updateLines = () => requestAnimationFrame(drawConnectionLines)
    
    // MutationObserver to track item movement and style changes
    const mutationObserver = new MutationObserver((mutations) => {
      // Only update if relevant changes occurred
      const shouldUpdate = mutations.some(mutation => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement
          return target.classList.contains('item-container') || 
                 target.hasAttribute('data-node-id')
        }
        return false
      })
      
      if (shouldUpdate) {
        updateLines()
      }
    })
    
    // Observe all item containers for movement
    document.querySelectorAll('.item-container').forEach(el => {
      mutationObserver.observe(el, {
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    })
    
    // Also observe body for new items being added
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // Use IntersectionObserver for visibility-based updates
    const observerOptions = {
      root: null,
      threshold: 0,
      rootMargin: '200px'
    }
    
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateLines()
        }
      })
    }, observerOptions)
    
    // Observe all item containers
    document.querySelectorAll('.item-container').forEach(el => {
      intersectionObserver.observe(el)
    })

    // Passive scroll listeners for all scroll containers
    const scrollHandler = () => {
      updateLines()
    }
    
    window.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('resize', updateLines, { passive: true })
    
    // Listen to scroll on overflow containers
    const scrollContainers = document.querySelectorAll('.overflow-auto')
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', scrollHandler, { passive: true })
    })

    return () => {
      mutationObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', updateLines)
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', scrollHandler)
      })
    }
  }, [currentBoardId, isVisible, boardConnections, drawConnectionLines])

  const formatConnectionText = (text: string | undefined) => {
    if (!text) return "Untitled";
    // Limit text length and add ellipsis if needed
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  }

  // Clear connections button handler
  const handleClearConnections = () => {
    if (currentBoardId) {
      clearBoardConnections(currentBoardId)
      toast.success('Cleared all connections for this board')
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* SVG Container */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <svg 
          className="w-full h-full"
          style={{ 
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          {boardConnections.map(connection => (
            <ConnectionLine
              key={connection.id}
              fromId={connection.fromId}
              toId={connection.toId}
              color={connection.color}
            />
          ))}
        </svg>
      </div>
      <style>{`
        .connection-line {
          filter: drop-shadow(0 0 4px rgba(0,0,0,0.1));
        }
        .connection-line:hover {
          stroke-opacity: 1;
          filter: drop-shadow(0 0 6px rgba(0,0,0,0.2));
        }
      `}</style>
      {/* Connection Controls - High z-index */}
      <div className="fixed left-4 bottom-4 z-[100] pointer-events-auto">
        {boardConnections.length > 0 && (
          <div className={`px-4 py-3 rounded-xl shadow-lg border backdrop-blur-xl ${
            isDark 
              ? 'bg-zinc-800/95 border-zinc-700/50' 
              : 'bg-white/95 border-zinc-200/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Link2 size={16} className="text-blue-500" />
                <span className={`font-semibold ${
                  isDark ? 'text-white' : 'text-zinc-900'
                }`}>
                  {boardConnections.length} Active Connection{boardConnections.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className={`h-5 w-px ${
                isDark ? 'bg-zinc-700' : 'bg-zinc-200'
              }`} />
              <button
                onClick={() => setShowConnectionsView(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all hover:scale-105 ${
                  isDark 
                    ? 'text-blue-400 hover:bg-blue-500/10' 
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Eye size={14} />
                View
              </button>
              <button
                onClick={handleClearConnections}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all hover:scale-105 ${
                  isDark 
                    ? 'text-red-400 hover:bg-red-500/10' 
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connections Modal */}
      {showConnectionsView && (
        <ConnectionsModal
          onClose={() => setShowConnectionsView(false)}
          connections={boardConnections}
        />
      )}

      {/* Connect Button - High z-index */}
      {selectedItems.length === 2 && (
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed top-4 right-20 z-[100] bg-blue-500 text-white px-3 py-2 rounded-lg 
                   shadow-lg flex items-center gap-2 hover:bg-blue-600 transition-colors pointer-events-auto"
          onClick={() => {
            if (selectedItems.length === 2) {
              addConnection(
                selectedItems[0].id,
                selectedItems[1].id,
                selectedItems[0].type,
                selectedItems[1].type,
                {
                  from: selectedItems[0].position,
                  to: selectedItems[1].position
                },
                currentBoardId
              )
            }
          }}
        >
          <Link2 size={16} />
          Connect Items
        </motion.button>
      )}
    </>
  )
}
