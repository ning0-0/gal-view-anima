/**
 * 背景变化规则：把「什么时候该换哪张底画」抽成纯函数，方便单测。
 *
 * 素材池（场景 settings.bgPool）里每一项形如：
 *   { asset: 'asset-bg-night', slot: 'night', tags: ['夜', '月', '星空'] }
 *
 * slot 取值：
 *   'dawn' | 'day' | 'dusk' | 'night' —— 按本地钟点兜底
 *   'rain'                            —— 天气/情绪（出错、聊到雨）
 *   'any'                             —— 任何时段都能用（最后的兜底）
 *
 * 判定优先级（高 → 低）：
 *   1. 台词/玩家输入的**关键词**命中 tags —— 直接切，忽略冷却
 *   2. 会话出错且池里有 rain 槽 —— 切到阴雨
 *   3. 冷却中 —— 保持当前
 *   4. 按本地钟点选对应 slot，取不到再退 'any'
 */

export const BG_SLOTS = ['dawn', 'day', 'dusk', 'night', 'rain', 'any']

/** 本地钟点 → 时段槽。5-8 清晨、8-17 白天、17-20 黄昏，其余算夜里。 */
export function timeSlotOf(hour) {
  const h = Number.isFinite(hour) ? ((Math.floor(hour) % 24) + 24) % 24 : 12
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

/** 归一化素材池：丢掉没有 asset 的项，tags 转成非空字符串数组。 */
export function normalizeBgPool(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const asset = typeof item.asset === 'string' ? item.asset.trim() : ''
    if (asset === '') continue
    const slot = BG_SLOTS.includes(item.slot) ? item.slot : 'any'
    const tags = Array.isArray(item.tags)
      ? item.tags.filter(tag => typeof tag === 'string' && tag.trim() !== '').map(tag => tag.trim())
      : []
    out.push({ asset, slot, tags })
  }
  return out
}

/** 关键词命中：返回命中的那一项（tags 越长越优先，避免「夜」压过「夜市」）。 */
export function matchByText(pool, text) {
  if (typeof text !== 'string' || text === '') return null
  const hay = text
  let best = null
  let bestLen = 0
  for (const entry of pool) {
    for (const tag of entry.tags) {
      if (tag.length > bestLen && hay.includes(tag)) {
        best = entry
        bestLen = tag.length
      }
    }
  }
  return best
}

/** 池里某个槽的第一张；'any' 兜底。 */
export function slotOf(pool, slot) {
  return pool.find(entry => entry.slot === slot) ?? pool.find(entry => entry.slot === 'any') ?? null
}

/** 某个槽的全部候选（同槽多张时用来轮换）；槽空则退 'any'。 */
export function candidatesOf(pool, slot) {
  const list = pool.filter(entry => entry.slot === slot)
  if (list.length > 0) return list
  return pool.filter(entry => entry.slot === 'any')
}

/**
 * 在某个槽里挑一张：同槽多张时按「每过一个冷却窗口换一张」轮换，且不重复当前这张，
 * 这样同一时段里不同场景（食堂/图书室/中庭）会自己转起来，而不是永远停在第一张。
 */
export function pickInSlot(pool, slot, current, now, minDwell) {
  const list = candidatesOf(pool, slot)
  if (list.length === 0) return null
  if (list.length === 1) return list[0]
  const fresh = list.filter(entry => entry.asset !== current)
  const rotated = fresh.length > 0 ? fresh : list
  const window = Math.max(1, Number.isFinite(minDwell) ? minDwell : 45000)
  const index = Math.floor((Number.isFinite(now) ? now : Date.now()) / window) % rotated.length
  return rotated[index]
}

/**
 * 选出此刻该用的背景。
 * @param {Array} pool normalizeBgPool 的结果
 * @param {{now?: number, hour?: number, text?: string, error?: boolean,
 *          waiting?: boolean, current?: string|null, lastSwitchAt?: number,
 *          minDwellMs?: number}} ctx
 * @returns {{asset: string, reason: string}|null}
 */
export function pickBackground(pool, ctx) {
  if (!Array.isArray(pool) || pool.length === 0) return null
  const c = ctx ?? {}
  const current = typeof c.current === 'string' && c.current !== '' ? c.current : null
  const minDwell = Number.isFinite(c.minDwellMs) ? c.minDwellMs : 45000
  const now = Number.isFinite(c.now) ? c.now : Date.now()
  const lastSwitchAt = Number.isFinite(c.lastSwitchAt) ? c.lastSwitchAt : 0

  const hit = matchByText(pool, c.text)
  if (hit !== null && hit.asset !== current) return { asset: hit.asset, reason: 'text' }

  // 等着玩家作答时画面不动：避免提问卡出现的同时背景也跳一下。
  if (c.waiting === true) return current === null ? firstOf(pool) : { asset: current, reason: 'hold' }

  const rain = c.error === true ? pool.find(entry => entry.slot === 'rain') : null
  if (rain !== null && rain !== undefined && rain.asset !== current) {
    return { asset: rain.asset, reason: 'error' }
  }

  // 冷却：刚换过就先待着（关键词命中已在上面放行）。
  if (current !== null && now - lastSwitchAt < minDwell) {
    return { asset: current, reason: 'cooldown' }
  }

  const slot = timeSlotOf(c.hour ?? new Date(now).getHours())
  const timed = pickInSlot(pool, slot, current, now, minDwell)
  if (timed !== null && timed.asset !== current) return { asset: timed.asset, reason: 'time:' + slot }
  return current === null ? firstOf(pool) : { asset: current, reason: 'steady' }
}

function firstOf(pool) {
  return pool.length > 0 ? { asset: pool[0].asset, reason: 'init' } : null
}
