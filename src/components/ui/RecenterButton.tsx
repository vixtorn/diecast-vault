import { resetRigView } from '../grid/gridState'

export function RecenterButton() {
  return (
    <button
      className="recenter-button"
      type="button"
      onClick={() => {
        resetRigView()
      }}
    >
      Recenter
    </button>
  )
}
