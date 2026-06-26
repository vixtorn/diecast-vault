import * as THREE from 'three'
import { CONFIG } from './gridConfig'
import type { CategoryFilter, DiecastCar } from '../../types/car'

export const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 0)

export const rigState = {
  currentPosition: DEFAULT_CAMERA_POSITION.clone(),
  targetPosition: DEFAULT_CAMERA_POSITION.clone(),
  velocity: new THREE.Vector3(0, 0, 0),
  currentDistance: CONFIG.zoomOut,
  targetDistance: CONFIG.zoomOut,
  isDragging: false,
  lastPointerWasDrag: false,
  activeId: null as number | null,
  selectedCarId: null as string | null,
}

export function resetRigView({ syncCurrent = false } = {}) {
  rigState.targetPosition.copy(DEFAULT_CAMERA_POSITION)
  rigState.targetDistance = CONFIG.zoomOut
  rigState.activeId = null
  rigState.selectedCarId = null

  if (syncCurrent) {
    rigState.currentPosition.copy(DEFAULT_CAMERA_POSITION)
    rigState.currentDistance = CONFIG.zoomOut
  }
}

export function focusRigOnCar(index: number, carId: string, position: { x: number; y: number }) {
  rigState.targetPosition.set(position.x, position.y, 0)
  rigState.targetDistance = CONFIG.focusZoom
  rigState.activeId = index
  rigState.selectedCarId = carId
}

export function getGridCols(count: number) {
  return count === 16 ? 4 : count === 9 ? 3 : Math.min(CONFIG.gridCols, Math.max(count, 1))
}

export function calculateGridDimensions(count: number) {
  const cols = getGridCols(count)
  const rows = Math.ceil(count / cols)
  const spacing = CONFIG.itemSize + CONFIG.gap

  return {
    cols,
    rows,
    width: cols * spacing,
    height: rows * spacing,
  }
}

export function matchesFilter(car: DiecastCar, filter: CategoryFilter) {
  return car.categories.includes(filter)
}
