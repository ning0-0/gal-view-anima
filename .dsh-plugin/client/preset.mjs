// 预设场景版本戳：client bundle 里内嵌了仓库根的 gal-scene.json（预设场景 + 背景素材）。
// 浏览器把用户看到/改过的场景存进 localStorage 后，永远不会再读预设——
// 于是每次换背景图、调对话框几何，老用户都还看到旧画面（"gal视窗还是旧的"）。
// 这里给预设算一个内容戳：预设变了而本地存的戳还是旧的，就让预设覆盖本地存档。

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

/** 32 位 FNV-1a：足够区分构建产物，又不必引依赖。 */
function fnv1a(text) {
  let hash = FNV_OFFSET
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/** 素材签名只取 id/尺寸/dataUrl 长度：预设里的图片可能有几 MB，不能整串哈希。 */
function assetSignature(assets) {
  if (assets === null || typeof assets !== 'object') return []
  return Object.keys(assets).sort().map(id => {
    const record = assets[id]
    if (record === null || typeof record !== 'object') return id + ':'
    const dataUrl = typeof record.dataUrl === 'string' ? record.dataUrl.length : 0
    return [id, record.width ?? 0, record.height ?? 0, dataUrl].join(':')
  })
}

/**
 * 场景内容戳：设置（含 bgPool 槽位与轮换规则）+ 元素几何与图片引用 + 素材签名。
 * 用户拖动元素不会改到这份戳的语义——戳只描述「预设本身」，
 * 所以同一份预设下用户自己的编辑不会被冲掉。
 */
export function sceneStamp(scene) {
  if (scene === null || typeof scene !== 'object') return '0'
  const settings = scene.settings === undefined ? null : scene.settings
  const elements = Array.isArray(scene.elements) ? scene.elements : []
  const geometry = elements.map(el => (el === null || typeof el !== 'object'
    ? ''
    : [el.id, el.type, el.x, el.y, el.w, el.h, el.image ?? ''].join(':')))
  return fnv1a([JSON.stringify(settings), geometry.join('|'), assetSignature(scene.assets).join('|')].join('\n'))
}

/**
 * 是否用预设覆盖本地存档：
 * - 没有预设（老版本 bundle）：本地有存档就用存档。
 * - 本地没存档：用预设。
 * - 本地存的戳与当前预设不符（含从未存过戳的旧版浏览器）：预设已经变了，用预设。
 * - 戳一致：预设没变，保留用户的编辑。
 */
export function presetOverridesSaved(presetStamp, savedStamp, savedScene) {
  const hasSaved = savedScene !== null && savedScene !== undefined
  if (presetStamp === null || presetStamp === undefined) return !hasSaved
  if (!hasSaved) return true
  return savedStamp !== presetStamp
}
