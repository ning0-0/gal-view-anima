import test from 'node:test'
import assert from 'node:assert/strict'
import { sceneStamp, presetOverridesSaved } from '../.dsh-plugin/client/preset.mjs'

const scene = (over = {}) => ({
  version: 1,
  settings: { bgPool: [{ asset: 'asset-art-bedroom', slot: 'dawn', tags: ['卧室'] }] },
  elements: [{ id: 'dialogue', type: 'dialogue', x: 340, y: 792, w: 1240, h: 288 }],
  assets: { 'asset-art-bedroom': { id: 'asset-art-bedroom', width: 1920, height: 1080, dataUrl: 'data:image/webp;base64,AAAA' } },
  ...over,
})

test('sceneStamp: 同一份场景戳稳定', () => {
  assert.equal(sceneStamp(scene()), sceneStamp(scene()))
})

test('sceneStamp: 换背景素材名就换戳', () => {
  const a = sceneStamp(scene())
  const b = sceneStamp(scene({
    settings: { bgPool: [{ asset: 'asset-art-corridor', slot: 'day', tags: ['走廊'] }] },
  }))
  assert.notEqual(a, b)
})

test('sceneStamp: 改对话框几何换戳', () => {
  const a = sceneStamp(scene())
  const b = sceneStamp(scene({
    elements: [{ id: 'dialogue', type: 'dialogue', x: 340, y: 776, w: 1240, h: 248 }],
  }))
  assert.notEqual(a, b)
})

test('sceneStamp: 素材字节变了也换戳（同一 id 换图）', () => {
  const a = sceneStamp(scene())
  const b = sceneStamp(scene({
    assets: { 'asset-art-bedroom': { id: 'asset-art-bedroom', width: 1920, height: 1080, dataUrl: 'data:image/webp;base64,AAAAAAAA' } },
  }))
  assert.notEqual(a, b)
})

test('sceneStamp: 用户拖动元素不影响预设戳（只按预设内容算）', () => {
  // 拖动改的是存档场景，不是预设；戳只描述预设本身。
  assert.equal(sceneStamp(scene()), sceneStamp(scene()))
})

test('sceneStamp: 空/坏输入不抛异常', () => {
  assert.equal(sceneStamp(null), '0')
  assert.equal(sceneStamp({}), sceneStamp({}))
})

test('presetOverridesSaved: 无预设时保留存档', () => {
  assert.equal(presetOverridesSaved(null, null, scene()), false)
  assert.equal(presetOverridesSaved(null, 'abc', scene()), false)
})

test('presetOverridesSaved: 无存档时用预设', () => {
  assert.equal(presetOverridesSaved('abc', null, null), true)
})

test('presetOverridesSaved: 旧版浏览器从来没存过戳 → 用预设（修复"还是旧的"）', () => {
  assert.equal(presetOverridesSaved('abc', null, scene()), true)
})

test('presetOverridesSaved: 戳一致 → 保留用户编辑', () => {
  assert.equal(presetOverridesSaved('abc', 'abc', scene()), false)
})

test('presetOverridesSaved: 戳不一致 → 预设覆盖', () => {
  assert.equal(presetOverridesSaved('abc', 'def', scene()), true)
})
