import * as THREE from 'three'
import { CONFIG } from './gridConfig'
import type { CategoryFilter, DiecastCar } from '../../types/car'

export const rigState = {
  target: new THREE.Vector3(0, 2, 0),
  current: new THREE.Vector3(0, 2, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  zoom: CONFIG.zoomOut,
  isDragging: false,
  activeId: null as number | null,
}

export function getGridCols(count: number) {
  return count === 9 ? 3 : Math.min(CONFIG.gridCols, Math.max(count, 1))
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
  if (filter === 'all') {
    return Boolean(car.featured)
  }

  return car.categories.includes(filter)
}
