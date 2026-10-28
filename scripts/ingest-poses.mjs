/**
 * 把 art/poses/ 里的姿态图 / 表情头像接进 gal-scene.json：
 *   assets['asset-pose-<name>'] + settings.posePool（关键词 → 姿态）+ settings.facePool（关键词 → 表情）
 *
 * 用法：node scripts/ingest-poses.mjs [--dry]
 *
 * 素材由 scripts/set-poses.py 生成（统一 900x1500 画布，底部对齐），
 * 这样切姿态时人物大小不跳，只有形状变化。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const poseDir = path.join(root, 'art', 'poses')
const scenePath = path.join(root, 'gal-scene.json')

/** 姿态：顺序即优先级（长 tag 优先匹配在 pickPose 里处理） */
const POSES = [
  {
    pose: 'stand',
    file: 'stand.webp',
    default: true,
    tags: ['站', '你好', '早上好', '晚上好', '欢迎', '打招呼'],
  },
  {
    pose: 'back',
    file: 'back.webp',
    tags: ['转身', '回头', '背影', '再见', '拜拜', '走了', '离开', '出门'],
  },
  {
    pose: 'kneel',
    file: 'kneel.webp',
    tags: ['坐', '坐下', '跪坐', '休息', '歇', '蹲'],
  },
  {
    pose: 'curl',
    file: 'curl.webp',
    tags: ['抱膝', '膝', '发呆', '委屈', '不想动', '蜷', '冷'],
  },
  {
    pose: 'sleep',
    file: 'sleep.webp',
    tags: ['睡', '睡觉', '晚安', '困', '躺', '疲倦', '做个好梦'],
  },
  {
    pose: 'chibi',
    file: 'chibi.webp',
    tags: ['抱抱', '抱一下', '抱紧', '抱鲸鱼', '贴贴', '亲亲'],
  },
]

/** 表情头像：短气泡，只认情绪词 */
const FACES = [
  { file: 'face_smile.webp', tags: ['笑', '微笑', '温柔', '喜欢', '好呀', '嗯嗯'] },
  { file: 'face_shy.webp', tags: ['害羞', '脸红', '不好意思', '羞', '谢谢'] },
  { file: 'face_wink.webp', tags: ['眨眼', '眨眼间', '嘿', '耶', '?!', '惊喜'] },
  { file: 'face_surprise.webp', tags: ['惊讶', '诶', '欸', '！', '居然', '真的吗'] },
  { file: 'face_sleepy.webp', tags: ['困', '打哈欠', ' sleepy', '好困', '睡意'] },
  { file: 'face_happy.webp', tags: ['开心', '高兴', '快乐', '好耶', '太好了', '万岁'] },
]

const dry = process.argv.includes('--dry')
if (!fs.existsSync(poseDir)) {
  console.log('[poses] 没有 art/poses/，先跑 scripts/set-poses.py')
  process.exit(0)
}

const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'))
scene.assets = scene.assets ?? {}
scene.settings = scene.settings ?? {}

const read = file => {
  const p = path.join(poseDir, file)
  if (!fs.existsSync(p)) return null
  return fs.readFileSync(p)
}

const put = (assetId, name, buf) => {
  scene.assets[assetId] = {
    id: assetId,
    name,
    mime: 'image/webp',
    dataUrl: 'data:image/webp;base64,' + buf.toString('base64'),
    width: 900,
    height: 1500,
    createdAt: Date.now(),
  }
}

const posePool = []
for (const item of POSES) {
  const buf = read(item.file)
  if (buf === null) {
    console.log('[poses] 缺文件', item.file)
    continue
  }
  const assetId = 'asset-pose-' + item.pose
  if (!dry) put(assetId, '立绘 · ' + item.pose, buf)
  posePool.push({
    pose: item.pose,
    asset: assetId,
    tags: item.tags,
    ...(item.default === true ? { default: true } : {}),
  })
  console.log('[poses]', item.file, '→', assetId, (buf.length / 1024).toFixed(0) + 'KB', item.tags.length, 'tags')
}

const facePool = []
for (const item of FACES) {
  const buf = read(item.file)
  if (buf === null) {
    console.log('[faces] 缺文件', item.file)
    continue
  }
  const assetId = 'asset-face-' + path.basename(item.file, '.webp').replace(/^face_/, '')
  if (!dry) put(assetId, '表情 · ' + path.basename(item.file, '.webp'), buf)
  facePool.push({ asset: assetId, tags: item.tags })
  console.log('[faces]', item.file, '→', assetId, (buf.length / 1024).toFixed(0) + 'KB')
}

scene.settings.posePool = posePool
scene.settings.facePool = facePool
scene.settings.poseHoldMs = 14000
scene.settings.faceHoldMs = 6000

// 角色元素指向默认姿态；旧的单张立绘素材不再需要（省 ~0.6MB）
const char = (scene.elements ?? []).find(el => el.type === 'character')
if (char !== undefined && char !== null) {
  char.image = 'asset-pose-stand'
}
if (scene.assets['asset-anima-sprite'] !== undefined) {
  delete scene.assets['asset-anima-sprite']
  console.log('[poses] 已移除旧的 asset-anima-sprite')
}

if (!dry) {
  fs.writeFileSync(scenePath, JSON.stringify(scene))
  console.log('[poses] 写入 gal-scene.json：posePool', posePool.length, '项 / facePool', facePool.length, '项，文件',
    (fs.statSync(scenePath).size / 1048576).toFixed(2), 'MB')
} else {
  console.log('[poses][dry] 姿态', posePool.length, '表情', facePool.length)
}
