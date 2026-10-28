/**
 * 待决交互（宿主提问 / 工具审批 / 计划审批）的纯逻辑层。
 *
 * 载体契约（与官方 `conversation.composer` 卡片同一条来源）：
 *   Session 状态快照 `snapshot.get(sessionId).pendingInteraction` 给出一个
 *   `PendingApproval | PendingQuestion` 实例：
 *
 *   PendingApproval { kind:'approval', key, sessionId, toolName, callId?,
 *                     reason?, displayReason?, answerable,
 *                     answer('allowed-once' | 'rejected') => Promise }
 *
 *   PendingQuestion { kind:'question' | 'plan-review', key, sessionId,
 *                     questions: [{ id, question, header?, detail?,
 *                                   options?: [{ label, description? }],
 *                                   multiSelect? }],
 *                     callId?, review?, dismissal,
 *                     answer({ answers: [{ id, selected: string[], custom? }] }) => Promise,
 *                     dismiss() => Promise, snapshot() => { channel } }
 *
 * 回答后宿主广播 resolved → 该 session 的 pendingInteraction 消失 → 面板自动收起。
 */

/** 待决类型；无待决时返回空串。 */
export function pendingKind(pending) {
  if (pending === null || pending === undefined) return ''
  const kind = pending.kind
  return typeof kind === 'string' ? kind : ''
}

/** 是否是需要渲染的待决（批准 / 提问 / 计划审批）。 */
export function isPending(pending) {
  const kind = pendingKind(pending)
  return kind === 'approval' || kind === 'question' || kind === 'plan-review'
}

/** 提问批（批准卡没有 questions）。 */
export function questionsOf(pending) {
  if (pending === null || pending === undefined) return []
  return Array.isArray(pending.questions) ? pending.questions : []
}

/** 每题的草稿：已选项、自定义输入、是否跳过。 */
export function emptyDrafts(questions) {
  const list = Array.isArray(questions) ? questions : []
  return list.map(() => ({ selected: [], custom: '', skipped: false }))
}

/** 某题是否已作答（选过、写过、或明确跳过）。 */
export function draftAnswered(draft) {
  if (draft === null || draft === undefined) return false
  if (draft.skipped === true) return true
  if (typeof draft.custom === 'string' && draft.custom.trim() !== '') return true
  return Array.isArray(draft.selected) && draft.selected.length > 0
}

/** 多选切换：已选则移除，未选则追加。 */
export function toggleSelected(selected, label) {
  const list = Array.isArray(selected) ? selected : []
  return list.includes(label) ? list.filter(item => item !== label) : [...list, label]
}

/** 整批是否都答完。 */
export function draftsComplete(drafts) {
  const list = Array.isArray(drafts) ? drafts : []
  return list.length > 0 && list.every(draftAnswered)
}

/**
 * 组装宿主认的整批答案：{ answers: [{ id, selected, custom? }] }。
 * 与官方提交逻辑一致 —— 单选且写了自定义文字时只送 custom（selected 清空）。
 */
export function buildAnswerBatch(questions, drafts) {
  const list = Array.isArray(questions) ? questions : []
  const states = Array.isArray(drafts) ? drafts : []
  return {
    answers: list.map((item, index) => {
      const state = states[index] ?? { selected: [], custom: '', skipped: false }
      if (state.skipped === true) return { id: item.id, selected: [] }
      const custom = typeof state.custom === 'string' ? state.custom.trim() : ''
      const selected = Array.isArray(state.selected) ? state.selected : []
      const keepSelected = custom === '' || item.multiSelect === true
      const answer = { id: item.id, selected: keepSelected ? selected : [] }
      if (custom !== '') answer.custom = custom
      return answer
    }),
  }
}

/** 人类可读的原因（displayReason 优先）。 */
export function reasonOf(pending) {
  if (pending === null || pending === undefined) return ''
  if (typeof pending.displayReason === 'string' && pending.displayReason !== '') return pending.displayReason
  if (typeof pending.reason === 'string' && pending.reason !== '') return pending.reason
  return ''
}

/** 工具名。 */
export function toolNameOf(pending) {
  if (pending === null || pending === undefined) return ''
  return typeof pending.toolName === 'string' ? pending.toolName : ''
}

/** 批准卡的一行场景文案（工具名 + 原因）。 */
export function approvalSceneText(pending) {
  if (pending === null || pending === undefined) return ''
  const name = toolNameOf(pending) !== '' ? toolNameOf(pending) : '工具'
  const reason = reasonOf(pending)
  return reason === '' ? `${name} 请求越权执行，需要你点头。` : `${name} 请求越权执行：${reason}`
}

/** 回答通道（waterfall / rpc / none）；rpc 答完要显式收起。 */
export function channelOf(pending) {
  if (pending === null || pending === undefined || typeof pending.snapshot !== 'function') return 'none'
  const snapshot = pending.snapshot()
  return snapshot !== null && typeof snapshot === 'object' && typeof snapshot.channel === 'string' ? snapshot.channel : 'none'
}

/** 批准：直接投出宿主认的 outcome（'allowed-once' | 'rejected'）。 */
export async function answerApproval(pending, outcome) {
  if (pending === null || pending === undefined || typeof pending.answer !== 'function') throw new Error('该批准无法回答')
  await pending.answer(outcome)
}

/** 提问：投整批答案；rpc 通道答完后要显式收起面板。 */
export async function answerQuestions(pending, batch) {
  if (pending === null || pending === undefined || typeof pending.answer !== 'function') throw new Error('该提问无法回答')
  await pending.answer(batch)
  if (channelOf(pending) === 'rpc' && typeof pending.dismiss === 'function') await pending.dismiss()
}

/** 收起 / 取消：宿主命名过的卡是「暂时收起」，无名的卡等于取消请求。 */
export async function dismissPending(pending) {
  if (pending === null || pending === undefined || typeof pending.dismiss !== 'function') return
  await pending.dismiss()
}
