import { Plane } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type TopologyBackgroundProps = {
  color: string
  isZoomedIn: boolean
  lineThickness: number
  opacity: number
  scale: number
  speed: number
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec2 uResolution;
  uniform float uOpacity;
  uniform float uLineOpacity;
  uniform float uScale;
  uniform float uLineThickness;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 noiseUv = vUv;
    noiseUv.x *= aspect;
    vec2 centeredUv = vUv - 0.5;
    centeredUv.x *= aspect;
    float mask = 1.0 - smoothstep(0.59, 0.61, length(centeredUv));
    float n = noise(noiseUv * uScale + uTime * 0.05);
    n += noise(noiseUv * uScale * 1.8 - uTime * 0.03) * 0.45;
    float lines = fract(n * 6.0);
    float pattern = smoothstep(0.5 - uLineThickness, 0.5, lines) - smoothstep(0.5, 0.5 + uLineThickness, lines);
    float grain = (fract(sin(dot(vUv, vec2(12.9898, 78.233) * 2.0)) * 43758.5453) - 0.5) * 0.12;
    gl_FragColor = vec4(uColor + grain, pattern * uLineOpacity * mask * uOpacity);
  }
`

export function TopologyBackground({
  color,
  isZoomedIn,
  lineThickness,
  opacity,
  scale,
  speed,
}: TopologyBackgroundProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uLineOpacity: { value: opacity },
      uLineThickness: { value: lineThickness },
      uOpacity: { value: 1 },
      uResolution: { value: new THREE.Vector2(90, 40) },
      uScale: { value: scale },
      uTime: { value: 0 },
    }),
    [color, lineThickness, opacity, scale],
  )

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return

    material.uniforms.uTime.value += delta * (speed / 0.05)
    material.uniforms.uColor.value.set(color)
    material.uniforms.uLineOpacity.value = opacity
    material.uniforms.uScale.value = scale
    material.uniforms.uLineThickness.value = lineThickness
    easing.damp(material.uniforms.uOpacity, 'value', isZoomedIn ? 0.25 : 1, 0.3, delta)
  })

  return (
    <Plane args={[90, 40]} position={[0, 0, -15]} renderOrder={-1}>
      <shaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        ref={materialRef}
        transparent
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </Plane>
  )
}
