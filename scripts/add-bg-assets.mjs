import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const scenePath = path.join(WS, 'gal-scene.json')
const bgDir = path.join(WS, '.tmpbg')

const entries = [
  ['asset-bg-dawn', 'bg-dawn.webp', 'bg-dawn', 'dawn', ['清晨', '黎明', '早上', '晨光', '破晓']],
  ['asset-bg-day', 'bg-day.webp', 'bg-day', 'day', ['白天', '中午', '正午', '阳光', '晴朗']],
  ['asset-bg-dusk', 'bg-dusk.webp', 'bg-dusk', 'dusk', ['黄昏', '傍晚', '夕阳', '落日', '晚霞']],
  ['asset-bg-night', 'bg-night.webp', 'bg-night', 'night', ['夜', '晚上', '深夜', '月亮', '月光', '星空']],
  ['asset-bg-rain', 'bg-rain.webp', 'bg-rain', 'rain', ['雨', '下雨', '阴天', '潮湿', '雷声']],
]

const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'))
scene.assets = scene.assets ?? {}
const now = Date.now()

const pool = []
for (const [id, file, name, slot, tags] of entries) {
  const buf = fs.readFileSync(path.join(bgDir, file))
  scene.assets[id] = {
    id,
    name,
    mime: 'image/webp',
    dataUrl: 'data:image/webp;base64,' + buf.toString('base64'),
    width: 1920,
    height: 1080,
    createdAt: now,
  }
  pool.push({ asset: id, slot, tags })
  console.log('asset', id, Math.round(buf.length / 1024) + 'KB')
}
// 原有那张底画留作 any 兜底（关掉/缺图时不至于黑屏）。
if (scene.assets['asset-anima-bg'] !== undefined) pool.push({ asset: 'asset-anima-bg', slot: 'any', tags: [] })

scene.settings = scene.settings ?? {}
scene.settings.bgPool = pool
scene.settings.bgDwellSec = 45

fs.writeFileSync(scenePath, JSON.stringify(scene, null, 2), 'utf8')
console.log('gal-scene.json', Math.round(fs.statSync(scenePath).size / 1024) + 'KB, bgPool', pool.length, '项')
