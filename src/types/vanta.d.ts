declare module 'vanta/dist/vanta.clouds.min' {
  type VantaCloudsOptions = {
    THREE: typeof import('three')
    el: HTMLElement
    mouseControls?: boolean
    touchControls?: boolean
    gyroControls?: boolean
    minHeight?: number
    minWidth?: number
    scale?: number
    scaleMobile?: number
    speed?: number
    mouseEase?: boolean
    backgroundColor?: number
    skyColor?: number
    cloudColor?: number
    cloudShadowColor?: number
    sunColor?: number
    sunGlareColor?: number
    sunlightColor?: number
  }

  type VantaEffect = {
    destroy: () => void
  }

  export default function CLOUDS(options: VantaCloudsOptions): VantaEffect
}
