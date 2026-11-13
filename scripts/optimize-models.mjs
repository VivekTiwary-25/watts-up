import { spawnSync } from 'node:child_process'
import { readdir, mkdir, copyFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const raw = path.join(root, 'public/models/raw')
const output = path.join(root, 'public/models')
await mkdir(output, { recursive: true })
let beforeTotal = 0
let afterTotal = 0
const files = await readdir(raw).catch(() => [])

for (const name of files.filter((file) => /\.glb$/i.test(file))) {
  const input = path.join(raw, name)
  const target = path.join(output, name)
  beforeTotal += (await stat(input)).size
  const result = spawnSync('npx', [
    '-y', '@gltf-transform/cli@4', 'optimize', input, target,
    '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024',
    '--simplify', 'false', '--join', 'false', '--flatten', 'false',
  ], { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) throw new Error(`Optimization failed for ${name}`)
  const before = (await stat(input)).size
  const after = (await stat(target)).size
  afterTotal += after
  console.log(`${name}: ${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB`)
}

for (const name of files.filter((file) => /\.hdr$/i.test(file))) {
  const input = path.join(raw, name)
  const target = path.join(output, name)
  await copyFile(input, target)
  const size = (await stat(input)).size
  if (size > 3e6) console.warn(`${name} is ${(size / 1e6).toFixed(2)} MB; resize it to reduce load time.`)
}

console.log(`GLB total: ${(beforeTotal / 1e6).toFixed(2)} MB -> ${(afterTotal / 1e6).toFixed(2)} MB`)
