/**
 * Engine public surface (Agent 1). Other workstreams import 3D primitives from
 * here only — never reach into individual engine files — so Agent 1 can refactor
 * internals freely as long as these exports + their contracts hold.
 */
export { default as GameCanvas } from './GameCanvas'
export { default as ThirdPersonPlayer } from './ThirdPersonPlayer'
export { default as Door } from './Door'
export { default as Waypoint } from './Waypoint'
export { Wall, Floor, Prop } from './colliders'

// Movement input bridge for the HUD's on-screen / touch joystick.
//   import { setJoyInput } from '<...>/game3d/engine'
//   setJoyInput(x /* -1..1 right */, y /* -1..1 forward */)
// (Or dispatch a window CustomEvent 'll-joy' with { detail: { x, y } }.)
export { setJoyInput, clearJoyInput, getJoyInput, startJoyEventBridge } from './input'
export type { JoyVector } from './input'
