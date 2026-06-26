/* eslint-disable react-hooks/set-state-in-effect */
import { Canvas, useFrame } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { CONFIG, DEFAULT_CONFIG } from './gridConfig'
import { calculateGridDimensions, resetRigView, rigState } from './gridState'
import { GridCanvas } from './GridCanvas'
import { Rig } from './Rig'
import { TopologyBackground } from '../ui/TopologyBackground'
import type { CategoryFilter, DiecastCar } from '../../types/car'

type CarGridProps = {
  activeCategory: CategoryFilter
  cars: DiecastCar[]
}

type GridLayer = {
  id: string
  cars: DiecastCar[]
  mode: 'enter' | 'exit'
  startTime: number
  filter: CategoryFilter
}

function ConfigBridge() {
  const controls = useControls('Shoe Grid', {
    Curvature: { value: DEFAULT_CONFIG.curvatureStrength, min: 0, max: 0.12, step: 0.005 },
    'Rotation Spread': { value: DEFAULT_CONFIG.rotationStrength, min: 0, max: 0.4, step: 0.01 },
    'Focus Scale': { value: DEFAULT_CONFIG.focusScale, min: 1, max: 2, step: 0.05 },
    'Dim Scale': { value: DEFAULT_CONFIG.dimScale, min: 0.1, max: 1, step: 0.05 },
    'Dim Opacity': { value: DEFAULT_CONFIG.dimOpacity, min: 0, max: 1, step: 0.05 },
    'Drag Speed': { value: DEFAULT_CONFIG.dragSpeed, min: 0.5, max: 5, step: 0.1 },
    'Damp Factor': { value: DEFAULT_CONFIG.dampFactor, min: 0.02, max: 0.5, step: 0.01 },
    'Tilt Factor': { value: DEFAULT_CONFIG.tiltFactor, min: 0, max: 0.2, step: 0.01 },
    'Zoom In': { value: DEFAULT_CONFIG.zoomIn, min: 6, max: 20, step: 0.5 },
    'Focus Zoom': { value: DEFAULT_CONFIG.focusZoom, min: 6, max: 16, step: 0.5 },
    'Min Zoom': { value: DEFAULT_CONFIG.minZoom, min: 4.5, max: 10, step: 0.25 },
    'Zoom Damp': { value: DEFAULT_CONFIG.zoomDamp, min: 0.05, max: 0.6, step: 0.01 },
    'Zoom Out': { value: DEFAULT_CONFIG.zoomOut, min: 18, max: 50, step: 1 },
  })

  useFrame(() => {
    CONFIG.curvatureStrength = controls.Curvature
    CONFIG.rotationStrength = controls['Rotation Spread']
    CONFIG.focusScale = controls['Focus Scale']
    CONFIG.dimScale = controls['Dim Scale']
    CONFIG.dimOpacity = controls['Dim Opacity']
    CONFIG.dragSpeed = controls['Drag Speed']
    CONFIG.dampFactor = controls['Damp Factor']
    CONFIG.tiltFactor = controls['Tilt Factor']
    CONFIG.zoomIn = controls['Zoom In']
    CONFIG.focusZoom = controls['Focus Zoom']
    CONFIG.minZoom = controls['Min Zoom']
    CONFIG.zoomDamp = controls['Zoom Damp']
    CONFIG.zoomOut = controls['Zoom Out']
  })

  return null
}

export function CarGrid({ activeCategory, cars }: CarGridProps) {
  const [layers, setLayers] = useState<GridLayer[]>(() => [
    {
      id: 'init',
      cars,
      mode: 'enter',
      startTime: Date.now(),
      filter: activeCategory,
    },
  ])

  useEffect(() => {
    const now = Date.now()
    setLayers((current) => [
      ...current.map((layer) => layer.mode === 'enter' ? { ...layer, mode: 'exit' as const, startTime: now } : layer),
      { id: `${activeCategory}-${now}`, cars, mode: 'enter', startTime: now, filter: activeCategory },
    ])
    resetRigView()

    const cleanup = window.setTimeout(() => {
      setLayers((current) => current.filter((layer) => layer.mode === 'enter'))
    }, CONFIG.cleanupTimeout)

    return () => window.clearTimeout(cleanup)
  }, [activeCategory, cars])

  const activeDims = useMemo(() => calculateGridDimensions(cars.length), [cars.length])
  const isZoomedIn = rigState.currentDistance <= CONFIG.zoomIn + 0.5

  return (
    <section
      className="canvas-shell"
      data-car-count={cars.length}
      id="vault"
      aria-label="3D die-cast car product grid"
    >
      <Leva collapsed hidden />
      <Canvas
        camera={{ position: [0, 0, DEFAULT_CONFIG.zoomOut], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <ConfigBridge />
        <Rig gridH={activeDims.height} gridW={activeDims.width} />
        <TopologyBackground
          color={CONFIG.bgColor}
          isZoomedIn={isZoomedIn}
          lineThickness={CONFIG.bgLineThickness}
          onBackgroundClick={() => {
            if (rigState.activeId !== null && !rigState.lastPointerWasDrag) {
              resetRigView()
            }
          }}
          opacity={CONFIG.bgOpacity}
          scale={CONFIG.bgScale}
          speed={CONFIG.bgSpeed}
        />
        <fog attach="fog" args={['#f0f0f0', CONFIG.fogNear, CONFIG.fogFar]} />
        <Suspense fallback={null}>
          {layers.map((layer) => (
            <GridCanvas
              cars={layer.cars}
              filter={layer.filter}
              gridVisible={layer.mode === 'enter'}
              interactive={layer.mode === 'enter'}
              key={layer.id}
              transitionStartTime={layer.startTime}
            />
          ))}
        </Suspense>
      </Canvas>
    </section>
  )
}
