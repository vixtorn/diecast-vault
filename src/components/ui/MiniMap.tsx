import { useEffect, useRef } from 'react'
import { calculateGridDimensions, getGridCols, rigState } from '../grid/gridState'

type MiniMapProps = {
  count: number
}

export function MiniMap({ count }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridDimensions = calculateGridDimensions(count)
  const rows = gridDimensions.rows
  const columns = gridDimensions.cols

  useEffect(() => {
    let frame = 0

    function draw() {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')

      if (!canvas || !context) {
        frame = requestAnimationFrame(draw)
        return
      }

      const ratio = window.devicePixelRatio || 1
      const width = canvas.clientWidth * ratio
      const height = canvas.clientHeight * ratio

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      context.clearRect(0, 0, width, height)
      context.fillStyle = 'rgba(24, 23, 21, 0.1)'
      context.fillRect(0, 0, width, height)

      for (let index = 0; index < count; index += 1) {
        const column = index % getGridCols(count)
        const row = Math.floor(index / getGridCols(count))
        const x = ((column + 0.5) / columns) * width
        const y = ((row + 0.5) / rows) * height
        context.beginPath()
        context.arc(x, y, 2.8 * ratio, 0, Math.PI * 2)
        context.fillStyle = rigState.activeId === index ? '#ffb000' : 'rgba(255, 255, 255, 0.4)'
        context.fill()
      }

      const viewportX = 0.5 + rigState.currentPosition.x / Math.max(gridDimensions.width, 1)
      const viewportY = 0.5 - rigState.currentPosition.y / Math.max(gridDimensions.height, 1)
      context.strokeStyle = 'rgba(30, 30, 28, 0.82)'
      context.lineWidth = ratio
      context.strokeRect(
        viewportX * width - width * 0.12,
        viewportY * height - height * 0.14,
        width * 0.24,
        height * 0.28,
      )

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [columns, count, gridDimensions.height, gridDimensions.width, rows])

  return (
    <div className="mini-map" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
