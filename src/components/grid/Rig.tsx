/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import * as THREE from 'three'
import { CONFIG } from './gridConfig'
import { rigState } from './gridState'

type RigProps = {
  gridW: number
  gridH: number
}

export function Rig({ gridW, gridH }: RigProps) {
  const { camera, gl } = useThree()
  const perspectiveCamera = camera as THREE.PerspectiveCamera
  const previous = useRef(new THREE.Vector3())
  const hasSetInitialZoom = useRef(false)

  useEffect(() => {
    if (!hasSetInitialZoom.current && rigState.zoom) {
      perspectiveCamera.position.z = rigState.zoom
      hasSetInitialZoom.current = true
    }
  }, [perspectiveCamera])

  function getBounds() {
    const dist = perspectiveCamera.position.z
    const vFov = (perspectiveCamera.fov * Math.PI) / 180
    const visibleHeight = 2 * Math.tan(vFov / 2) * dist
    const visibleWidth = visibleHeight * perspectiveCamera.aspect

    return {
      visibleHeight,
      x: Math.max(0, (gridW - visibleWidth) / 2 + 2),
      y: Math.max(0, (gridH - visibleHeight) / 2 + 2),
    }
  }

  useEffect(() => {
    const canvas = gl.domElement
    let isDown = false
    let startX = 0
    let startY = 0
    let initialRigX = 0
    let initialRigY = 0
    let maxDragDistance = 0

    function onDown(event: PointerEvent) {
      isDown = true
      startX = event.clientX
      startY = event.clientY
      initialRigX = rigState.target.x
      initialRigY = rigState.target.y
      maxDragDistance = 0
      rigState.isDragging = false
      canvas.style.cursor = 'grabbing'
    }

    function onMove(event: PointerEvent) {
      if (!isDown) {
        return
      }

      const dx = event.clientX - startX
      const dy = event.clientY - startY
      maxDragDistance = Math.max(maxDragDistance, Math.hypot(dx, dy))
      const threshold = 'ontouchstart' in window ? 15 : CONFIG.clickThreshold

      if (maxDragDistance > threshold) {
        rigState.isDragging = true
        rigState.activeId = null
      }

      const { x: bx, y: by, visibleHeight } = getBounds()
      const sensitivity = (visibleHeight / window.innerHeight) * CONFIG.dragSpeed
      let rawTargetX = initialRigX + dx * sensitivity
      let rawTargetY = initialRigY - dy * sensitivity

      if (rawTargetX > bx) rawTargetX = bx + (rawTargetX - bx) * CONFIG.dragResistance
      if (rawTargetX < -bx) rawTargetX = -bx + (rawTargetX + bx) * CONFIG.dragResistance
      if (rawTargetY > by) rawTargetY = by + (rawTargetY - by) * CONFIG.dragResistance
      if (rawTargetY < -by) rawTargetY = -by + (rawTargetY + by) * CONFIG.dragResistance

      const maxOvershoot = 3
      rawTargetX = Math.max(-bx - maxOvershoot, Math.min(bx + maxOvershoot, rawTargetX))
      rawTargetY = Math.max(-by - maxOvershoot, Math.min(by + maxOvershoot, rawTargetY))
      rigState.target.set(rawTargetX, rawTargetY, 0)
    }

    function onUp() {
      if (!isDown) {
        return
      }

      isDown = false
      rigState.isDragging = false
      canvas.style.cursor = 'grab'

      if (rigState.activeId !== null) {
        return
      }

      const { x: bx, y: by } = getBounds()
      const isZoomedOut = perspectiveCamera.position.z > CONFIG.zoomIn + 2
      rigState.target.set(
        isZoomedOut ? 0 : Math.max(-bx, Math.min(bx, rigState.target.x)),
        isZoomedOut ? 2 : Math.max(-by, Math.min(by, rigState.target.y)),
        0,
      )
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      rigState.zoom = Math.max(CONFIG.zoomIn, Math.min(CONFIG.zoomOut, rigState.zoom + event.deltaY * 0.018))
      if (rigState.zoom > CONFIG.zoomIn + 2) {
        rigState.activeId = null
      }
    }

    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.style.cursor = 'grab'

    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl, gridH, gridW, perspectiveCamera])

  useFrame((_, delta) => {
    easing.damp3(rigState.current, rigState.target, CONFIG.dampFactor, delta)
    easing.damp(perspectiveCamera.position, 'z', rigState.zoom, CONFIG.zoomDamp, delta)
    perspectiveCamera.position.x = rigState.current.x
    perspectiveCamera.position.y = rigState.current.y
    rigState.velocity.copy(rigState.current).sub(previous.current)
    previous.current.copy(rigState.current)

    const zoomFactor = Math.min(1, CONFIG.zoomIn / rigState.zoom)
    easing.damp(perspectiveCamera.rotation, 'x', rigState.velocity.y * CONFIG.tiltFactor * zoomFactor, 0.2, delta)
    easing.damp(perspectiveCamera.rotation, 'y', -rigState.velocity.x * CONFIG.tiltFactor * zoomFactor, 0.2, delta)
  })

  return null
}
