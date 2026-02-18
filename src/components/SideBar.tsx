import { useState } from 'react'
import {
  Tags, Users, Command, Brain, Workflow,
  Image, Download, Link2, Presentation, GitBranch
} from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { usePresentationStore } from '../store/presentationStore'
import { useExportStore } from '../store/exportStore'
import { useMediaStore } from '../store/mediaStore'
import { useBoardStore } from '../store/boardStore'
import { useConnectionLineStore } from '../store/connectionLineStore'

export function SideBar() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const isDark = useThemeStore((state) => state.isDark)
  const { isPresentationMode, togglePresentationMode } = usePresentationStore()
  const { openExportModal } = useExportStore()
  const { openMediaModal } = useMediaStore()
  const { openBackgroundModal, currentBoardId } = useBoardStore()
  const { openModal: openConnectionLineModal } = useConnectionLineStore()

  const toolItems = [
    { id: 1, icon: Image, label: "Custom Backgrounds", description: !currentBoardId ? "Select/create a board to get started" : "Personalize your board", disabled: !currentBoardId },
    { id: 2, icon: Download, label: "Export Options", description: !currentBoardId ? "Select/create a board to get started" : "Save as PDF or image (Experimental)", disabled: !currentBoardId, experimental: true },
    { id: 3, icon: Link2, label: "Media Links", description: !currentBoardId ? "Select/create a board to get started" : "Add images & videos", disabled: !currentBoardId },
    { id: 4, icon: Presentation, label: "Presentation Mode", description: !currentBoardId ? "Select/create a board to get started" : "Full-screen view", disabled: !currentBoardId },
    { id: 5, icon: GitBranch, label: "Connection Lines", description: !currentBoardId ? "Select/create a board to get started" : "Customize line colors", disabled: !currentBoardId },
    { id: 6, icon: Tags, label: "Tags", description: "Organize & filter", comingSoon: true },
    { id: 7, icon: Users, label: "Collaborate", description: "Multi-user editing", comingSoon: true },
    { id: 8, icon: Command, label: "Commands", description: "Quick actions", comingSoon: true },
    { id: 9, icon: Brain, label: "AI Helper", description: "Smart suggestions", comingSoon: true },
    { id: 10, icon: Workflow, label: "Automations", description: "Custom triggers", comingSoon: true }
  ]

  if (isPresentationMode) {
    // Reset hovered state when entering presentation mode so tooltips don't persist
    if (hoveredItem !== null) setHoveredItem(null)
    return null
  }

  const handleItemClick = async (itemId: number) => {
    const item = toolItems.find(i => i.id === itemId)
    if (item?.comingSoon || item?.disabled) return // Don't do anything for coming soon or disabled items
    
    if (itemId === 1) { // Custom Backgrounds
      openBackgroundModal()
    } else if (itemId === 2) { // Export Options
      // Scroll to top before opening export modal - data-board-canvas IS the scroll container
      const scrollContainer = document.querySelector('[data-board-canvas]') as HTMLElement
      if (scrollContainer) {
        scrollContainer.scrollTop = 0
        scrollContainer.scrollLeft = 0
        
        // Wait for DOM to update
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      openExportModal()
    } else if (itemId === 3) { // Media Links
      openMediaModal()
    } else if (itemId === 4) { // Presentation Mode
      togglePresentationMode()
    } else if (itemId === 5) { // Connection Lines
      openConnectionLineModal()
    }
    // Add other item handlers here as needed
  }

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
      <div className={`flex flex-col backdrop-blur-xl border shadow-lg rounded-2xl w-16
        ${isDark 
          ? 'bg-zinc-800/90 border-zinc-700/50' 
          : 'bg-white/90 border-zinc-200/50'}
        transition-colors duration-200`}>
        <div className="py-4 flex flex-col items-center gap-4">{toolItems.map((item) => (
            <button
              key={item.id}
              className={`group relative flex-shrink-0 transition-all duration-200 p-1 w-full
                ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleItemClick(item.id)}
              disabled={item.disabled}
            >
              <div className={`
                flex items-center justify-center
                ${hoveredItem === item.id && !item.disabled ? 'scale-110' : !item.disabled ? 'hover:scale-105' : ''}
                transition-all duration-200
              `}>
                <item.icon 
                  className={`w-6 h-6 transition-colors
                    ${isDark 
                      ? 'text-zinc-400 group-hover:text-zinc-200' 
                      : 'text-zinc-600 group-hover:text-zinc-900'}`}
                  strokeWidth={1.5}
                />
              </div>
              <div 
                style={{ position: 'fixed', right: '88px' }}
                className={`
                  top-auto translate-y-[-50%]
                  bg-zinc-800 text-white px-3 py-2 rounded-lg
                  text-xs min-w-[200px] pointer-events-none
                  transition-all duration-200 ease-out shadow-lg
                  z-[100]
                  ${hoveredItem === item.id 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-2'}
                `}
              >
                <div className="font-medium mb-1">
                  {item.label}
                  {item.experimental && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                      EXPERIMENTAL
                    </span>
                  )}
                </div>
                <div className="text-zinc-400 text-[10px] leading-relaxed">
                  {item.comingSoon ? 'Coming Soon' : item.description}
                </div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[7px]
                     border-[7px] border-transparent border-l-zinc-800"/>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
