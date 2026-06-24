import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Vector3, type Group } from 'three'
import Character from '../character/Character'
import { useGameState } from '../state/GameStateContext'
import type { ThirdPersonPlayerProps } from '../contracts'
import { getJoyInput, startJoyEventBridge } from './input'
import { prefersReducedMotion } from './prefersReducedMotion'

/**
 * Physics-driven third-person character controller (Agent 1).
 *
 * - Capsule RigidBody with locked rotations + damping (no clipping/tunneling).
 * - WASD / arrow keys + analog joystick, all RELATIVE to the camera heading.
 * - Smoothed velocity (accel/decel) so movement feels weighty, not twitchy.
 * - A follow camera that trails behind the player's heading and looks at them.
 * - Rotates the visual to face travel direction; drives Character's run anim.
 * - Publishes playerPos/playerHeading into shared game state every frame via
 *   refs (no per-frame React re-renders), and still calls onMove().
 * - Honors `frozen` and gs.paused (zeroes horizontal velocity, no input).
 */

const MOVE_SPEED = 6.6 // m/s top speed
const CAM_DISTANCE = 9
const CAM_HEIGHT = 7
const CAM_LOOK_HEIGHT = 1.2
// Fixed camera bearing so "up/W" is always the same world direction (much
// easier to control than a camera that orbits behind the player's heading).
// PI => the camera sits on the +z side looking toward -z, so "forward/W" walks
// the player toward the objective doors (which sit on the far -z wall).
const CAM_YAW = Math.PI

const keys: Record<string, boolean> = {}

export default function ThirdPersonPlayer({ spawn, frozen, onMove }: ThirdPersonPlayerProps) {
  const body = useRef<RapierRigidBody>(null)
  const rig = useRef<Group>(null)
  const heading = useRef(0)
  const camYaw = useRef(0)
  const [moving, setMoving] = useState(false)
  const movingRef = useRef(false)

  const { camera } = useThree()
  const gs = useGameState()

  // Reusable vectors — allocated once, mutated each frame.
  const forward = useRef(new Vector3())
  const right = useRef(new Vector3())
  const moveDir = useRef(new Vector3())
  const desiredVel = useRef(new Vector3())
  const camTarget = useRef(new Vector3())
  const lookTarget = useRef(new Vector3())
  const camOffset = useRef(new Vector3())

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true
    }
    const up = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const disposeJoy = startJoyEventBridge()
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      disposeJoy()
    }
  }, [])

  useFrame((_, delta) => {
    const rb = body.current
    if (!rb) return
    const blocked = frozen || gs.paused
    const reduce = prefersReducedMotion()
    // Clamp delta so tab-out / hitches can't launch the capsule.
    const dt = Math.min(delta, 1 / 30)

    // --- Gather input (camera-relative) -------------------------------------
    let inX = 0 // strafe (+right)
    let inZ = 0 // forward (+forward)
    if (!blocked) {
      if (keys['w'] || keys['arrowup']) inZ += 1
      if (keys['s'] || keys['arrowdown']) inZ -= 1
      if (keys['d'] || keys['arrowright']) inX += 1
      if (keys['a'] || keys['arrowleft']) inX -= 1
      const joy = getJoyInput()
      inX += joy.x
      inZ += joy.y
    }
    let inLen = Math.hypot(inX, inZ)
    if (inLen > 1) {
      inX /= inLen
      inZ /= inLen
      inLen = 1
    }

    // Camera forward projected onto the ground plane.
    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    if (forward.current.lengthSq() < 1e-6) forward.current.set(0, 0, -1)
    forward.current.normalize()
    // right = forward × worldUp  =>  (-forward.z, 0, forward.x)
    right.current.set(-forward.current.z, 0, forward.current.x)

    moveDir.current
      .copy(forward.current)
      .multiplyScalar(inZ)
      .addScaledVector(right.current, inX)
    const moveLen = moveDir.current.length()
    if (moveLen > 1e-4) moveDir.current.multiplyScalar(1 / moveLen)

    // --- Velocity (smoothed accel/decel) ------------------------------------
    const v = rb.linvel()
    const targetSpeed = MOVE_SPEED * Math.min(inLen, 1)
    desiredVel.current.copy(moveDir.current).multiplyScalar(targetSpeed)
    // Snappier when accelerating, slightly softer when stopping.
    const accelK = moveLen > 1e-4 ? 12 : 9
    const lerpA = 1 - Math.exp(-accelK * dt)
    const nextX = v.x + (desiredVel.current.x - v.x) * lerpA
    const nextZ = v.z + (desiredVel.current.z - v.z) * lerpA
    rb.setLinvel({ x: nextX, y: v.y, z: nextZ }, true)

    const planarSpeed = Math.hypot(nextX, nextZ)
    const isMoving = planarSpeed > 0.6 && moveLen > 1e-4

    // --- Heading / facing ---------------------------------------------------
    if (isMoving) heading.current = Math.atan2(moveDir.current.x, moveDir.current.z)
    if (rig.current) {
      if (reduce) {
        rig.current.rotation.y = heading.current
      } else {
        // Shortest-arc smoothing toward target heading.
        let diff = heading.current - rig.current.rotation.y
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        rig.current.rotation.y += diff * (1 - Math.exp(-14 * dt))
      }
    }

    // --- Follow camera (fixed bearing, just tracks the player's position) ----
    const t = rb.translation()
    camYaw.current = CAM_YAW
    camOffset.current.set(
      -Math.sin(camYaw.current) * CAM_DISTANCE,
      CAM_HEIGHT,
      -Math.cos(camYaw.current) * CAM_DISTANCE,
    )
    camTarget.current.set(t.x, t.y, t.z).add(camOffset.current)
    const camA = reduce ? 1 : 1 - Math.exp(-6 * dt)
    camera.position.lerp(camTarget.current, camA)
    lookTarget.current.set(t.x, t.y + CAM_LOOK_HEIGHT, t.z)
    camera.lookAt(lookTarget.current)

    // --- Animation flag (state only flips on threshold crossing) ------------
    if (isMoving !== movingRef.current) {
      movingRef.current = isMoving
      setMoving(isMoving)
    }

    // --- Publish to shared state (refs → no re-render) -----------------------
    gs.playerPos.current = { x: t.x, y: t.y, z: t.z }
    gs.playerHeading.current = heading.current
    onMove?.(gs.playerPos.current, heading.current)
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[spawn.x, spawn.y, spawn.z]}
      enabledRotations={[false, false, false]}
      mass={1}
      linearDamping={0.5}
      angularDamping={1}
      ccd
    >
      {/* Capsule: args = [halfHeight, radius]; total height ~1.8m. */}
      <CapsuleCollider args={[0.5, 0.4]} friction={0.2} />
      {/* Offset the model down so its feet (local y=0) meet the capsule base
          (capsule center - halfHeight - radius = -0.9). */}
      <group ref={rig} position={[0, -0.9, 0]}>
        <Character moving={moving} />
      </group>
    </RigidBody>
  )
}
