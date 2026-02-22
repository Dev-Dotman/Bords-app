'use client'
import { motion } from 'framer-motion'
import { Link2, Trash2, X } from 'lucide-react'
import { useConnectionStore } from '../store/connectionStore'
import { useThemeStore } from '../store/themeStore'
import type { Connection } from '../store/connectionStore'

interface ConnectionsModalProps {
  onClose: () => void
  connections: Connection[]
}

export function ConnectionsModal({ onClose, connections }: ConnectionsModalProps) {
  const { removeConnection } = useConnectionStore()
  const isDark = useThemeStore((state) => state.isDark)

  const getItemDetails = (element: Element | null) => {
    if (!element) return { title: "Untitled", type: "Unknown", content: [] };
    
    const isChecklist = element.classList.contains('item-container');
    
    // Check if it's a kanban board
    if (element.querySelector('.kanban-board') || element.getAttribute('data-kanban-board')) {
      const title = element.querySelector('h3')?.textContent || "Untitled Kanban";
      const columns = element.querySelectorAll('[data-column]')?.length || 
                     element.querySelectorAll('.rounded-xl.p-2\\.5')?.length || 0;
      const tasks = element.querySelectorAll('[draggable="true"]')?.length || 0;
      
      return {
        type: 'Kanban Board',
        title,
        content: [
          { label: 'Columns', value: `${columns} columns` },
          { label: 'Tasks', value: `${tasks} tasks` }
        ]
      };
    }
    
    const type = element.querySelector('.checklist-tasks') ? 'Checklist' : 'Sticky Note';
    
    if (type === 'Checklist') {
      const tasks = element.querySelectorAll('textarea');
      const deadlines = element.querySelectorAll('.deadline-text');
      const timers = element.querySelectorAll('.time-spent');
      
      return {
        type,
        title: element.querySelector('h3')?.textContent || "Untitled Checklist",
        content: [
          { label: 'Tasks', value: `${tasks.length} items` },
          ...Array.from(deadlines).map(deadline => ({
            label: 'Deadline',
            value: deadline.textContent
          })),
          ...Array.from(timers)
            .filter(timer => timer.textContent)
            .map(timer => ({
              label: 'Time Tracked',
              value: timer.textContent
            }))
        ]
      };
    } else {
      return {
        type,
        title: "Sticky Note",
        content: [
          { value: element.querySelector('.note-content')?.textContent?.trim() || "No content" }
        ]
      };
    }
  };

  return (
    <motion.div 
      className={`fixed inset-0 backdrop-blur-sm z-[9999] pointer-events-auto ${
        isDark ? 'bg-black/50' : 'bg-black/30'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    rounded-2xl shadow-2xl border pointer-events-auto ${ 
                      isDark 
                        ? 'bg-zinc-900 border-zinc-700/50' 
                        : 'bg-white border-zinc-200/50'
                    }`}
        style={{ width: '50vw', maxWidth: '1000px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          isDark ? 'border-zinc-700/50' : 'border-zinc-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                Mind Map Overview
              </h3>
              <p className={`text-sm mt-1 ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Visualize and manage your connected items
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all hover:scale-110 ${
                isDark 
                  ? 'hover:bg-zinc-700/50' 
                  : 'hover:bg-zinc-100'
              }`}
            >
              <X size={20} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
            </button>
          </div>

          <div className="mt-6 flex gap-3">
            <div className={`flex-1 px-4 py-3 rounded-xl ${
              isDark ? 'bg-zinc-900/50' : 'bg-zinc-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Total Connections
              </div>
              <div className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                {connections.length}
              </div>
            </div>
            <div className={`flex-1 px-4 py-3 rounded-xl ${
              isDark ? 'bg-zinc-900/50' : 'bg-zinc-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Connected Items
              </div>
              <div className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                {new Set(connections.flatMap(c => [c.fromId, c.toId])).size}
              </div>
            </div>
          </div>
        </div>

        {/* Connections List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {connections.length === 0 ? (
            <div className={`text-center py-12 ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDark ? 'bg-zinc-900/50' : 'bg-zinc-100'
              }`}>
                <Link2 size={28} className={isDark ? 'text-zinc-600' : 'text-zinc-400'} />
              </div>
              <p className={`font-semibold text-lg mb-2 ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                No connections yet
              </p>
              <p className="text-sm">
                Create connections by selecting two items and clicking "Connect"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn, index) => {
                const fromEl = document.querySelector(`[data-node-id="${conn.fromId}"]`)
                const toEl = document.querySelector(`[data-node-id="${conn.toId}"]`)
                const from = getItemDetails(fromEl)
                const to = getItemDetails(toEl)
                
                return (
                  <div key={conn.id}>
                    <div 
                      className={`p-4 rounded-xl group transition-all ${
                        isDark 
                          ? 'bg-zinc-900/30 backdrop-blur-sm' 
                          : 'bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: conn.color }} />
                        <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
                          {/* From Item */}
                          <div className={`p-4 rounded-xl border backdrop-blur-sm space-y-2 ${ 
                            isDark 
                              ? 'bg-zinc-800/50 border-zinc-700/50' 
                              : 'bg-white/80 border-zinc-200/50'
                          }`}>
                            <div className={`text-xs font-semibold uppercase tracking-wider ${
                              from.type === 'Checklist' ? 'text-emerald-500' : 'text-blue-500'
                            }`}>
                              {from.type}
                            </div>
                            <div className={`font-semibold text-sm pb-2 border-b ${
                              isDark ? 'border-zinc-700/50 text-white' : 'border-zinc-200 text-zinc-900'
                            }`}>
                              {from.title}
                            </div>
                            <div className="space-y-1.5 pt-1">
                              {from.content.map((item: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  {'label' in item && (
                                    <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>
                                      {item.label}:{' '}
                                    </span>
                                  )}
                                  <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Arrow - Centered */}
                          <div className="flex justify-center">
                            <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${ 
                              isDark 
                                ? 'bg-zinc-800/50 border-zinc-700/50' 
                                : 'bg-white border-zinc-200'
                            }`}>
                              <Link2 size={18} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                            </div>
                          </div>

                          {/* To Item */}
                          <div className={`p-4 rounded-xl border backdrop-blur-sm space-y-2 ${
                            isDark 
                              ? 'bg-zinc-800/50 border-zinc-700/50' 
                              : 'bg-white/80 border-zinc-200/50'
                          }`}>
                            <div className={`text-xs font-semibold uppercase tracking-wider ${
                              to.type === 'Checklist' ? 'text-emerald-500' : 'text-blue-500'
                            }`}>
                              {to.type}
                            </div>
                            <div className={`font-semibold text-sm pb-2 border-b ${
                              isDark ? 'border-zinc-700/50 text-white' : 'border-zinc-200 text-zinc-900'
                            }`}>
                              {to.title}
                            </div>
                            <div className="space-y-1.5 pt-1">
                              {to.content.map((item: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  {'label' in item && (
                                    <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>
                                      {item.label}:{' '}
                                    </span>
                                  )}
                                  <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeConnection(conn.id)}
                          className={`opacity-0 group-hover:opacity-100 p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
                            isDark 
                              ? 'hover:bg-zinc-800/80' 
                              : 'hover:bg-white'
                          }`}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Separation line between connections */}
                    {/* {index < connections.length - 1 && (
                      <div className={`my-4 border-t ${
                        isDark ? 'border-zinc-800' : 'border-zinc-200'
                      }`} />
                    )} */}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
