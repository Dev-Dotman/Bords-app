import { useState, useEffect } from 'react'

/**
 * Returns a scale factor (0.55–1.0) based on viewport width.
 *
 * Desktop  ≥ 1440 px → 1.0
 * iPad landscape ~1194 px → ~0.83
 * iPad portrait   ~834 px → ~0.58 (clamped to 0.55)
 *
 * Items multiply their rendered width / height by this factor so they
 * fit comfortably on smaller screens without affecting stored dimensions.
 */
export function useViewportScale(): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      // Linear interpolation: 1440 → 1.0,  down to min 0.55
      setScale(Math.min(1, Math.max(0.55, w / 1440)))
    }

    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return scale
}
