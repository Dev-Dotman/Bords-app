"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
import { BackgroundModal } from "@/components/BackgroundModal";
import { ConnectionLineModal } from "@/components/ConnectionLineModal";
import { useGridStore } from "@/store/gridStore";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);
  const setCurrentUserId = useBoardStore((state) => state.setCurrentUserId);

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
    
    if (data?.type === 'note') {
      const padding = 16;
      const scaledWidth = 192 * (useGridStore.getState().zoom);
      const newPosition = {
        x: Math.max(padding, Math.min(window.innerWidth - (scaledWidth + padding), data.position.x + delta.x)),
        y: data.position.y + delta.y
      };
      updateNote(data.id, { position: newPosition });
    } else if (data?.type === 'checklist') {
      const padding = 16;
      const scaledWidth = 320 * (useGridStore.getState().zoom);
      const newPosition = {
        x: Math.max(padding, Math.min(window.innerWidth - (scaledWidth + padding), data.position.x + delta.x)),
        y: data.position.y + delta.y
      };
      updateChecklist(data.id, { position: newPosition });
    } else if (data?.type === 'media') {
      const newPosition = {
        x: data.position.x + delta.x,
        y: data.position.y + delta.y
      };
      updateMedia(data.id, { position: newPosition });
    } else if (data?.type === 'text') {
      const padding = 16;
      const baseWidth = 200;
      const safeWidth = Math.max(baseWidth, texts.find(t => t.id === data.id)?.text.length || 0 * data.fontSize * 0.6);
      const newPosition = {
        x: Math.max(padding, Math.min(window.innerWidth - (safeWidth + padding), data.position.x + delta.x)),
        y: data.position.y + delta.y
      };
      updateText(data.id, { position: newPosition });
    } else if (data?.type === 'kanban') {
      const padding = 16;
      const newPosition = {
        x: Math.max(padding, Math.min(window.innerWidth - 800, data.position.x + delta.x)),
        y: data.position.y + delta.y
      };
      updateBoardPosition(data.id, newPosition);
    }
  };

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
          {/* Board Name - Centered with Glassmorphism */}
          <div
            className="fixed top-5 left-1/2 -translate-x-1/2 pointer-events-none z-10"
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
          </div>

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
