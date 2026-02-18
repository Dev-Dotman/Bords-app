"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { GridBackground } from "@/components/GridBackground";
import { Dock } from "@/components/Dock";
import { TopBar } from "@/components/TopBar";
import { StickyNote } from "@/components/StickyNote";
import { Checklist } from "@/components/Checklist";
import { useThemeStore } from "@/store/themeStore";
import { useNoteStore } from "@/store/stickyNoteStore";
import { useChecklistStore } from "@/store/checklistStore";
import { Connections, ConnectionLines } from "@/components/Connections";
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
import { AssignTaskModal } from "@/components/delegation/AssignTaskModal";
import { useDelegationStore } from "@/store/delegationStore";
import { useOrganizationStore } from "@/store/organizationStore";
import { useBoardSyncStore, gatherBoardDataForBeacon } from "@/store/boardSyncStore";
import { useViewportScale } from "@/hooks/useViewportScale";

// Fullscreen presentation mode is handled inline in the Home component
// (no separate overlay component needed — avoids stacking context issues)

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);
  const setCurrentUserId = useBoardStore((state) => state.setCurrentUserId);
  
  // Get delete functions from all stores for cascade cleanup
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

  const vScale = useViewportScale();

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const data = active.data.current;
    const snap = useGridStore.getState().snapValue;
    
    if (data?.type === 'note') {
      const padding = 16;
      const scaledWidth = 192 * vScale * (useGridStore.getState().zoom);
      const canvasEl = document.querySelector('[data-board-canvas]');
      const canvasScrollW = canvasEl ? canvasEl.scrollWidth : window.innerWidth * 2;
      const newPosition = {
        x: snap(Math.max(padding, Math.min(canvasScrollW - (scaledWidth + padding), data.position.x + delta.x))),
        y: snap(data.position.y + delta.y)
      };
      updateNote(data.id, { position: newPosition });
    } else if (data?.type === 'checklist') {
      const padding = 16;
      const scaledWidth = 320 * vScale * (useGridStore.getState().zoom);
      const canvasEl = document.querySelector('[data-board-canvas]');
      const canvasScrollW = canvasEl ? canvasEl.scrollWidth : window.innerWidth * 2;
      const newPosition = {
        x: snap(Math.max(padding, Math.min(canvasScrollW - (scaledWidth + padding), data.position.x + delta.x))),
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
      const canvasEl = document.querySelector('[data-board-canvas]');
      const canvasScrollW = canvasEl ? canvasEl.scrollWidth : window.innerWidth * 2;
      const newPosition = {
        x: snap(Math.max(padding, Math.min(canvasScrollW - (safeWidth + padding), data.position.x + delta.x))),
        y: snap(data.position.y + delta.y)
      };
      updateText(data.id, { position: newPosition });
    } else if (data?.type === 'kanban') {
      const padding = 16;
      const canvasEl = document.querySelector('[data-board-canvas]');
      const canvasScrollW = canvasEl ? canvasEl.scrollWidth : window.innerWidth * 2;
      const newPosition = {
        x: snap(Math.max(padding, Math.min(canvasScrollW - 800 * vScale, data.position.x + delta.x))),
        y: snap(data.position.y + delta.y)
      };
      updateBoardPosition(data.id, newPosition);
    }
  };

  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled);
  const { isPresentationMode, setPresentationMode } = usePresentationStore();

  // Presentation mode: computed transform to fit all items in viewport
  const [presTransform, setPresTransform] = useState<{ tx: number; ty: number; s: number } | null>(null)
  const [presHintVisible, setPresHintVisible] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

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

  // Auto-load all cloud-synced boards on login for cross-device persistence
  // Lightweight stale check on login + tab focus (replaces heavy full-load)
  // Hits /sync/check (~50 bytes per board) — instant, no loading overlay
  // If stale: shows banner. If not: user proceeds with local data.
  const staleBoards = useBoardSyncStore((state) => state.staleBoards);
  const isSyncing = useBoardSyncStore((state) => state.isSyncing);
  const currentBoardIsStale = currentBoardId ? staleBoards.has(currentBoardId) : false;

  useEffect(() => {
    if (status !== 'authenticated') return

    // Check on initial load (replaces the heavy loadAllCloudBoards)
    useBoardSyncStore.getState().checkForStaleBoards()

    // Also check when user returns to the tab
    const handleVisibility = () => {
      if (!document.hidden) {
        useBoardSyncStore.getState().checkForStaleBoards()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [status]);

  // Debounced auto-sync: detect local changes → mark dirty → push after 30s idle
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHashRef = useRef<string>('');

  useEffect(() => {
    if (status !== 'authenticated' || !currentBoardId) return

    // Check if this board has ever been synced to cloud
    const { contentHashes } = useBoardSyncStore.getState()
    if (!contentHashes[currentBoardId]) return // Never synced — skip auto-push

    // Subscribe to content store changes for the current board
    const checkForChanges = () => {
      const localHash = useBoardSyncStore.getState().computeLocalHash(currentBoardId)
      const cloudHash = contentHashes[currentBoardId] || ''

      if (localHash !== lastHashRef.current) {
        lastHashRef.current = localHash

        if (localHash !== cloudHash) {
          useBoardSyncStore.getState().markDirty(currentBoardId)

          // Reset debounce timer — push after 30s of no further changes
          if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
          syncTimerRef.current = setTimeout(() => {
            useBoardSyncStore.getState().syncDirtyBoards()
          }, 30_000)
        }
      }
    }

    // Poll for changes every 5 seconds (lightweight — just computes a local hash)
    const interval = setInterval(checkForChanges, 5000)

    // Also push any dirty boards when the user leaves the page
    const handleBeforeUnload = () => {
      const { dirtyBoards } = useBoardSyncStore.getState()
      if (dirtyBoards.size > 0) {
        // Use sendBeacon for reliable push on page close
        for (const boardId of dirtyBoards) {
          const boardData = gatherBoardDataForBeacon(boardId)
          if (boardData) {
            navigator.sendBeacon(
              '/api/boards/sync',
              new Blob([JSON.stringify(boardData)], { type: 'application/json' })
            )
          }
        }
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [status, currentBoardId]);

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

  // Presentation mode: compute bounding box of all items → scale to fit viewport
  useEffect(() => {
    if (!isPresentationMode) {
      setPresTransform(null)
      setPresHintVisible(false)
      return
    }

    setPresHintVisible(true)
    const hintTimer = setTimeout(() => setPresHintVisible(false), 3000)

    // Small delay so items are rendered and the canvas ref is available
    const computeTimer = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const items = canvas.querySelectorAll('[data-board-item]')
      if (items.length === 0) return

      // Bounding box in canvas-scroll coordinate space
      const scrollL = canvas.scrollLeft
      const scrollT = canvas.scrollTop
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      items.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const x = rect.left + scrollL
        const y = rect.top + scrollT
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x + rect.width)
        maxY = Math.max(maxY, y + rect.height)
      })

      const cw = maxX - minX
      const ch = maxY - minY
      if (cw <= 0 || ch <= 0) return

      const pad = 60
      const vw = window.innerWidth - pad * 2
      const vh = window.innerHeight - pad * 2
      const s = Math.min(1, vw / cw, vh / ch)
      const sw = cw * s
      const sh = ch * s
      const tx = (window.innerWidth - sw) / 2 - minX * s
      const ty = (window.innerHeight - sh) / 2 - minY * s

      setPresTransform({ tx, ty, s })
    }, 50)

    return () => { clearTimeout(hintTimer); clearTimeout(computeTimer) }
  }, [isPresentationMode]);

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

  // Initialize delegation data when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      useOrganizationStore.getState().fetchOrganizations();
      useDelegationStore.getState().fetchBords();
      useDelegationStore.getState().fetchNotifications();
    }
  }, [status]);

  // Fetch assignments when board changes and is linked to a bord
  useEffect(() => {
    if (!currentBoardId || status !== 'authenticated') return;
    const { getBordForLocalBoard, fetchAssignments } = useDelegationStore.getState();
    const bord = getBordForLocalBoard(currentBoardId);
    if (bord) {
      fetchAssignments(bord._id);
    }
  }, [currentBoardId, status]);

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
        className={`fixed inset-0 ${isDark ? "bg-zinc-900" : "bg-zinc-100"} app-background ${isPresentationMode ? 'overflow-hidden' : 'overflow-auto'}`}
        onClick={isPresentationMode ? undefined : handleGlobalClick}
        style={{
          backgroundImage: !isPresentationMode && currentBoard?.backgroundImage
            ? `url(${currentBoard.backgroundImage})`
            : undefined,
          backgroundColor: isPresentationMode
            ? (isDark ? '#09090b' : '#f4f4f5')
            : (currentBoard?.backgroundColor || undefined),
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >

      {/* Stale board banner — newer version available on cloud */}
      {currentBoardIsStale && !isPresentationMode && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-2.5 rounded-xl shadow-lg backdrop-blur-md bg-blue-500/90 text-white text-sm"
        >
          {isSyncing ? (
            <svg className="w-4 h-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{isSyncing ? 'Updating board…' : 'A newer version of this board is available'}</span>
          <button
            onClick={() => useBoardSyncStore.getState().refreshStaleBoards()}
            disabled={isSyncing}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              isSyncing
                ? 'bg-white/10 cursor-not-allowed opacity-60'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isSyncing ? 'Updating…' : 'Update'}
          </button>
          {!isSyncing && (
            <button
              onClick={() => currentBoardId && useBoardSyncStore.getState().dismissStale(currentBoardId)}
              className="p-0.5 hover:bg-white/20 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </motion.div>
      )}

      {/* Fullscreen presentation mode UI */}
      {isPresentationMode && (
        <>
          {/* Interaction blocker — covers the scaled canvas */}
          <div className="fixed inset-0" style={{ zIndex: 100, pointerEvents: 'auto' }} />

          {/* Exit button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setPresentationMode(false)}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-2xl backdrop-blur-md transition-colors ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                : 'bg-black/10 text-zinc-900 hover:bg-black/20 border border-black/10'
            }`}
            style={{ zIndex: 101 }}
          >
            <X size={16} />
            Exit Full Screen
          </motion.button>

          {/* Hint toast */}
          {presHintVisible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-5 py-3 rounded-xl backdrop-blur-md text-center"
              style={{ zIndex: 101, animation: 'fadeOut 1s ease-in 2s forwards' }}
            >
              <p className="text-sm font-medium">Full Screen Mode</p>
              <p className="text-xs text-white/60 mt-0.5">Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">ESC</kbd> to exit</p>
            </motion.div>
          )}
          <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
        </>
      )}

      <div className="relative min-h-[470vh]">
        {!isPresentationMode && (
          <GridBackground
            hoveredCell={hoveredCell}
            onCellHover={setHoveredCell}
            onCellClick={() => {}}
          />
        )}

        {/* Content and Connection Lines */}
        <div
          ref={canvasRef}
          className={`fixed inset-0 ${isPresentationMode ? 'overflow-visible' : 'overflow-auto'} pb-[450vh]`}
          data-board-canvas
          style={isPresentationMode && presTransform ? {
            transform: `translate(${presTransform.tx}px, ${presTransform.ty}px) scale(${presTransform.s})`,
            transformOrigin: '0 0',
            pointerEvents: 'none',
          } : undefined}
        >
          {/* Connection Lines SVG - rendered before items so lines appear behind */}
          {currentBoardId && <ConnectionLines key={`lines-${currentBoardId}`} />}

          {/* Items Layer */}
          <div
            className="relative"
            style={{ paddingTop: "20vh", paddingBottom: "200vh", minWidth: "200vw" }}
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

        {/* UI Controls Layer - Higher z-index — hidden in presentation mode */}
        {!isPresentationMode && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 50 }}
        >
          {/* Connection Lines + Controls */}
          <div className="pointer-events-auto">
            {currentBoardId && <Connections key={currentBoardId} />}
          </div>

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
            <AssignTaskModal />
          </div>

          {/* Interaction Controls */}
          <div className="pointer-events-auto">
            <DragLayer />
            <OrganizePanel />
          </div>
        </div>
        )}
      </div>
    </div>
    </DndContext>
  );
}
