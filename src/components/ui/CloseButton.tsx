import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { rigState } from '../grid/gridState'

export function CloseButton() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsActive(rigState.activeId !== null)
    }, 80)

    return () => window.clearInterval(interval)
  }, [])

  if (!isActive) {
    return null
  }

  return (
    <button
      className="floating-close"
      type="button"
      aria-label="Close selected car"
      onClick={() => {
        rigState.activeId = null
      }}
    >
      <X size={18} strokeWidth={2} />
    </button>
  )
}
