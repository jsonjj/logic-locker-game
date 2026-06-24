import { useLayoutEffect, useRef } from 'react'
import { Object3D, type InstancedMesh } from 'three'

/**
 * [Agent 2] A single instanced box mesh used for all repeating low-poly detail
 * (cell bars, locker drawers, monitor screens, pipes, fence pickets, light
 * strips). One draw call per visual family keeps the world cheap.
 *
 * Matrices are written once in a layout effect — no per-frame allocation and no
 * work on the render loop. Callers should memoize their `instances` array so the
 * effect only re-runs when geometry actually changes.
 */
export interface BoxInstance {
  position: [number, number, number]
  /** Defaults to [1, 1, 1]. */
  scale?: [number, number, number]
  /** Y rotation in radians, defaults to 0. */
  rotationY?: number
}

export interface InstancedBoxesProps {
  instances: BoxInstance[]
  color?: string
  emissive?: string
  emissiveIntensity?: number
  metalness?: number
  roughness?: number
  castShadow?: boolean
  receiveShadow?: boolean
}

const UNIT: [number, number, number] = [1, 1, 1]
// Module-scoped scratch object; reused while writing matrices (effects run
// sequentially, so sharing is safe and avoids allocations).
const scratch = new Object3D()

export function InstancedBoxes({
  instances,
  color = '#3a414d',
  emissive = '#000000',
  emissiveIntensity = 0,
  metalness = 0.1,
  roughness = 0.85,
  castShadow = true,
  receiveShadow = true,
}: InstancedBoxesProps) {
  const ref = useRef<InstancedMesh>(null)
  const count = instances.length

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i]
      scratch.position.set(inst.position[0], inst.position[1], inst.position[2])
      scratch.rotation.set(0, inst.rotationY ?? 0, 0)
      const s = inst.scale ?? UNIT
      scratch.scale.set(s[0], s[1], s[2])
      scratch.updateMatrix()
      mesh.setMatrixAt(i, scratch.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [instances])

  if (count === 0) return null

  return (
    <instancedMesh
      // Remount if the instance count changes (count is fixed at construction).
      key={count}
      ref={ref}
      args={[undefined, undefined, count]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
      />
    </instancedMesh>
  )
}
