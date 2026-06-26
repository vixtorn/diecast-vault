import { CONFIG } from './gridConfig'
import { calculateGridDimensions, getGridCols } from './gridState'

export type BasePosition = {
  x: number
  y: number
}

export function getBasePosition(index: number, count: number): BasePosition {
  const cols = getGridCols(count)
  const spacing = CONFIG.itemSize + CONFIG.gap
  const dims = calculateGridDimensions(count)
  const column = index % cols
  const row = Math.floor(index / cols)
  const centeredColumn = column - (cols - 1) / 2
  const centeredRow = row - (dims.rows - 1) / 2
  const radialTuck = count <= 10 ? 0.22 : 0

  return {
    x: centeredColumn * spacing * (1 - Math.abs(centeredRow) * radialTuck),
    y: -centeredRow * spacing * (1 - Math.abs(centeredColumn) * radialTuck * 0.45),
  }
}
