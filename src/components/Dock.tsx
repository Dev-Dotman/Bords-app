import { useState } from 'react'
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
  Share2,
  History,
  FolderTree,
  ListChecks,
  Calculator,
  Link,
  Type,
  Eraser
} from 'lucide-react'
import { useTextStore } from '../store/textStore'
import { useOrganizePanelStore } from '../store/organizePanelStore'
import { useDrawingStore } from '../store/drawingStore'
import { KanbanForm } from './KanbanForm'

export function Dock() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const isDark = useThemeStore((state) => state.isDark)
  const { isGridVisible, toggleGrid } = useGridStore()
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [showKanbanForm, setShowKanbanForm] = useState(false)
  const { addNote } = useNoteStore()
  const { isDragEnabled, toggleDragMode } = useDragModeStore()
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const { isCommenting, toggleCommenting, comments } = useCommentStore();
  const connections = useConnectionStore((state) => state.connections)
  const { isVisible, toggleVisibility } = useConnectionStore()
  const { addText } = useTextStore()
  const toggleOrganizePanel = useOrganizePanelStore((state) => state.togglePanel)
  const currentBoardId = useBoardStore((state) => state.currentBoardId)
  const addItemToBoard = useBoardStore((state) => state.addItemToBoard)
  const { isDrawing, toggleDrawing, isErasing, toggleEraser } = useDrawingStore()

  const handleAddNote = ({ text, color }: { text: string; color: string }) => {
    // Ensure new notes are created within viewport
    const padding = 16;
    const centerX = Math.max(padding, Math.min(window.innerWidth - 200, window.innerWidth / 2 - 96))
    const centerY = Math.max(padding, Math.min(window.innerHeight - 200, window.innerHeight / 2 - 64))
    
    addNote({
      id: Date.now().toString(),
      text,
      color,
      position: { 
        x: centerX,
        y: centerY
      },
    })
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
    
    // Add text to current board
    if (currentBoardId) {
      addItemToBoard(currentBoardId, 'texts', textId)
    }
  }

  const dockItems = [
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
      id: 2, 
      icon: Pencil, 
      label: "Draw", 
      description: isDrawing ? "Drawing mode active" : "Click to draw",
      onClick: toggleDrawing,
      isActive: isDrawing,
      customStyle: isDrawing ? 'text-blue-500 hover:text-blue-600' : undefined
    },
    { 
      id: 14, 
      icon: Eraser, 
      label: "Eraser", 
      description: isErasing ? "Erasing mode active" : "Click to erase drawings",
      onClick: toggleEraser,
      isActive: isErasing,
      customStyle: isErasing ? 'text-orange-500 hover:text-orange-600' : undefined
    },
    { 
      id: 3, 
      icon: StickyNote, 
      label: "Sticky Note", 
      description: "Add quick notes",
      onClick: () => setShowNoteForm(true)
    },
    { 
      id: 4, 
      icon: LayoutGrid, 
      label: "Toggle Grid", 
      description: "Grid/Free layout",
      onClick: toggleGrid,
      isActive: isGridVisible 
    },
    { id: 5, icon: FileEdit, label: "Templates", description: "Coming soon!" },
    { 
      id: 6, 
      icon: Kanban, 
      label: "Kanban", 
      description: "Create kanban board",
      onClick: () => setShowKanbanForm(true)
    },
    { 
      id: 7, 
      icon: Type, 
      label: "Add Text", 
      description: "Add text anywhere",
      onClick: handleAddText
    },
    { 
      id: 8, 
      icon: MessageSquare, 
      label: `Comments (${comments.length})`, 
      description: `${comments.length} comment${comments.length !== 1 ? 's' : ''} added`,
      onClick: handleCommentClick,
      isActive: isCommenting,
      customStyle: isCommenting ? 'text-purple-500 hover:text-purple-600' : undefined
    },
    { id: 10, icon: Share2, label: "Share", description: "Coming soon!" },
    { id: 11, icon: History, label: "History", description: "Coming soon!" },
    { 
      id: 12, 
      icon: FolderTree, 
      label: "Organize", 
      description: "Manage board items",
      onClick: toggleOrganizePanel
    },
    { 
      id: 13, 
      icon: ListChecks, 
      label: "Checklist", 
      description: "Track progress",
      onClick: () => setShowChecklistForm(true)
    },
    // { id: 14, icon: Calculator, label: "Calculate", description: "Coming soon!" }
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
            <button
              key={item.id}
              onClick={item.onClick}
              className={`
                flex flex-col items-center transition-all duration-200 px-1.5
                ${hoveredItem === item.id ? 'scale-125 -translate-y-2' : 'hover:scale-110'}
                group relative
                ${item.isActive ? 'text-blue-500' : ''}
              `}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <item.icon 
                className={`w-5 h-5 transition-colors
                  ${item.customStyle || // Use custom style if provided
                    (isDark 
                      ? 'text-zinc-400 group-hover:text-zinc-200' 
                      : 'text-zinc-600 group-hover:text-zinc-900')
                  }`}
                strokeWidth={1.5}
              />
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

      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2">
          {/* Show mind map toggle when connections exist */}
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
          
          {/* ...existing dock buttons... */}
        </div>
      </div>
    </>
  )
}
