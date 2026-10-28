/**
 * 把 art/incoming/ 里生成的背景图接进 gal-scene.json：
 *   裁成 1920x1080(cover) → webp → 写 assets → 注册 settings.bgPool（slot + tags）。
 *
 * 用法：node scripts/ingest-bg.mjs [--dry]
 *
 * 文件名决定「场景槽」；认不出的按顺序补进队列，slot 用 any。
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const incoming = path.join(root, 'art', 'incoming')
const outDir = path.join(root, 'art', 'out')
const scenePath = path.join(root, 'gal-scene.json')

// Python：优先 $GAL_PY，其次 DSH 自带运行时，最后退回 PATH 里的 python
const PY = process.env.GAL_PY || (() => {
  const bundled = path.join(os.homedir(), '.dsh', 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', process.platform === 'win32' ? 'python.exe' : 'bin/python3')
  return fs.existsSync(bundled) ? bundled : 'python'
})()

/** 文件名关键字 → { id, name, slot, tags } */
const RECIPES = [
  { match: /bedroom|卧室|床/, id: 'bedroom', name: '背景 · 清晨卧室', slot: 'dawn', tags: ['卧室', '房间', '床', '起床', '早上好', '宿舍'] },
  { match: /corridor|走廊|hall/i, id: 'corridor', name: '背景 · 宿舍走廊', slot: 'day', tags: ['走廊', '过道', '出门', '上课'] },
  { match: /dining|canteen|食堂|餐厅/, id: 'dining', name: '背景 · 学校食堂', slot: 'day', tags: ['食堂', '餐厅', '吃饭', '午饭', '晚饭', '午饭时间'] },
  { match: /library|图书/, id: 'library', name: '背景 · 图书室', slot: 'day', tags: ['图书室', '图书馆', '看书', '书'] },
  { match: /courtyard|庭院|中庭|garden/i, id: 'courtyard', name: '背景 · 校舍中庭', slot: 'day', tags: ['中庭', '庭院', '院子', '操场', '校园'] },
  { match: /bridge|桥/, id: 'bridge', name: '背景 · 傍晚石桥', slot: 'dusk', tags: ['桥', '石桥', '河岸', '河边', '傍晚', '黄昏'] },
  { match: /market|夜市|商店/, id: 'market', name: '背景 · 夜市商店街', slot: 'night', tags: ['夜市', '商店街', '街', '灯会', '晚上出去'] },
  { match: /rain|雨/, id: 'rainroom', name: '背景 · 雨天窗边', slot: 'rain', tags: ['雨', '下雨', '雨天', '潮湿'] },
  { match: /night|夜/, id: 'night', name: '背景 · 夜色', slot: 'night', tags: ['夜', '晚上', '深夜', '星空'] },
  { match: /sea|海/, id: 'sea', name: '背景 · 海边', slot: 'day', tags: ['海', '海边', '沙滩', '海风'] },
]

const dry = process.argv.includes('--dry')
if (!fs.existsSync(incoming)) {
  console.log('[ingest] 没有 art/incoming/')
  process.exit(0)
}
fs.mkdirSync(outDir, { recursive: true })

const files = fs
  .readdirSync(incoming)
  .filter(name => /\.(png|jpe?g|webp)$/i.test(name))
  .sort()

if (files.length === 0) {
  console.log('[ingest] art/incoming/ 是空的')
  process.exit(0)
}

const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'))
scene.assets = scene.assets ?? {}
scene.settings = scene.settings ?? {}
const pool = Array.isArray(scene.settings.bgPool) ? scene.settings.bgPool : []
const used = new Set(pool.map(entry => entry.asset))

let added = 0
files.forEach((file, index) => {
  const base = path.basename(file, path.extname(file))
  const recipe =
    RECIPES.find(r => r.match.test(base)) ??
    { id: 'scene' + (index + 1), name: '背景 · ' + base, slot: 'any', tags: [] }
  const assetId = 'asset-art-' + recipe.id
  const outFile = path.join(outDir, recipe.id + '.webp')
  if (!dry) {
    execFileSync(PY, [path.join(here, 'fit-bg.py'), path.join(incoming, file), outFile], { stdio: 'inherit' })
  }
  const buf = dry ? Buffer.alloc(0) : fs.readFileSync(outFile)
  const dataUrl = 'data:image/webp;base64,' + buf.toString('base64')
  scene.assets[assetId] = {
    id: assetId,
    name: recipe.id,
    mime: 'image/webp',
    dataUrl,
    width: 1920,
    height: 1080,
    createdAt: Date.now(),
  }
  const existing = pool.find(entry => entry.asset === assetId)
  if (existing) {
    existing.slot = recipe.slot
    existing.tags = recipe.tags
  } else {
    pool.push({ asset: assetId, slot: recipe.slot, tags: recipe.tags })
  }
  used.add(assetId)
  added += 1
  console.log('[ingest]', file, '→', assetId, '(' + recipe.slot + ',', recipe.tags.length, 'tags)', buf.length, 'bytes')
})

scene.settings.bgPool = pool
if (!dry) {
  fs.writeFileSync(scenePath, JSON.stringify(scene))
  console.log('[ingest] 写入 gal-scene.json，bgPool', pool.length, '项，新增/更新', added)
} else {
  console.log('[ingest][dry] 将处理', added, '张')
}
