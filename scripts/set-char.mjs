/**
 * 把一张 PNG 立绘写进 gal-scene.json 的 asset-anima-sprite，并可选地重设角色元素几何。
 *
 * 用法：
 *   node scripts/set-char.mjs <立绘.png> [--box x,y,w,h] [--scale 2] [--name 名字]
 *
 * - 先按 --scale（默认 2）用 Lanczos 放大，避免 520px 宽的位置上被浏览器糊化；
 * - 存成带 alpha 的 WebP（q92 method 6），内联成 dataUrl；
 * - 只改 assets['asset-anima-sprite']，其它素材不动。
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const scenePath = path.join(root, 'gal-scene.json')

// Python：优先 $GAL_PY，其次 DSH 自带运行时，最后退回 PATH 里的 python
const PY = process.env.GAL_PY || (() => {
  const bundled = path.join(os.homedir(), '.dsh', 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', process.platform === 'win32' ? 'python.exe' : 'bin/python3')
  return fs.existsSync(bundled) ? bundled : 'python'
})()

const argv = process.argv.slice(2)
const src = argv.find(a => !a.startsWith('--'))
if (!src) {
  console.error('usage: node scripts/set-char.mjs <立绘.png> [--box x,y,w,h] [--scale 2] [--name 名字]')
  process.exit(1)
}
const flag = (name, fallback = null) => {
  const i = argv.indexOf('--' + name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const scale = Number(flag('scale', '2'))
const label = flag('name', '立绘 · 鲸鱼娘')
const boxArg = flag('box', '')

const tmpOut = path.join(root, '.tmpbuild', 'char-sprite.webp')
fs.mkdirSync(path.dirname(tmpOut), { recursive: true })
execFileSync(PY, ['-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA')
w, h = im.size
s = float(sys.argv[3])
if s != 1:
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
im.save(sys.argv[2], 'WEBP', quality=92, method=6)
print(im.size)
`, src, tmpOut, String(scale)], { stdio: 'inherit' })

const buf = fs.readFileSync(tmpOut)
const dims = execFileSync(PY, ['-c', `
from PIL import Image; import sys
im = Image.open(sys.argv[1]); print(im.size[0], im.size[1])
`, tmpOut]).toString().trim().split(/\s+/).map(Number)

const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'))
scene.assets = scene.assets ?? {}
const prev = scene.assets['asset-anima-sprite'] ?? {}
scene.assets['asset-anima-sprite'] = {
  ...prev,
  id: 'asset-anima-sprite',
  name: label,
  mime: 'image/webp',
  dataUrl: 'data:image/webp;base64,' + buf.toString('base64'),
  width: dims[0],
  height: dims[1],
  createdAt: Date.now(),
}

if (boxArg) {
  const [x, y, w, h] = boxArg.split(',').map(Number)
  const el = (scene.elements ?? []).find(e => e.type === 'character')
  if (!el) {
    console.error('[char] 场景里没有 character 元素')
    process.exit(1)
  }
  el.x = x
  el.y = y
  el.w = w
  el.h = h
  console.log('[char] 元素', el.id, '→', x, y, w, h)
}

fs.writeFileSync(scenePath, JSON.stringify(scene))
console.log('[char] 写入 asset-anima-sprite', dims[0] + 'x' + dims[1], Math.round(buf.length / 1024) + 'KB')
