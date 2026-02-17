"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { GridBackground } from "@/components/GridBackground";
import { Dock } from "@/components/Dock";
import { TopBar } from "@/components/TopBar";
import { StickyNote } from "@/components/StickyNote";
import { Checklist } from "@/components/Checklist";
import { useThemeStore } from "@/store/themeStore";
import { useNoteStore } from "@/store/stickyNoteStore";
import { useChecklistStore } from "@/store/checklistStore";
import { Connections } from "@/components/Connections";
import { DragLayer } from "@/components/DragLayer";
import { useConnectionStore } from "@/store/connectionStore";
import { Text } from "@/components/Text";
import { useTextStore } from "@/store/textStore";
import { OrganizePanel } from "@/components/OrganizePanel";
import { useBoardStore } from "@/store/boardStore";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useKanbanStore } from "@/store/kanbanStore";
import { SideBar } from "@/components/SideBar";
import { ExportModal } from "@/components/ExportModal";
import { Media } from "@/components/Media";
import { useMediaStore } from "@/store/mediaStore";
import { MediaModal } from "@/components/MediaModal";
import { useDrawingStore } from "@/store/drawingStore";
import { BackgroundModal } from "@/components/BackgroundModal";
import { ConnectionLineModal } from "@/components/ConnectionLineModal";
import { useGridStore } from "@/store/gridStore";
import { useDragModeStore } from "@/store/dragModeStore";
import { usePresentationStore } from "@/store/presentationStore";

// Presentation mode hint that fades out
function PresentationHint({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-black/70 text-white px-6 py-4 rounded-2xl backdrop-blur-md shadow-2xl text-center"
        style={{ animation: 'fadeOut 1s ease-in 2s forwards' }}
      >
        <p className="text-lg font-semibold mb-1">Presentation Mode</p>
        <p className="text-sm text-white/70">Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs">ESC</kbd> to exit</p>
      </motion.div>
      <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
    </div>
  )
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const isDark = useThemeStore((state) => state.isDark);
  const setCurrentUserId = useBoardStore((state) => state.setCurrentUserId);
  
  // Get delete functions from all stores
  const { deleteBoard } = useBoardStore();
  const { deleteNote } = useNoteStore();
  const { deleteChecklist } = useChecklistStore();
  const { deleteText } = useTextStore();
  const { removeBoard: deleteKanban } = useKanbanStore();
  const { deleteMedia } = useMediaStore();
  const { deleteDrawing } = useDrawingStore();
  const { clearBoardConnections } = useConnectionStore();

  // All hooks must be called before any conditional returns
  const { notes, updateNote } = useNoteStore();
  const { checklists, updateChecklist } = useChecklistStore();
  const { clearSelection } = useConnectionStore();
  const connections = useConnectionStore((state) => state.connections);
  const { texts, updateText } = useTextStore();
  const { boards: kanbanBoards, updateBoardPosition } = useKanbanStore();
  const { medias, updateMedia } = useMediaStore();
  const currentBoardId = useBoardStore((state) => state.currentBoardId);
  const currentBoard = useBoardStore((state) =>
    state.boards.find((board) => board.id === currentBoardId)
  );

  // Setup @dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const data = active.data.current;
    const snap = useGridStore.getState().snapValue;
    
    if (data?.type === 'note') {
      const padding = 16;
      const scaledWidth = 192 * (useGridStore.getState().zoom);
      const newPosition = {
        x: snap(Math.max(padding, Math.min(window.innerWidth - (scaledWidth + padding), data.position.x + delta.x))),
        y: snap(data.position.y + delta.y)
      };
      updateNote(data.id, { position: newPosition });
    } else if (data?.type === 'checklist') {
      const padding = 16;
      const scaledWidth = 320 * (useGridStore.getState().zoom);
      const newPosition = {
        x: snap(Math.max(padding, Math.min(window.innerWidth - (scaledWidth + padding), data.position.x + delta.x))),
        y: snap(data.position.y + delta.y)
      };
      updateChecklist(data.id, { position: newPosition });
    } else if (data?.type === 'media') {
      const newPosition = {
        x: snap(data.position.x + delta.x),
        y: snap(data.position.y + delta.y)
      };
      updateMedia(data.id, { position: newPosition });
    } else if (data?.type === 'text') {
      const padding = 16;
      const baseWidth = 200;
      const safeWidth = Math.max(baseWidth, texts.find(t => t.id === data.id)?.text.length || 0 * data.fontSize * 0.6);
      const newPosition = {
        x: snap(Math.max(padding, Math.min(window.innerWidth - (safeWidth + padding), data.position.x + delta.x))),
        y: snap(data.position.y + delta.y)
      };
      updateText(data.id, { position: newPosition });
    } else if (data?.type === 'kanban') {
      const padding = 16;
      const newPosition = {
        x: snap(Math.max(padding, Math.min(window.innerWidth - 800, data.position.x + delta.x))),
        y: snap(data.position.y + delta.y)
      };
      updateBoardPosition(data.id, newPosition);
    }
  };

  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled);
  const { isPresentationMode, setPresentationMode } = usePresentationStore();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Consider tablets as mobile too
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set current user ID and redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.email) {
      setCurrentUserId(session.user.email);
    }
  }, [status, router, session, setCurrentUserId]);

  // Drag mode cursor
  useEffect(() => {
    document.body.style.cursor = isDragEnabled ? 'grab' : '';
    return () => { document.body.style.cursor = '' }
  }, [isDragEnabled]);

  // Presentation mode: Escape key to exit
  useEffect(() => {
    if (!isPresentationMode) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresentationMode(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPresentationMode, setPresentationMode]);

  // Listen for board deletion to cleanup associated items
  useEffect(() => {
    const handleBoardDeleted = (event: CustomEvent) => {
      const { boardId, noteIds, checklistIds, textIds, kanbanIds, mediaIds, drawingIds } = event.detail;
      
      // Delete all connections for this board
      clearBoardConnections(boardId);
      
      // Delete all notes
      noteIds.forEach((id: string) => deleteNote(id));
      
      // Delete all checklists
      checklistIds.forEach((id: string) => deleteChecklist(id));
      
      // Delete all texts
      textIds.forEach((id: string) => deleteText(id));
      
      // Delete all kanban boards
      kanbanIds.forEach((id: string) => deleteKanban(id));
      
      // Delete all media
      mediaIds.forEach((id: string) => deleteMedia(id));
      
      // Delete all drawings
      drawingIds.forEach((id: string) => deleteDrawing(id));
    };
    
    window.addEventListener('boardDeleted', handleBoardDeleted as EventListener);
    return () => window.removeEventListener('boardDeleted', handleBoardDeleted as EventListener);
  }, [deleteNote, deleteChecklist, deleteText, deleteKanban, deleteMedia, deleteDrawing, clearBoardConnections]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div
        className={`fixed inset-0 ${isDark ? "bg-zinc-900" : "bg-zinc-100"} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p
            className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  // Show mobile warning if on mobile device
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Desktop Only
          </h1>
          <p className="text-gray-600 mb-6">
            BORDS is currently only available on desktop devices. Please access this application from a computer for the best experience.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Filter items based on current board
  const filteredNotes = notes.filter((note) =>
    currentBoard?.notes.includes(note.id)
  );
  const filteredChecklists = checklists.filter((checklist) =>
    currentBoard?.checklists.includes(checklist.id)
  );
  const filteredTexts = texts.filter((text) =>
    currentBoard?.texts.includes(text.id)
  );
  const filteredKanbans = kanbanBoards.filter((kanban) =>
    currentBoard?.kanbans?.includes(kanban.id)
  );
  const filteredMedias = medias.filter((media) =>
    currentBoard?.medias?.includes(media.id)
  );

  const handleGlobalClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains("app-background") ||
      target.classList.contains("grid-cell")
    ) {
      clearSelection();
      // Hide all nodes by triggering blur on all items
      document.querySelectorAll(".item-container").forEach((item) => {
        (item as HTMLElement).blur();
      });
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className={`fixed inset-0 ${isDark ? "bg-zinc-900" : "bg-zinc-100"} app-background overflow-auto`}
        onClick={handleGlobalClick}
        style={{
          backgroundImage: currentBoard?.backgroundImage
            ? `url(${currentBoard.backgroundImage})`
            : undefined,
          backgroundColor: currentBoard?.backgroundColor || undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
      {/* Presentation mode entry hint */}
      {isPresentationMode && (
        <PresentationHint onDismiss={() => {}} />
      )}

      <div className="relative min-h-[170vh]">
        <GridBackground
          hoveredCell={hoveredCell}
          onCellHover={setHoveredCell}
          onCellClick={() => {}}
        />

        {/* Content and Connection Lines */}
        <div
          className="fixed inset-0 overflow-auto pb-[50vh]"
          data-board-canvas
        >
          {/* Board Name - Positioned between TopBar and right controls */}
          <div
            className="fixed top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto z-[9999] max-[1200px]:left-auto max-[1200px]:right-[35%] max-[1200px]:translate-x-0"
            data-board-item
          >
            <div
              className={`px-6 py-3 rounded-xl border shadow-lg backdrop-blur-xl
                ${
                  isDark
                    ? "bg-zinc-800/70 border-zinc-700/50"
                    : "bg-white/70 border-zinc-200/50"
                }`}
            >
              <h1
                className={`text-lg font-semibold tracking-tight text-center ${isDark ? "text-white" : "text-zinc-900"}`}
              >
                {currentBoard?.name || "No Board Selected"}
              </h1>
            </div>
            {currentBoardId && (
              <button
                onClick={() => setBoardToDelete(currentBoardId)}
                className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-xl transition-colors
                  ${
                    isDark
                      ? "bg-zinc-800/70 border-zinc-700/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                      : "bg-white/70 border-zinc-200/50 hover:bg-red-50 text-zinc-600 hover:text-red-600"
                  }`}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {boardToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setBoardToDelete(null)}>
              <div 
                className={`p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
                  isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-full bg-red-100">
                    <Trash2 size={24} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Delete Board?
                    </h3>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      This will permanently delete the board <span className="font-semibold">"{currentBoard?.name}"</span> and all its items (notes, checklists, kanban boards, text elements, media, and connections). This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setBoardToDelete(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDark 
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteBoard(boardToDelete);
                      setBoardToDelete(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Delete Board
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Connection Lines */}
          <div className="absolute inset-0">
            {currentBoardId && <Connections key={currentBoardId} />}
          </div>

          {/* Items Layer */}
          <div
            className="relative"
            style={{ paddingTop: "20vh", paddingBottom: "100vh" }}
          >
            {/* Drawing Layer - Scrolls with items */}
            <DrawingCanvas />

            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="pointer-events-auto"
                data-board-item
              >
                <StickyNote {...note} />
              </div>
            ))}
            {filteredChecklists.map((checklist) => (
              <div
                key={checklist.id}
                className="pointer-events-auto"
                data-board-item
              >
                <Checklist {...checklist} />
              </div>
            ))}
            {filteredTexts.map((text) => (
              <div
                key={text.id}
                className="pointer-events-auto"
                data-board-item
              >
                <Text {...text} />
              </div>
            ))}
            {filteredKanbans.map((kanban) => (
              <div
                key={kanban.id}
                className="pointer-events-auto"
                data-board-item
              >
                <KanbanBoard board={kanban} />
              </div>
            ))}
            {filteredMedias.map((media) => (
              <div
                key={media.id}
                className="pointer-events-auto"
                data-board-item
              >
                <Media {...media} />
              </div>
            ))}
          </div>
        </div>

        {/* UI Controls Layer - Higher z-index */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 50 }}
        >
          {/* Navigation Controls */}
          <div className="pointer-events-auto">
            <TopBar />
            <Dock />
            <SideBar />

            {/* Modals */}
            <ExportModal />
            <MediaModal />
            <BackgroundModal />
            <ConnectionLineModal />
          </div>

          {/* Interaction Controls */}
          <div className="pointer-events-auto">
            <DragLayer />
            <OrganizePanel />
          </div>
        </div>
      </div>
    </div>
    </DndContext>
  );
}
