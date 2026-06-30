import { useEffect, useRef } from 'react'
import cloudsModule from 'vanta/dist/vanta.clouds.min'
import * as THREE from 'three'

type VantaEffect = {
  destroy: () => void
}

type CloudsFactory = (options: Parameters<typeof cloudsModule>[0]) => VantaEffect

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function VantaCloudsBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaEffect | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || effectRef.current || prefersReducedMotion()) {
      container?.classList.add('is-fallback')
      return
    }

    try {
      container.classList.remove('is-fallback')
      const createClouds = (typeof cloudsModule === 'function'
        ? cloudsModule
        : (cloudsModule as { default: CloudsFactory }).default) as CloudsFactory

      effectRef.current = createClouds({
        THREE,
        el: container,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 3,
        scaleMobile: 8,
        speed: 1.35,
        mouseEase: true,
        backgroundColor: 0xffffff,
        skyColor: 0x68b8d7,
        cloudColor: 0xadc1de,
        cloudShadowColor: 0x183550,
        sunColor: 0xff9919,
        sunGlareColor: 0xff6633,
        sunlightColor: 0xff9933,
      }) as VantaEffect
    } catch (error) {
      container.classList.add('is-fallback')
      if (import.meta.env.DEV) {
        container.dataset.vantaError = error instanceof Error ? error.message : String(error)
      }
      if (import.meta.env.DEV) {
        console.warn('Vanta Clouds failed to initialize', error)
      }
    }

    return () => {
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="vanta-clouds-background"
      ref={containerRef}
    />
  )
}
