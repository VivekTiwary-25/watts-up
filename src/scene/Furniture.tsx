// Procedural clay furniture for the rooms scene. Positions follow coord/tasks/ROOM-PLAN.md.
// Everything shares a handful of module-level geometries and materials, so the whole set is
// ~58 meshes, a few draw-call-friendly materials and no per-instance allocations.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Vec3 } from './layout'
import { BOX } from './placeholders/kit'

/* ------------------------------------------------------------------ materials */

function clay(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
}

const MAT = {
  fabric: clay('#cfc8bc', 0.95),
  cushion: clay('#ddd6ca', 0.95),
  linen: clay('#ece7de', 0.93),
  duvet: clay('#a9b1b5', 0.95),
  wood: clay('#9c8873', 0.88),
  woodDark: clay('#7b6b5c', 0.88),
  cabinet: clay('#d3cdc2', 0.9),
  counterTop: clay('#7e7973', 0.85),
  charcoal: clay('#3a3e45', 0.9),
  ceramic: clay('#efede8', 0.6),
  ceramicShade: clay('#c4c7cb', 0.7),
  mirror: new THREE.MeshStandardMaterial({ color: '#aeb8c0', roughness: 0.15, metalness: 0.6 }),
}

/* ----------------------------------------------------------------- geometries */

/** Rounded box with real dimensions (not scaled), so the corner radius stays round. */
function rounded(w: number, h: number, d: number, r: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(w, h, d, 2, r)
}

const GEO = {
  sofaBase: rounded(2.1, 0.3, 0.9, 0.06),
  sofaBack: rounded(2.1, 0.5, 0.22, 0.08),
  sofaArm: rounded(0.22, 0.55, 0.9, 0.08),
  seatCushion: rounded(0.54, 0.14, 0.64, 0.06),
  coffeeTop: rounded(1.0, 0.07, 0.56, 0.03),
  tableTop: rounded(1.2, 0.05, 0.8, 0.025),
  chairSeat: rounded(0.42, 0.05, 0.42, 0.02),
  mattress: rounded(1.52, 0.2, 1.88, 0.08),
  headboard: rounded(1.7, 0.95, 0.08, 0.035),
  duvet: rounded(1.58, 0.08, 1.32, 0.04),
  pillow: rounded(0.6, 0.12, 0.36, 0.06),
  basin: rounded(0.6, 0.16, 0.44, 0.06),
  /** Low-poly unit cylinder along y (diameter 1, height 1). */
  leg: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
}

/* ---------------------------------------------------------------------- parts */

interface PProps {
  geo: THREE.BufferGeometry
  mat: THREE.Material
  pos: Vec3
  scale?: Vec3
  rot?: Vec3
}

/** One clay mesh. Never raycastable, so furniture can't steal pointer events from appliances. */
function P({ geo, mat, pos, scale, rot }: PProps) {
  return (
    <mesh
      geometry={geo}
      material={mat}
      position={pos}
      scale={scale}
      rotation={rot}
      castShadow
      receiveShadow
      raycast={() => null}
    />
  )
}

/* --------------------------------------------------------------------- living */

/** Low media console against the z=0 wall; top at y=0.5, the TV stands on it. */
function MediaConsole() {
  // wall face z=0.075, 0.4 deep -> front face z=0.475
  return (
    <group position={[-3.0, 0, 0.275]}>
      <P geo={BOX} mat={MAT.wood} pos={[0, 0.29, 0]} scale={[1.6, 0.42, 0.4]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[0, 0.04, -0.02]} scale={[1.5, 0.08, 0.34]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[-0.27, 0.29, 0.2]} scale={[0.012, 0.34, 0.01]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[0.27, 0.29, 0.2]} scale={[0.012, 0.34, 0.01]} />
    </group>
  )
}

/** Three-seat sofa facing -z (toward the TV). */
function Sofa() {
  return (
    <group position={[-3.0, 0, 3.7]}>
      <P geo={BOX} mat={MAT.charcoal} pos={[0, 0.045, 0]} scale={[2.0, 0.09, 0.8]} />
      <P geo={GEO.sofaBase} mat={MAT.fabric} pos={[0, 0.24, 0]} />
      <P geo={GEO.sofaBack} mat={MAT.fabric} pos={[0, 0.64, 0.34]} />
      <P geo={GEO.sofaArm} mat={MAT.fabric} pos={[-0.94, 0.375, 0]} />
      <P geo={GEO.sofaArm} mat={MAT.fabric} pos={[0.94, 0.375, 0]} />
      {[-0.56, 0, 0.56].map((x) => (
        <P key={x} geo={GEO.seatCushion} mat={MAT.cushion} pos={[x, 0.46, -0.11]} />
      ))}
    </group>
  )
}

function CoffeeTable() {
  return (
    <group position={[-3.0, 0, 2.6]}>
      <P geo={GEO.coffeeTop} mat={MAT.wood} pos={[0, 0.42, 0]} />
      <P geo={BOX} mat={MAT.woodDark} pos={[0, 0.193, 0]} scale={[0.8, 0.385, 0.36]} />
    </group>
  )
}

/** Floating shelf on the west wall (top at y=1.1); the router sits on it. */
function WallShelf() {
  // wall face x=-5.925; 0.26 deep so the router fits
  return (
    <group position={[-5.795, 0, 1.2]}>
      <P geo={BOX} mat={MAT.wood} pos={[0, 1.08, 0]} scale={[0.26, 0.04, 0.7]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[-0.04, 1.0, -0.25]} scale={[0.18, 0.12, 0.03]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[-0.04, 1.0, 0.25]} scale={[0.18, 0.12, 0.03]} />
    </group>
  )
}

/* -------------------------------------------------------------------- kitchen */

interface CounterRunProps {
  z0: number
  z1: number
  /** z positions of vertical door seams on the front face. */
  seams: number[]
}

/** One counter run along the east wall: carcass, darker top, plinth, door seams. */
function CounterRun({ z0, z1, seams }: CounterRunProps) {
  const len = z1 - z0
  const zc = (z0 + z1) / 2
  // wall face x=5.925; front face x=5.42, top overhangs to 5.38
  return (
    <group>
      <P geo={BOX} mat={MAT.cabinet} pos={[5.6725, 0.47, zc]} scale={[0.505, 0.78, len]} />
      <P geo={BOX} mat={MAT.counterTop} pos={[5.6525, 0.88, zc]} scale={[0.545, 0.04, len]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[5.6975, 0.04, zc]} scale={[0.455, 0.08, len]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[5.415, 0.72, zc]} scale={[0.01, 0.012, len - 0.04]} />
      {seams.map((z) => (
        <P key={z} geo={BOX} mat={MAT.charcoal} pos={[5.415, 0.41, z]} scale={[0.01, 0.6, 0.012]} />
      ))}
    </group>
  )
}

/** Counter along the east wall, x 5.4..6.0, with a gap z 2.0..2.9 for the stove. */
function KitchenCounter() {
  return (
    <group>
      <CounterRun z0={1.3} z1={2.0} seams={[]} />
      <CounterRun z0={2.9} z1={4.7} seams={[3.5, 4.1]} />
    </group>
  )
}

/** Panel chair facing -z in its local frame: seat, full-height back slab, front support. */
function Chair({ pos, rotY }: { pos: Vec3; rotY: number }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <P geo={GEO.chairSeat} mat={MAT.wood} pos={[0, 0.45, 0]} />
      <P geo={BOX} mat={MAT.woodDark} pos={[0, 0.45, 0.19]} scale={[0.42, 0.9, 0.04]} />
      <P geo={BOX} mat={MAT.woodDark} pos={[0, 0.213, -0.17]} scale={[0.38, 0.425, 0.04]} />
    </group>
  )
}

const TABLE_LEGS: Vec3[] = [
  [-0.52, 0.355, -0.32],
  [0.52, 0.355, -0.32],
  [-0.52, 0.355, 0.32],
  [0.52, 0.355, 0.32],
]

function DiningSet() {
  return (
    <group position={[2.9, 0, 3.2]}>
      <P geo={GEO.tableTop} mat={MAT.wood} pos={[0, 0.735, 0]} />
      {TABLE_LEGS.map((p) => (
        <P key={p.join()} geo={GEO.leg} mat={MAT.woodDark} pos={p} scale={[0.06, 0.71, 0.06]} />
      ))}
      <Chair pos={[-0.3, 0, 0.6]} rotY={0} />
      <Chair pos={[0.3, 0, 0.6]} rotY={0} />
      <Chair pos={[-0.3, 0, -0.6]} rotY={Math.PI} />
      <Chair pos={[0.3, 0, -0.6]} rotY={Math.PI} />
    </group>
  )
}

/* -------------------------------------------------------------------- bedroom */

/** Bed (1.6 x 2.0) with its headboard against the back wall (z=-5). */
function Bed() {
  return (
    <group position={[-3.0, 0, -3.9]}>
      <P geo={BOX} mat={MAT.wood} pos={[0, 0.16, 0]} scale={[1.6, 0.32, 2.0]} />
      <P geo={GEO.headboard} mat={MAT.woodDark} pos={[0, 0.575, -0.985]} />
      <P geo={GEO.mattress} mat={MAT.linen} pos={[0, 0.42, 0.04]} />
      <P geo={GEO.pillow} mat={MAT.linen} pos={[-0.36, 0.58, -0.65]} rot={[-0.25, 0, 0]} />
      <P geo={GEO.pillow} mat={MAT.linen} pos={[0.36, 0.58, -0.65]} rot={[-0.25, 0, 0]} />
      <P geo={GEO.duvet} mat={MAT.duvet} pos={[0, 0.555, 0.36]} />
    </group>
  )
}

function SideTable() {
  return (
    <group position={[-1.9, 0, -4.6]}>
      <P geo={BOX} mat={MAT.wood} pos={[0, 0.24, 0]} scale={[0.45, 0.48, 0.4]} />
      <P geo={BOX} mat={MAT.woodDark} pos={[0, 0.5, 0]} scale={[0.48, 0.04, 0.42]} />
      <P geo={BOX} mat={MAT.charcoal} pos={[0, 0.36, 0.205]} scale={[0.4, 0.012, 0.01]} />
    </group>
  )
}

/* ------------------------------------------------------------------- bathroom */

/** Wall-hung basin on the back wall with a mirror above. */
function Basin() {
  // wall face z=-4.925; basin 0.44 deep -> centre z=-4.705
  return (
    <group position={[3.1, 0, -4.7]}>
      <P geo={GEO.basin} mat={MAT.ceramic} pos={[0, 0.78, -0.005]} />
      <P geo={GEO.leg} mat={MAT.ceramicShade} pos={[0, 0.851, 0.02]} scale={[0.36, 0.02, 0.28]} />
      <P geo={GEO.leg} mat={MAT.charcoal} pos={[0, 0.92, -0.16]} scale={[0.03, 0.12, 0.03]} />
      <P geo={BOX} mat={MAT.cabinet} pos={[0, 1.55, -0.21]} scale={[0.6, 0.8, 0.03]} />
      <P geo={BOX} mat={MAT.mirror} pos={[0, 1.55, -0.19]} scale={[0.52, 0.72, 0.012]} />
    </group>
  )
}

/* ----------------------------------------------------------------------- root */

/** All room furniture. Static and non-interactive; mounted once by the scene. */
export function Furniture() {
  return (
    <group name="furniture">
      <MediaConsole />
      <Sofa />
      <CoffeeTable />
      <WallShelf />
      <KitchenCounter />
      <DiningSet />
      <Bed />
      <SideTable />
      <Basin />
    </group>
  )
}
