import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Trash2,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Palette,
} from "lucide-react";
import { useMediaStore, Media as MediaType } from "../store/mediaStore";
import { useThemeStore } from "../store/themeStore";
import { useDragModeStore } from "../store/dragModeStore";
import { useConnectionStore } from "../store/connectionStore";
import { ConnectionNode } from "./ConnectionNode";

const mediaColorOptions = [
  { name: "White", value: "#FFFFFF" },
  { name: "Yellow", value: "#FEF3C7" },
  { name: "Pink", value: "#FCE7F3" },
  { name: "Blue", value: "#DBEAFE" },
  { name: "Green", value: "#D1FAE5" },
  { name: "Purple", value: "#E9D5FF" },
  { name: "Orange", value: "#FFEDD5" },
  { name: "Red", value: "#FEE2E2" },
  { name: "Gray", value: "#F3F4F6" },
];

export function Media({
  id,
  url,
  title,
  description,
  type,
  position,
  width,
  height,
  color,
}: MediaType) {
  const [isHovered, setIsHovered] = useState(false);
  const [showNodes, setShowNodes] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);
  const { updateMedia, deleteMedia } = useMediaStore();
  const isDragEnabled = useDragModeStore((state) => state.isDragEnabled);
  const { selectedItems, selectItem, deselectItem } = useConnectionStore();
  const connections = useConnectionStore((state) => state.connections);
  const isVisible = useConnectionStore((state) => state.isVisible);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMedia(id);
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDoubleClick = () => {
    const isSelected = selectedItems.some((item) => item.id === id);
    if (isSelected) {
      deselectItem(id);
    } else {
      selectItem(id, "media", position);
    }
  };

  const isSelected = selectedItems.some(
    (item) => item.id === id && item.type === "media"
  );
  const isConnected = connections.some(
    (conn) => conn.fromId === id || conn.toId === id
  );

  const getConnectionSide = () => {
    const connection = connections.find(
      (conn) => conn.fromId === id || conn.toId === id
    );
    if (!connection) return null;

    const otherId =
      connection.fromId === id ? connection.toId : connection.fromId;
    const otherElement = document.querySelector(`[data-node-id="${otherId}"]`);
    if (!otherElement) return null;

    const otherRect = otherElement.getBoundingClientRect();
    const thisRect = document
      .querySelector(`[data-node-id="${id}"]`)
      ?.getBoundingClientRect();

    if (!thisRect) return null;

    return otherRect.left < thisRect.left ? "left" : "right";
  };

  // Extract YouTube video ID if it's a YouTube URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
    }
    return null;
  };

  const thumbnailUrl = type === "video" ? getYouTubeThumbnail(url) : null;

  return (
    <>
      <motion.div
        ref={mediaRef}
        drag={isDragEnabled}
        dragMomentum={false}
        dragElastic={0}
        dragTransition={{ power: 0, timeConstant: 0 }}
        onDragEnd={(_, info) => {
          const newX = position.x + info.offset.x;
          const newY = position.y + info.offset.y;
          updateMedia(id, { position: { x: newX, y: newY } });
        }}
        initial={false}
        animate={{ x: position.x, y: position.y }}
        //   transition={false}
        style={{
          width: type === "video" ? `${width * 0.7}px` : `${width}px`,
          cursor: isDragEnabled ? "move" : "default",
          scrollMargin: 0,
          touchAction: "none",
        }}
        className={`absolute item-container ${
          isSelected ? "ring-2 ring-blue-400/30" : ""
        }`}
        data-node-id={id}
        tabIndex={0}
        onFocus={(e) => e.preventDefault()}
        onDoubleClick={handleDoubleClick}
        onClick={() => setShowNodes(true)}
        onBlur={() => setShowNodes(false)}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowNodes(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowNodes(false);
        }}
      >
        {isConnected && isVisible && (
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 w-3 h-3 
              bg-blue-500 rounded-full border-2 border-white 
              shadow-md animate-pulse connection-indicator
              ${getConnectionSide() === "left" ? "-left-1.5" : "-right-1.5"}
            `}
            data-connection-id={`${id}-indicator`}
            data-connection-side={getConnectionSide()}
          />
        )}
        <div
          className={`rounded-2xl border-2 overflow-hidden shadow-lg transition-all duration-200
          ${
            isSelected
              ? "border-blue-500 shadow-blue-500/50"
              : isDark
                ? "border-zinc-700 hover:border-zinc-600"
                : "border-zinc-300 hover:border-zinc-400"
          }
          ${isDark ? "bg-zinc-800" : "bg-white"}`}
          style={{
            backgroundColor: color || (isDark ? "#27272a" : "#ffffff"),
            ...(type === "image" && color && !isSelected
              ? { borderColor: color }
              : {}),
          }}
        >
          {/* Media Content */}
          <div
            className={`relative ${type === "video" ? "aspect-video" : ""} ${isDark ? "bg-zinc-900" : "bg-zinc-100"}`}
            style={type === "image" ? { height: `${height}px` } : undefined}
          >
            {type === "image" ? (
              imageError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center px-4">
                    <p
                      className={`text-sm font-medium mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
                    >
                      Failed to load image
                    </p>
                    <button
                      onClick={handleOpenUrl}
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mx-auto"
                    >
                      Open URL <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={url}
                    alt={title || "Media"}
                    className="w-full h-full object-contain pointer-events-none"
                    onError={() => setImageError(true)}
                  />
                  {/* Overlay to make entire image area draggable */}
                  <div className="absolute inset-0 cursor-move" />
                </>
              )
            ) : (
              <>
                <iframe
                  src={getYouTubeEmbedUrl(url)}
                  title={title || "Video"}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {/* Hidden thumbnail for export - positioned behind iframe */}
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt={title || "Video thumbnail"}
                    className="absolute inset-0 w-full h-full object-cover -z-10"
                    crossOrigin="anonymous"
                    data-export-thumbnail="true"
                  />
                )}
              </>
            )}
          </div>

          {/* Title & Description - Only for videos */}
          {type === "video" && (
            <div
              className={`p-4 border-t ${isDark ? "border-zinc-700" : "border-zinc-200"}`}
            >
              {title && (
                <h3
                  className={`font-semibold mb-1 line-clamp-2 ${isDark ? "text-white" : "text-zinc-900"}`}
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
                >
                  {description}
                </p>
              )}
              {!title && !description && (
                <p
                  className={`text-sm ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
                >
                  <Video size={14} />
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div
            className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-200
            ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white shadow-lg transition-colors"
              title="Change media color"
            >
              <Palette size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
              title="Delete media"
            >
              <Trash2 size={16} />
            </button>
          </div>
          {/* Connection Nodes */}
          <ConnectionNode
            id={id}
            type="media"
            side="left"
            position={position}
            isVisible={showNodes}
          />
          <ConnectionNode
            id={id}
            type="media"
            side="right"
            position={position}
            isVisible={showNodes}
          />

          {/* Color Picker */}
          {showColorPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute top-14 right-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/10 p-3 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs font-medium text-gray-600 mb-2 text-center">
                Select Background Color
              </div>
              <div className="grid grid-cols-3 gap-2">
                {mediaColorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateMedia(id, { color: colorOption.value });
                      setShowColorPicker(false);
                    }}
                    className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      color === colorOption.value
                        ? "border-blue-500 scale-110 ring-2 ring-blue-200"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
