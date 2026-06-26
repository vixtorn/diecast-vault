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
    if (!hasSetInitialZoom.current && rigState.currentDistance) {
      perspectiveCamera.position.z = rigState.currentDistance
      hasSetInitialZoom.current = true
    }

    if (import.meta.env.DEV) {
      Object.assign(window, { __diecastRigState: rigState })
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
      initialRigX = rigState.targetPosition.x
      initialRigY = rigState.targetPosition.y
      maxDragDistance = 0
      rigState.isDragging = false
      rigState.lastPointerWasDrag = false
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
        rigState.lastPointerWasDrag = true
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
      rigState.targetPosition.set(rawTargetX, rawTargetY, 0)
    }

    function onUp() {
      if (!isDown) {
        return
      }

      isDown = false
      const wasDrag = rigState.lastPointerWasDrag
      rigState.isDragging = false
      canvas.style.cursor = 'grab'

      if (rigState.activeId !== null || !wasDrag) {
        return
      }

      const { x: bx, y: by } = getBounds()
      rigState.targetPosition.set(
        Math.max(-bx, Math.min(bx, rigState.targetPosition.x)),
        Math.max(-by, Math.min(by, rigState.targetPosition.y)),
        0,
      )
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      rigState.targetDistance = Math.max(
        CONFIG.minZoom,
        Math.min(CONFIG.zoomOut, rigState.targetDistance + event.deltaY * 0.018),
      )
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
    easing.damp3(rigState.currentPosition, rigState.targetPosition, CONFIG.dampFactor, delta)
    easing.damp(rigState, 'currentDistance', rigState.targetDistance, CONFIG.zoomDamp, delta)
    perspectiveCamera.position.x = rigState.currentPosition.x
    perspectiveCamera.position.y = rigState.currentPosition.y
    perspectiveCamera.position.z = rigState.currentDistance
    rigState.velocity.copy(rigState.currentPosition).sub(previous.current)
    previous.current.copy(rigState.currentPosition)

    const zoomFactor = Math.min(1, CONFIG.zoomIn / rigState.currentDistance)
    easing.damp(perspectiveCamera.rotation, 'x', rigState.velocity.y * CONFIG.tiltFactor * zoomFactor, 0.2, delta)
    easing.damp(perspectiveCamera.rotation, 'y', -rigState.velocity.x * CONFIG.tiltFactor * zoomFactor, 0.2, delta)
  })

  return null
}
