import { useState, useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { useGridStore } from '../store/gridStore'
import { useBoardStore } from '../store/boardStore'
import { useNoteStore} from '../store/stickyNoteStore'
import { StickyNoteForm } from './StickyNoteForm'
import { ChecklistForm } from './ChecklistForm'
import { useDragModeStore } from '../store/dragModeStore'
import { useCommentStore } from '../store/commentStore';
import { Comments } from './Comments';
import { useConnectionStore } from '../store/connectionStore';
import { usePresentationStore } from '../store/presentationStore'
import { useBoardSyncStore } from '../store/boardSyncStore'
import {
  GripHorizontal,
  Pencil,
  StickyNote,
  LayoutGrid,
  FileEdit,
  Kanban,
  Network,
  MessageSquare,
  Palette,
  History,
  FolderTree,
  ListChecks,
  Calculator,
  Link,
  Type,
  Eraser,
  X,
  Layout,
  Magnet,
  Maximize,
} from 'lucide-react'
import { useTextStore } from '../store/textStore'
import { useOrganizePanelStore } from '../store/organizePanelStore'
import { useDrawingStore } from '../store/drawingStore'
import { KanbanForm } from './KanbanForm'
import { useZIndexStore } from '../store/zIndexStore'

export function Dock() {
  const [hoveredItem, setHoveredItem] = useState<string | number | null>(null);
  const [showNoBoardModal, setShowNoBoardModal] = useState(false);
  const isDark = useThemeStore((state) => state.isDark)
  const { isGridVisible, toggleGrid, snapEnabled, toggleSnap } = useGridStore()
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [showKanbanForm, setShowKanbanForm] = useState(false)
  const { addNote } = useNoteStore()
  const { isDragEnabled, toggleDragMode } = useDragModeStore()
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const { isCommenting, toggleCommenting, comments } = useCommentStore();
  const connections = useConnectionStore((state) => state.connections)
  const isPresentationMode = usePresentationStore((state) => state.isPresentationMode)
  const { isVisible, toggleVisibility } = useConnectionStore()
  const { addText } = useTextStore()
  const toggleOrganizePanel = useOrganizePanelStore((state) => state.togglePanel)
  const currentBoardId = useBoardStore((state) => state.currentBoardId)
  const addItemToBoard = useBoardStore((state) => state.addItemToBoard)
  const toggleBoardsPanel = useBoardStore((state) => state.toggleBoardsPanel)
  const { isDrawing, toggleDrawing, isErasing, toggleEraser } = useDrawingStore()
  const bringToFront = useZIndexStore((state) => state.bringToFront)
  const { isSyncing, lastSyncedAt, syncBoardToCloud } = useBoardSyncStore()

  // Show modal when no board is selected
  useEffect(() => {
    if (!currentBoardId) {
      const timer = setTimeout(() => {
        setShowNoBoardModal(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowNoBoardModal(false);
    }
  }, [currentBoardId]);

  if (isPresentationMode) return null

  const handleAddNote = ({ text, color }: { text: string; color: string }) => {
    // Ensure new notes are created within viewport
    const padding = 16;
    const centerX = Math.max(padding, Math.min(window.innerWidth - 200, window.innerWidth / 2 - 96))
    const centerY = Math.max(padding, Math.min(window.innerHeight - 200, window.innerHeight / 2 - 64))
    
    // Calculate height based on text content
    const lineHeight = 20
    const textPadding = 60 // Top and bottom padding + label space
    const lines = text.split('\n').length
    const calculatedHeight = Math.max(100, (lines * lineHeight) + textPadding)
    
    const noteId = Date.now().toString()
    addNote({
      id: noteId,
      text,
      color,
      position: { 
        x: centerX,
        y: centerY
      },
      width: 192,
      height: calculatedHeight,
    })
    bringToFront(noteId)
    setShowNoteForm(false)
  }

  const handleCommentClick = () => {
    if (!isCommenting) {
      toggleCommenting();
      // Position comments in center of screen
      setCommentPosition({
        x: window.innerWidth / 2 - 160, // half of 320px width
        y: window.innerHeight / 2 - 250, // half of 500px height
      });
    } else {
      toggleCommenting();
      setCommentPosition(null);
    }
  };

  const handleAddText = () => {
    const textId = Date.now().toString()
    addText({
      id: textId,
      text: 'Double click to edit',
      position: {
        x: Math.max(100, Math.min(window.innerWidth - 300, window.innerWidth / 2 - 100)),
        y: Math.max(100, Math.min(window.innerHeight - 100, window.innerHeight / 2 - 50))
      },
      fontSize: 16,
      color: isDark ? '#fff' : '#000'
    })
    bringToFront(textId)
    
    // Add text to current board
    if (currentBoardId) {
      addItemToBoard(currentBoardId, 'texts', textId)
    }
  }

  const dockItems = [
    // Navigation & Layout
    { 
      id: 1, 
      icon: GripHorizontal, 
      label: "Drag Mode", 
      description: isDragEnabled ? "Click to disable drag" : "Click to enable drag",
      onClick: toggleDragMode,
      isActive: isDragEnabled,
      customStyle: isDragEnabled 
        ? 'text-green-500 hover:text-green-600' 
        : 'text-red-500 hover:text-red-600'
    },
    { 
      id: 4, 
      icon: LayoutGrid, 
      label: "Toggle Grid", 
      description: "Grid/Free layout",
      onClick: toggleGrid,
      isActive: isGridVisible 
    },
    { 
      id: 41, 
      icon: Magnet, 
      label: "Snap to Grid", 
      description: snapEnabled ? "Snapping ON" : "Snapping OFF",
      onClick: toggleSnap,
      isActive: snapEnabled,
      customStyle: snapEnabled 
        ? 'text-blue-500 hover:text-blue-600' 
        : undefined
    },
    { id: 'separator-1', isSeparator: true },
    
    // Content Creation
    { 
      id: 3, 
      icon: StickyNote, 
      label: "Sticky Note", 
      description: !currentBoardId ? "Select/create a board to get started" : "Add quick notes",
      onClick: currentBoardId ? () => setShowNoteForm(true) : undefined,
      disabled: !currentBoardId
    },
    { 
      id: 7, 
      icon: Type, 
      label: "Add Text", 
      description: !currentBoardId ? "Select/create a board to get started" : "Add text anywhere",
      onClick: currentBoardId ? handleAddText : undefined,
      disabled: !currentBoardId
    },
    { 
      id: 13, 
      icon: ListChecks, 
      label: "Checklist", 
      description: !currentBoardId ? "Select/create a board to get started" : "Track progress",
      onClick: currentBoardId ? () => setShowChecklistForm(true) : undefined,
      disabled: !currentBoardId
    },
    { 
      id: 6, 
      icon: Kanban, 
      label: "Kanban", 
      description: !currentBoardId ? "Select/create a board to get started" : "Create kanban board",
      onClick: currentBoardId ? () => setShowKanbanForm(true) : undefined,
      disabled: !currentBoardId
    },
    { id: 'separator-2', isSeparator: true },
    
    // Drawing Tools
    { 
      id: 2, 
      icon: Pencil, 
      label: "Draw", 
      description: !currentBoardId ? "Select/create a board to get started" : (isDrawing ? "Drawing mode active" : "Click to draw"),
      onClick: currentBoardId ? toggleDrawing : undefined,
      isActive: isDrawing,
      disabled: !currentBoardId,
      customStyle: isDrawing ? 'text-blue-500 hover:text-blue-600' : undefined
    },
    { 
      id: 14, 
      icon: Eraser, 
      label: "Eraser", 
      description: !currentBoardId ? "Select/create a board to get started" : (isErasing ? "Erasing mode active" : "Click to erase drawings"),
      onClick: currentBoardId ? toggleEraser : undefined,
      isActive: isErasing,
      disabled: !currentBoardId,
      customStyle: isErasing ? 'text-orange-500 hover:text-orange-600' : undefined
    },
    { id: 'separator-3', isSeparator: true },
    
    // Collaboration & Management
    { 
      id: 8, 
      icon: MessageSquare, 
      label: `Comments (${comments.length})`, 
      description: !currentBoardId ? "Select/create a board to get started" : `${comments.length} comment${comments.length !== 1 ? 's' : ''} added`,
      onClick: currentBoardId ? handleCommentClick : undefined,
      isActive: isCommenting,
      disabled: !currentBoardId,
      customStyle: isCommenting ? 'text-purple-500 hover:text-purple-600' : undefined
    },
    { 
      id: 12, 
      icon: FolderTree, 
      label: "Organize", 
      description: "Manage board items",
      onClick: toggleOrganizePanel
    },
    { id: 'separator-4', isSeparator: true },
    
    // View
    // { 
    //   id: 5, 
    //   icon: Maximize, 
    //   label: "Full Screen", 
    //   description: !currentBoardId ? "Select/create a board first" : "Presentation view",
    //   onClick: currentBoardId ? () => usePresentationStore.getState().setPresentationMode(true) : undefined,
    //   disabled: !currentBoardId
    // },
    { id: 11, icon: History, label: "History", description: "Coming soon!" },
  ]

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className={`
          flex items-end gap-3 px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-lg
          ${isDark 
            ? 'bg-zinc-800/90 border-zinc-700/50' 
            : 'bg-white/90 border-zinc-200/50'}
          transition-colors duration-200
        `}>
          {dockItems.map((item) => (
            item.isSeparator ? (
              <div 
                key={item.id}
                className={`w-px h-6 ${isDark ? 'bg-zinc-700/50' : 'bg-zinc-300/50'} mx-1`}
              />
            ) : (
              <button
                key={item.id}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`
                  flex flex-col items-center transition-all duration-200 px-1.5
                  ${hoveredItem === item.id ? 'scale-125 -translate-y-2' : 'hover:scale-110'}
                  group relative
                  ${item.isActive ? 'text-blue-500' : ''}
                  ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {item.icon && (
                  <item.icon 
                    className={`w-5 h-5 transition-colors
                      ${item.customStyle || // Use custom style if provided
                        (isDark 
                          ? 'text-zinc-400 group-hover:text-zinc-200' 
                          : 'text-zinc-600 group-hover:text-zinc-900')
                      }`}
                    strokeWidth={1.5}
                  />
                )}
                <div className={`
                  absolute -top-12 whitespace-nowrap
                  bg-zinc-800 text-white px-2 py-1 rounded-md
                  text-xs transform -translate-x-1/2 left-1/2
                  transition-all duration-200 pointer-events-none
                  ${hoveredItem === item.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-zinc-400 text-[10px]">{item.description}</div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 
                       border-4 border-transparent border-t-zinc-800"></div>
                </div>
              </button>
            )
          ))}
        </div>
      </div>
      
      {showNoteForm && (
        <StickyNoteForm
          onSubmit={handleAddNote}
          onClose={() => setShowNoteForm(false)}
        />
      )}
      
      {showChecklistForm && (
        <ChecklistForm
          onClose={() => setShowChecklistForm(false)}
          position={{
            x: Math.max(100, Math.min(window.innerWidth - 300, window.innerWidth / 2 - 200)),
            y: Math.max(100, Math.min(window.innerHeight - 300, window.innerHeight / 2 - 200))
          }}
        />
      )}

      {showKanbanForm && (
        <KanbanForm
          onClose={() => setShowKanbanForm(false)}
          position={{
            x: Math.max(100, Math.min(window.innerWidth - 400, window.innerWidth / 2 - 400)),
            y: Math.max(100, Math.min(window.innerHeight - 300, window.innerHeight / 2 - 200))
          }}
        />
      )}

      {commentPosition && (
        <Comments
          position={commentPosition}
          onClose={() => {
            toggleCommenting();
            setCommentPosition(null);
          }}
        />
      )}

      {showNoBoardModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="relative max-w-md w-full mx-4 p-8 rounded-2xl">
            <div className="text-center">
              <div className={`
                w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                ${isDark ? 'bg-blue-400/20' : 'bg-blue-100'}
              `}>
                <Layout className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>

              <h3 className={`
                text-2xl font-semibold mb-2
                ${isDark ? 'text-white' : 'text-zinc-900'}
              `}>
                BORDS!
              </h3>

              <p className={`
                mb-6
                ${isDark ? 'text-zinc-400' : 'text-zinc-600'}
              `}>
                Create or select a board to get started. Boards help you organize your work and ideas.
              </p>

              <button
                onClick={toggleBoardsPanel}
                className={`
                  w-full py-3 px-6 rounded-lg font-medium transition-colors
                  ${isDark 
                    ? 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-400' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'}
                `}
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50">
        {/* <div className="flex items-center gap-2">
          {connections.length > 0 && (
            <button
              onClick={toggleVisibility}
              className={`
                p-3 rounded-xl shadow-lg border transition-colors
                ${isVisible 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
                }
              `}
            >
              <Network size={20} />
            </button>
          )}
          
        </div> */}
      </div>

    </>
  )
}
