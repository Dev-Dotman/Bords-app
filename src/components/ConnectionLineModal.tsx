'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useConnectionLineStore } from '@/store/connectionLineStore'

export function ConnectionLineModal() {
  const isDark = useThemeStore((state) => state.isDark)
  const { isModalOpen, closeModal, colorMode, monochromaticColor, setColorMode, setMonochromaticColor } = useConnectionLineStore()
  const [customColor, setCustomColor] = useState(monochromaticColor)

  if (!isModalOpen) return null

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    setMonochromaticColor(color)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        onClick={closeModal}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden
            ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Connection Line Settings
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' 
                    : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Color Mode
            </h3>

            {/* Color Mode Options */}
            <div className="space-y-3">
              {/* Multicolor Option */}
              <button
                onClick={() => setColorMode('multicolor')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  colorMode === 'multicolor'
                    ? 'border-blue-500 bg-blue-500/10'
                    : isDark
                    ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Multicolor
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    colorMode === 'multicolor'
                      ? 'border-blue-500 bg-blue-500'
                      : isDark
                      ? 'border-zinc-600'
                      : 'border-zinc-300'
                  }`}>
                    {colorMode === 'multicolor' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Each connection line has its own unique color
                </p>
                {/* Color preview */}
                <div className="flex gap-1 mt-3">
                  {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                    <div
                      key={color}
                      className="w-8 h-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>

              {/* Monochromatic Option */}
              {/* <button
                onClick={() => setColorMode('monochromatic')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  colorMode === 'monochromatic'
                    ? 'border-blue-500 bg-blue-500/10'
                    : isDark
                    ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Monochromatic
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    colorMode === 'monochromatic'
                      ? 'border-blue-500 bg-blue-500'
                      : isDark
                      ? 'border-zinc-600'
                      : 'border-zinc-300'
                  }`}>
                    {colorMode === 'monochromatic' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className={`text-xs mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  All connection lines use the same color
                </p>

                {colorMode === 'monochromatic' && (
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                    <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Line Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColor}
                        onChange={handleColorChange}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-zinc-300 dark:border-zinc-600"
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value)
                          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                            setMonochromaticColor(e.target.value)
                          }
                        }}
                        placeholder="#000000"
                        className={`flex-1 px-3 py-2 rounded-lg border font-mono text-sm ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white'
                            : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </button> */}
            </div>

            {/* Info */}
            <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                💡 Connection line color settings apply to all connections on this board. (This can't be changed for now )
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
