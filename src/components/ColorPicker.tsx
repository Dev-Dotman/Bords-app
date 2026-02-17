import { useEffect, useRef } from 'react'

export const boardColorOptions = [
  // Row 1 — warm
  { name: 'Yellow', value: 'bg-yellow-200/80' },
  { name: 'Amber', value: 'bg-amber-200/80' },
  { name: 'Orange', value: 'bg-orange-200/80' },
  { name: 'Red', value: 'bg-red-200/80' },
  { name: 'Rose', value: 'bg-rose-200/80' },
  // Row 2 — cool
  { name: 'Pink', value: 'bg-pink-200/80' },
  { name: 'Fuchsia', value: 'bg-fuchsia-200/80' },
  { name: 'Purple', value: 'bg-purple-200/80' },
  { name: 'Violet', value: 'bg-violet-200/80' },
  { name: 'Indigo', value: 'bg-indigo-200/80' },
  // Row 3 — nature
  { name: 'Blue', value: 'bg-blue-200/80' },
  { name: 'Sky', value: 'bg-sky-200/80' },
  { name: 'Cyan', value: 'bg-cyan-200/80' },
  { name: 'Teal', value: 'bg-teal-200/80' },
  { name: 'Emerald', value: 'bg-emerald-200/80' },
  // Row 4 — earth + neutral
  { name: 'Green', value: 'bg-green-200/80' },
  { name: 'Lime', value: 'bg-lime-200/80' },
  { name: 'Stone', value: 'bg-stone-200/80' },
  { name: 'Zinc', value: 'bg-zinc-200/80' },
  { name: 'White', value: 'bg-white/90' },
]

interface ColorPickerProps {
  currentColor: string
  onSelect: (color: string) => void
  onClose: () => void
  /** Label shown at top, e.g. "Select Color" */
  label?: string
  /** Position classes, e.g. "top-full right-0 mt-2" */
  position?: string
}

export function ColorPicker({
  currentColor,
  onSelect,
  onClose,
  label = 'Select Color',
  position = 'top-full right-0 mt-2',
}: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Click-outside to close
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handle)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className={`absolute ${position} bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/10 p-3 z-[9999]`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="text-xs font-medium text-gray-600 mb-2 text-center">
        {label}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {boardColorOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(opt.value)
              onClose()
            }}
            className={`w-8 h-8 rounded-lg border-2 transition-all duration-150 hover:scale-110 ${
              currentColor === opt.value
                ? 'border-blue-500 scale-110 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            } ${opt.value}`}
            title={opt.name}
          />
        ))}
      </div>
    </div>
  )
}
