import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeSlotOf, normalizeBgPool, matchByText, slotOf, pickBackground, candidatesOf, pickInSlot } from '../.dsh-plugin/client/bg.mjs'

const POOL = normalizeBgPool([
  { asset: 'a-dawn', slot: 'dawn', tags: ['清晨'] },
  { asset: 'a-day', slot: 'day', tags: ['白天'] },
  { asset: 'a-dusk', slot: 'dusk', tags: ['黄昏', '夕阳'] },
  { asset: 'a-night', slot: 'night', tags: ['夜', '星空'] },
  { asset: 'a-rain', slot: 'rain', tags: ['下雨'] },
  { asset: 'a-any', slot: 'any', tags: [] },
])

test('timeSlotOf 覆盖四个时段', () => {
  assert.equal(timeSlotOf(5), 'dawn')
  assert.equal(timeSlotOf(7), 'dawn')
  assert.equal(timeSlotOf(8), 'day')
  assert.equal(timeSlotOf(16), 'day')
  assert.equal(timeSlotOf(17), 'dusk')
  assert.equal(timeSlotOf(19), 'dusk')
  assert.equal(timeSlotOf(20), 'night')
  assert.equal(timeSlotOf(23), 'night')
  assert.equal(timeSlotOf(4), 'night')
  assert.equal(timeSlotOf(25), 'night')
})

test('normalizeBgPool 丢掉坏项并归一化 slot/tags', () => {
  const out = normalizeBgPool([
    null,
    'x',
    { asset: '  ' },
    { asset: ' a ', slot: 'nope', tags: [' t ', '', 5] },
    { asset: 'b', tags: 'not-array' },
  ])
  assert.deepEqual(out, [
    { asset: 'a', slot: 'any', tags: ['t'] },
    { asset: 'b', slot: 'any', tags: [] },
  ])
  assert.deepEqual(normalizeBgPool(undefined), [])
})

test('matchByText 取最长命中标签', () => {
  assert.equal(matchByText(POOL, '这里是夜市的黑夜').asset, 'a-night')
  assert.equal(matchByText(POOL, '外面下雨了').asset, 'a-rain')
  assert.equal(matchByText(POOL, '很平常的一句话'), null)
  assert.equal(matchByText(POOL, ''), null)
})

test('slotOf 找不到时退回 any', () => {
  assert.equal(slotOf(POOL, 'dawn').asset, 'a-dawn')
  const noDawn = normalizeBgPool([{ asset: 'z', slot: 'any' }])
  assert.equal(slotOf(noDawn, 'dawn').asset, 'z')
  assert.equal(slotOf([], 'dawn'), null)
})

test('pickBackground: 关键词优先，并放行冷却', () => {
  const hit = pickBackground(POOL, {
    text: '窗外的夕阳落下来了',
    hour: 9,
    current: 'a-day',
    now: 1000,
    lastSwitchAt: 999,
    minDwellMs: 60000,
  })
  assert.deepEqual(hit, { asset: 'a-dusk', reason: 'text' })
})

test('pickBackground: 等待作答时画面保持不动', () => {
  const hold = pickBackground(POOL, { hour: 9, current: 'a-day', waiting: true })
  assert.deepEqual(hold, { asset: 'a-day', reason: 'hold' })
  const cold = pickBackground(POOL, { hour: 9, current: null, waiting: true })
  assert.deepEqual(cold, { asset: 'a-dawn', reason: 'init' })
})

test('pickBackground: 出错切阴雨', () => {
  const hit = pickBackground(POOL, { hour: 9, current: 'a-day', error: true })
  assert.deepEqual(hit, { asset: 'a-rain', reason: 'error' })
})

test('pickBackground: 冷却期内按钟点也不换', () => {
  const stay = pickBackground(POOL, { hour: 20, current: 'a-day', now: 1000, lastSwitchAt: 900, minDwellMs: 45000 })
  assert.deepEqual(stay, { asset: 'a-day', reason: 'cooldown' })
})

test('pickBackground: 冷却结束后按时段切换', () => {
  const hit = pickBackground(POOL, { hour: 20, current: 'a-day', now: 90000, lastSwitchAt: 0, minDwellMs: 45000 })
  assert.deepEqual(hit, { asset: 'a-night', reason: 'time:night' })
})

test('pickBackground: 段落没有图时退回 any，再退回池首项', () => {
  const sparse = normalizeBgPool([{ asset: 'only-any', slot: 'any' }, { asset: 'rain', slot: 'rain' }])
  assert.deepEqual(pickBackground(sparse, { hour: 12, current: 'x' }), { asset: 'only-any', reason: 'time:day' })
})

test('pickBackground: 空池返回 null', () => {
  assert.equal(pickBackground([], { hour: 12 }), null)
  assert.equal(pickBackground(null, {}), null)
})

test('pickInSlot 同槽多张时轮换且不重复当前', () => {
  const pool = normalizeBgPool([
    { asset: 'd1', slot: 'day', tags: [] },
    { asset: 'd2', slot: 'day', tags: [] },
    { asset: 'd3', slot: 'day', tags: [] },
  ])
  assert.equal(candidatesOf(pool, 'day').length, 3)
  const a = pickInSlot(pool, 'day', null, 0, 45000)
  const b = pickInSlot(pool, 'day', a.asset, 45000, 45000)
  assert.notEqual(a.asset, b.asset)
  // 槽里没有 day 时退 'any'
  const sparse = normalizeBgPool([{ asset: 'x-any', slot: 'any', tags: [] }])
  assert.equal(pickInSlot(sparse, 'day', null, 0, 45000).asset, 'x-any')
  assert.equal(pickInSlot(normalizeBgPool([]), 'day', null, 0, 45000), null)
})
