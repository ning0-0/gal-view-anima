/**
 * 立绘姿态变化规则：把「什么时候该换哪个姿态」抽成纯函数，方便单测。
 *
 * 素材池（场景 settings.posePool）里每一项形如：
 *   { pose: 'stand', asset: 'asset-pose-stand', tags: ['站', '你好'], default: true }
 *
 * 与背景不同，姿态是「临时动作」：命中关键词后演一小段（holdMs），然后自动回到默认站姿，
 * 这样不会一直跪在地上说话。
 *
 * 判定优先级（高 → 低）：
 *   1. 台词/玩家输入命中 tags → 用该姿态，重新计时
 *   2. 正在 hold 窗口内 → 保持
 *   3. 默认姿态
 *
 * 表情（6 个头像）用同一套匹配，但另有独立的短 hold，用来在说话时飘一个表情气泡。
 */

export const POSE_NAMES = ['stand', 'back', 'kneel', 'curl', 'sleep', 'chibi']

/** 归一化姿态池：丢掉没有 asset 的项；default 只能有一个（第一个标记的生效）。 */
export function normalizePosePool(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  let hasDefault = false
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const asset = typeof item.asset === 'string' ? item.asset.trim() : ''
    if (asset === '') continue
    const pose = typeof item.pose === 'string' && item.pose.trim() !== '' ? item.pose.trim() : 'stand'
    const tags = Array.isArray(item.tags)
      ? item.tags.filter(tag => typeof tag === 'string' && tag.trim() !== '').map(tag => tag.trim())
      : []
    const isDefault = item.default === true && !hasDefault
    if (isDefault) hasDefault = true
    out.push({ pose, asset, tags, default: isDefault })
  }
  return out
}

/** 池里的默认姿态（显式 default → 名为 stand 的 → 第一项）。 */
export function defaultPose(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return null
  return pool.find(entry => entry.default) ?? pool.find(entry => entry.pose === 'stand') ?? pool[0]
}

/** 关键词命中：tags 越长越优先，避免「睡」压过「睡不着」。 */
export function matchPoseByText(pool, text) {
  if (typeof text !== 'string' || text === '' || !Array.isArray(pool)) return null
  let best = null
  let bestLen = 0
  for (const entry of pool) {
    for (const tag of entry.tags) {
      if (tag.length > bestLen && text.includes(tag)) {
        best = entry
        bestLen = tag.length
      }
    }
  }
  return best
}

/**
 * 选出此刻该用的姿态。
 * @param {Array} pool normalizePosePool 的结果
 * @param {{text?: string, current?: string|null, since?: number, now?: number, holdMs?: number}} ctx
 *        current 当前姿态名；since 这次姿态开始的时刻（毫秒）；holdMs 保持时长
 * @returns {{pose: string, asset: string, reason: string}|null}
 */
export function pickPose(pool, ctx) {
  const fallback = defaultPose(pool)
  if (fallback === null) return null
  const c = ctx ?? {}
  const now = Number.isFinite(c.now) ? c.now : Date.now()
  const holdMs = Number.isFinite(c.holdMs) ? c.holdMs : 14000
  const current = typeof c.current === 'string' && c.current !== '' ? c.current : null
  const since = Number.isFinite(c.since) ? c.since : 0

  const hit = matchPoseByText(pool, c.text)
  if (hit !== null) {
    if (hit.pose !== current) return { pose: hit.pose, asset: hit.asset, reason: 'text' }
    return { pose: current, asset: assetOf(pool, current) ?? hit.asset, reason: 'hold' }
  }
  if (current !== null && current !== fallback.pose && now - since < holdMs) {
    return { pose: current, asset: assetOf(pool, current) ?? fallback.asset, reason: 'hold' }
  }
  return { pose: fallback.pose, asset: fallback.asset, reason: current === null ? 'init' : 'rest' }
}

/** 姿态名 → 素材 id（找不到退默认姿态）。 */
export function assetOf(pool, pose) {
  if (!Array.isArray(pool)) return null
  const hit = pool.find(entry => entry.pose === pose)
  if (hit !== undefined && hit !== null) return hit.asset
  const slot = defaultPose(pool)
  return slot !== null ? slot.asset : null
}

// ---- 表情头像：独立的短气泡，规则同上但窗口更短 ----

export function normalizeFacePool(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const asset = typeof item.asset === 'string' ? item.asset.trim() : ''
    if (asset === '') continue
    const tags = Array.isArray(item.tags)
      ? item.tags.filter(tag => typeof tag === 'string' && tag.trim() !== '').map(tag => tag.trim())
      : []
    out.push({ asset, tags })
  }
  return out
}

/** 命中哪个表情素材（返回 asset 字符串或 null）。 */
export function pickFace(pool, text) {
  if (!Array.isArray(pool) || pool.length === 0) return null
  const hit = matchPoseByText(pool.map(entry => ({ ...entry, pose: entry.asset })), text)
  return hit !== null ? hit.asset : null
}
