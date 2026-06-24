import { Floor, Wall } from '../game3d/engine'
import { ARENA_HALF } from './arena'

/** The enclosed combat arena: a lit floor ringed by four walls. */
export default function ArenaEnvironment() {
  const H = ARENA_HALF
  const wallH = 5
  const t = 1
  return (
    <>
      <Floor position={[0, -0.05, 0]} size={[H * 2, H * 2]} theme="yard" />
      {/* Perimeter walls. */}
      <Wall position={[0, wallH / 2, -H]} size={[H * 2, wallH, t]} />
      <Wall position={[0, wallH / 2, H]} size={[H * 2, wallH, t]} />
      <Wall position={[-H, wallH / 2, 0]} size={[t, wallH, H * 2]} />
      <Wall position={[H, wallH / 2, 0]} size={[t, wallH, H * 2]} />
      {/* A little cover in the middle for flavor + sightline breaks. */}
      <Wall position={[0, 1, 0]} size={[6, 2, 1]} color="#39414d" />
      <Wall position={[-9, 1, -6]} size={[1, 2, 6]} color="#39414d" />
      <Wall position={[9, 1, 6]} size={[1, 2, 6]} color="#39414d" />
    </>
  )
}
