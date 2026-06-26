import { CONFIG } from '../grid/gridConfig'
import { rigState } from '../grid/gridState'

export function RecenterButton() {
  return (
    <button
      className="recenter-button"
      type="button"
      onClick={() => {
        rigState.target.set(0, 2, 0)
        rigState.activeId = null
        rigState.zoom = CONFIG.zoomOut
      }}
    >
      Recenter
    </button>
  )
}
