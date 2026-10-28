import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePosePool, defaultPose, matchPoseByText, pickPose, assetOf,
  normalizeFacePool, pickFace,
} from '../.dsh-plugin/client/pose.mjs'

const POOL = normalizePosePool([
  { pose: 'stand', asset: 'asset-pose-stand', default: true, tags: ['你好', '早上好'] },
  { pose: 'back', asset: 'asset-pose-back', tags: ['转身', '停'] },
  { pose: 'kneel', asset: 'asset-pose-kneel', tags: ['坐'] },
  { pose: 'sleep', asset: 'asset-pose-sleep', tags: ['晚安', '睡'] },
  { pose: 'chibi', asset: 'asset-pose-chibi', tags: ['抱抱'] },
])

test('normalizePosePool：丢掉空项、补默认 pose 名、只认一个 default', () => {
  const pool = normalizePosePool([
    null,
    { asset: '' },
    { asset: ' a ', default: true },
    { asset: 'b', pose: 'sleep', default: true, tags: [' 睡 ', 3] },
  ])
  assert.equal(pool.length, 2)
  assert.deepEqual(pool[0], { pose: 'stand', asset: 'a', tags: [], default: true })
  assert.deepEqual(pool[1], { pose: 'sleep', asset: 'b', tags: ['睡'], default: false })
  assert.deepEqual(normalizePosePool(null), [])
})

test('defaultPose：显式 default 优先，其次 stand，最后第一项', () => {
  assert.equal(defaultPose(POOL).pose, 'stand')
  assert.equal(defaultPose([{ pose: 'kneel', asset: 'k', tags: [], default: false }]).pose, 'kneel')
  assert.equal(defaultPose([]), null)
})

test('matchPoseByText：长 tag 优先（「晚安」压过「睡」）', () => {
  assert.equal(matchPoseByText(POOL, '那我先晚安了').pose, 'sleep')
  assert.equal(matchPoseByText(POOL, '坐下聊会儿').pose, 'kneel')
  assert.equal(matchPoseByText(POOL, '你转身走了').pose, 'back')
  assert.equal(matchPoseByText(POOL, '今天天气不错'), null)
  assert.equal(matchPoseByText(POOL, ''), null)
})

test('pickPose：命中就切，窗口内保持，过窗回默认', () => {
  const hit = pickPose(POOL, { text: '抱抱', current: 'stand', since: 1000, now: 2000, holdMs: 5000 })
  assert.deepEqual(hit, { pose: 'chibi', asset: 'asset-pose-chibi', reason: 'text' })

  const hold = pickPose(POOL, { text: '', current: 'chibi', since: 2000, now: 4000, holdMs: 5000 })
  assert.deepEqual(hold, { pose: 'chibi', asset: 'asset-pose-chibi', reason: 'hold' })

  const rest = pickPose(POOL, { text: '', current: 'chibi', since: 2000, now: 9000, holdMs: 5000 })
  assert.deepEqual(rest, { pose: 'stand', asset: 'asset-pose-stand', reason: 'rest' })

  const init = pickPose(POOL, { text: '' })
  assert.deepEqual(init, { pose: 'stand', asset: 'asset-pose-stand', reason: 'init' })

  assert.equal(pickPose([], {}), null)
})

test('pickPose：同一姿态收到文本命中也算 hold（不重启动画）', () => {
  const same = pickPose(POOL, { text: '坐一下', current: 'kneel', since: 0, now: 100, holdMs: 5000 })
  assert.equal(same.pose, 'kneel')
  assert.equal(same.reason, 'hold')
})

test('assetOf：找不到姿态退默认素材', () => {
  assert.equal(assetOf(POOL, 'sleep'), 'asset-pose-sleep')
  assert.equal(assetOf(POOL, 'nope'), 'asset-pose-stand')
  assert.equal(assetOf([], 'stand'), null)
})

test('normalizeFacePool / pickFace', () => {
  const faces = normalizeFacePool([
    { asset: 'asset-face-happy', tags: ['开心', '好耶'] },
    { asset: 'asset-face-shy', tags: ['害羞'] },
    { asset: '' },
  ])
  assert.equal(faces.length, 2)
  assert.equal(pickFace(faces, '好耶！'), 'asset-face-happy')
  assert.equal(pickFace(faces, '有点害羞'), 'asset-face-shy')
  assert.equal(pickFace(faces, '嗯'), null)
  assert.equal(pickFace([], '开心'), null)
})
