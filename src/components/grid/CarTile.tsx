/* eslint-disable react-hooks/immutability */
import { Text, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { CONFIG } from './gridConfig'
import { focusRigOnCar, rigState } from './gridState'
import type { BasePosition } from './gridLayout'
import type { DiecastCar } from '../../types/car'

type CarTileProps = {
  basePos: BasePosition
  car: DiecastCar & {
    randomDelay: number
    matchesFilter: boolean
  }
  gridHeight: number
  gridVisible: boolean
  index: number
  interactive: boolean
  transitionStartTime: number
}

export function CarTile({
  basePos,
  car,
  gridHeight,
  gridVisible,
  index,
  interactive,
  transitionStartTime,
}: CarTileProps) {
  const ref = useRef<THREE.Group>(null)
  const imageRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null)
  const titleRef = useRef<unknown>(null)
  const [hovered, setHovered] = useState(false)
  const texture = useTexture(car.imageUrl)
  const focusZ = useRef(0)
  const rotationX = useRef(0)
  const rotationY = useRef(0)
  const curveZ = useRef(0)
  const transitionZ = useRef(0)
  const transitionY = useRef(0)
  const animatedPos = useRef({ x: basePos.x, y: basePos.y })
  const filterOpacity = useRef(1)
  const filterScale = useRef(1)
  const isSleep = useRef(false)
  const wasDimmedByFocus = useRef(false)

  const imageDims = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 8

    const maxSize = CONFIG.itemSize * 1.08
    const image = texture.image as HTMLImageElement | undefined
    const aspect = image?.width && image?.height ? image.width / image.height : 2.8

    return aspect > 1
      ? { width: maxSize, height: maxSize / aspect }
      : { width: maxSize * aspect, height: maxSize }
  }, [texture])

  useLayoutEffect(() => {
    const normalizedY = gridHeight > 0 ? basePos.y / (gridHeight / 2) : 0

    if (gridVisible) {
      transitionZ.current = CONFIG.enterStartZ
      transitionY.current = normalizedY * CONFIG.enterSpreadY
      if (imageRef.current) imageRef.current.material.opacity = CONFIG.enterStartOpacity
      isSleep.current = false
    } else {
      transitionZ.current = 0
      transitionY.current = 0
      if (imageRef.current) imageRef.current.material.opacity = 1
    }
  }, [basePos.y, gridHeight, gridVisible])

  useFrame((_, delta) => {
    if (!ref.current || !imageRef.current || isSleep.current) return

    easing.damp(animatedPos.current, 'x', basePos.x, 0.2, delta)
    easing.damp(animatedPos.current, 'y', basePos.y, 0.2, delta)
    easing.damp(filterOpacity, 'current', car.matchesFilter ? 1 : 0, CONFIG.filterOpacityDamp, delta)
    easing.damp(filterScale, 'current', car.matchesFilter ? 1 : CONFIG.filterScaleTarget, CONFIG.filterOpacityDamp, delta)

    const actualOpacity = imageRef.current.material.opacity
    if (actualOpacity < 0.01 && !car.matchesFilter) {
      ref.current.visible = false
      return
    }

    const timeSinceTrigger = Date.now() - transitionStartTime
    const canTransition = timeSinceTrigger > car.randomDelay
    const normalizedY = gridHeight > 0 ? basePos.y / (gridHeight / 2) : 0
    let targetTransitionOpacity = 1
    let targetTransitionZ = 0
    let targetTransitionY = 0

    if (gridVisible) {
      if (!canTransition) {
        targetTransitionOpacity = CONFIG.enterStartOpacity
        targetTransitionZ = CONFIG.enterStartZ
        targetTransitionY = normalizedY * CONFIG.enterSpreadY
      }
    } else if (canTransition) {
      targetTransitionOpacity = 0
      targetTransitionZ = CONFIG.exitEndZ
      targetTransitionY = normalizedY * CONFIG.exitSpreadY
    }

    const x = animatedPos.current.x
    const y = animatedPos.current.y
    const screenX = x - rigState.currentPosition.x
    const screenY = y - rigState.currentPosition.y
    const currentCull = CONFIG.cullDistance * (rigState.currentDistance / 8)
    const isPositionVisible = Math.abs(screenX) < currentCull && Math.abs(screenY) < currentCull

    if (!gridVisible && targetTransitionOpacity < 0.01 && filterOpacity.current < 0.01) {
      ref.current.visible = false
      isSleep.current = true
      return
    }

    if (!isPositionVisible && !(!gridVisible && canTransition)) {
      ref.current.visible = false
      return
    }

    ref.current.visible = true

    const isZoomedIn = rigState.currentDistance <= CONFIG.zoomIn + 0.5
    const zoomRatio = isZoomedIn
      ? 0
      : THREE.MathUtils.clamp((rigState.currentDistance - CONFIG.zoomIn) / (CONFIG.zoomOut - CONFIG.zoomIn), 0, 1)
    const smoothRatio = easing.cubic.inOut(zoomRatio)
    const distSq = screenX * screenX + screenY * screenY
    const dist = Math.sqrt(distSq)
    const targetCurveZ = -distSq * CONFIG.curvatureStrength * smoothRatio
    const rotationIntensity = Math.min(dist * 0.4, 2) * smoothRatio
    const targetRotX = screenY * CONFIG.curvatureStrength * CONFIG.rotationStrength * rotationIntensity
    const targetRotY = -screenX * CONFIG.curvatureStrength * CONFIG.rotationStrength * rotationIntensity
    const isFocusMode = rigState.activeId !== null
    const isActive = rigState.activeId === index
    const isHovered = hovered && interactive
    const interactionScale = isFocusMode
      ? isActive
        ? CONFIG.focusScale
        : CONFIG.dimScale
      : isHovered && !rigState.isDragging
        ? 1.05
        : 1
    const interactionOpacity = isFocusMode && !isActive ? CONFIG.dimOpacity : 1
    const targetTextOpacity = isFocusMode && isActive ? 1 : 0
    const targetFocusZ = isFocusMode
      ? isActive
        ? 2
        : -0.5
      : isHovered && !rigState.isDragging
        ? 0.5
        : 0

    if (isFocusMode && !isActive) {
      wasDimmedByFocus.current = true
    }

    const combinedScale = interactionScale * filterScale.current
    const finalOpacity = interactionOpacity * targetTransitionOpacity * filterOpacity.current
    easing.damp(ref.current.scale, 'x', combinedScale, 0.15, delta)
    easing.damp(ref.current.scale, 'y', combinedScale, 0.15, delta)
    easing.damp(ref.current.scale, 'z', combinedScale, 0.15, delta)
    easing.damp(focusZ, 'current', targetFocusZ, 0.2, delta)
    easing.damp(curveZ, 'current', targetCurveZ, 0.2, delta)
    easing.damp(transitionZ, 'current', targetTransitionZ, CONFIG.transitionZDamp, delta)
    easing.damp(transitionY, 'current', targetTransitionY, CONFIG.transitionYDamp, delta)
    easing.damp(rotationX, 'current', targetRotX, 0.2, delta)
    easing.damp(rotationY, 'current', targetRotY, 0.2, delta)

    ref.current.position.set(x, y + transitionY.current, curveZ.current + focusZ.current + transitionZ.current)
    ref.current.rotation.set(rotationX.current, rotationY.current, 0)

    const isFilterTransition = !car.matchesFilter || filterOpacity.current < 0.99
    const isFocusRecovery = !isFocusMode && wasDimmedByFocus.current
    const opacityDamp = isFilterTransition || isFocusRecovery
      ? CONFIG.filterOpacityDamp
      : gridVisible
        ? CONFIG.enterOpacityDamp
        : CONFIG.exitOpacityDamp
    easing.damp(imageRef.current.material, 'opacity', finalOpacity, opacityDamp, delta)

    if (isFocusRecovery && imageRef.current.material.opacity > 0.95) {
      wasDimmedByFocus.current = false
    }

    const textOpacity = targetTransitionOpacity < 0.8 ? 0 : targetTextOpacity
    const text = titleRef.current as { fillOpacity?: number; scale?: THREE.Vector3 } | null
    if (text) {
      easing.damp(text, 'fillOpacity', textOpacity, 0.1, delta)
      const targetBreath = isActive ? 1 + Math.sin(performance.now() * 0.002) * 0.035 : 1
      text.scale?.setScalar(THREE.MathUtils.lerp(text.scale.x, targetBreath, 1 - Math.exp(-0.1 * delta * 60)))
    }
    imageRef.current.material.needsUpdate = true
  })

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (!interactive) return
    if (rigState.isDragging) {
      event.stopPropagation()
      return
    }
    event.stopPropagation()

    const focusPosition = new THREE.Vector3(basePos.x, basePos.y, 0)
    ref.current?.getWorldPosition(focusPosition)
    focusRigOnCar(index, car.id, focusPosition)
  }

  const textY = -(imageDims.height / 2) - 0.24

  return (
    <group ref={ref}>
      <mesh
        onClick={handleClick}
        onPointerOut={() => setHovered(false)}
        onPointerOver={() => setHovered(true)}
      >
        <planeGeometry args={[imageDims.width * 1.25, imageDims.height * 1.5]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh ref={imageRef}>
        <planeGeometry args={[imageDims.width, imageDims.height, 16, 16]} />
        <meshBasicMaterial
          alphaTest={0.04}
          depthWrite={false}
          map={texture}
          toneMapped={false}
          transparent
        />
      </mesh>
      {gridVisible && (
        <Text
          ref={titleRef}
          anchorX="center"
          anchorY="top"
          color="#000"
          fillOpacity={0}
          fontSize={0.1}
          maxWidth={2.8}
          position={[0, textY, 0.01]}
        >
          {car.variant ? `${car.name} ${car.variant}` : car.name}
        </Text>
      )}
    </group>
  )
}
