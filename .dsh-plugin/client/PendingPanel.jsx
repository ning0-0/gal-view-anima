/**
 * 决策面板：游戏模式内渲染宿主的待决交互（批准 / 提问 / 计划审批）。
 *
 * 取数与官方「对话」栏的卡片同源 —— `useSessionStatus` 快照里的
 * `pendingInteraction`，动词也是载体自己的 `answer` / `dismiss`，
 * 所以两边共用同一条 wire 通道：这里答完，宿主广播 resolved，
 * 待决消失，面板自动收起，官方卡片也一起消失。
 *
 * 视觉（AnimaVN 纸质皮肤）：奶油纸卡 + 发丝描边 + 衬线标题 + 蓝色主按钮，
 * 与台词框同一套语言；批准与提问共用一张卡的骨架，深色主题走藏蓝变体。
 */

import React, { useCallback, useRef, useState } from 'react'
import {
  answerApproval, answerQuestions, approvalSceneText, buildAnswerBatch,
  dismissPending, draftAnswered, draftsComplete, emptyDrafts, isPending,
  pendingKind, questionsOf, reasonOf, toggleSelected, toolNameOf,
} from './pending.mjs'

/** 错误对象 → 一行中文（不引第三方库；与官方错误提示同粒度）。 */
function causeText(cause) {
  if (cause === null || cause === undefined) return '未知错误'
  if (typeof cause === 'string') return cause
  if (typeof cause === 'object' && typeof cause.message === 'string' && cause.message !== '') return cause.message
  return String(cause)
}

/** 细金线分隔（纸卡的呼吸线）。 */
function Rule() {
  return <div className="gv-pending-rule" aria-hidden="true" />
}

/** 批准：标题 + 场景化文案 + 两个选项。 */
function ApprovalCard({ pending }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const answer = (outcome) => {
    if (busy) return
    setBusy(true)
    setError(null)
    answerApproval(pending, outcome).catch((cause) => {
      setBusy(false)
      setError(causeText(cause))
    })
  }
  const name = toolNameOf(pending) !== '' ? toolNameOf(pending) : '工具'
  const reason = reasonOf(pending)
  const sceneText = approvalSceneText(pending)
  return (
    <div className="gv-pending-card is-awaiting" role="dialog" aria-label="批准请求">
      <div className="gv-pending-head">
        <span className="gv-pending-eyebrow">APPROVAL</span>
        <div className="gv-pending-head-row">
          <h3 className="gv-pending-title">需要你的批准</h3>
          <span className="gv-pending-tag">{name}</span>
        </div>
        <p className="gv-pending-detail">{sceneText}</p>
        {reason !== '' && reason !== sceneText && <p className="gv-pending-reason">{reason}</p>}
      </div>
      <Rule />
      <div className="gv-pending-options">
        <button type="button" className="gv-pending-option is-affirm" disabled={busy} onClick={() => answer('allowed-once')}>允许一次</button>
        <button type="button" className="gv-pending-option" disabled={busy} onClick={() => answer('rejected')}>拒绝</button>
      </div>
      {error !== null && <p className="gv-pending-error">{error}</p>}
    </div>
  )
}

/**
 * 提问：标题 + 选项列表 + 自定义回答。
 * 单选点击即答（非末题自动进入下一题）；多选可累积后「确定」；
 * 「先跳过」把本题置为跳过，「算了」收起/取消这张卡。
 */
function QuestionCard({ pending }) {
  const questions = questionsOf(pending)
  const [flow, setFlow] = useState(() => ({ index: 0, states: emptyDrafts(questions) }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // 作答框本地非受控（与官方对话栏同思路）：React 不重写 value，IME/光标交给浏览器。
  const answerRef = useRef(null)
  const answerText = () => (answerRef.current !== null ? answerRef.current.value : '')
  const clearAnswer = () => {
    if (answerRef.current !== null) answerRef.current.value = ''
  }
  const index = flow.index
  const states = flow.states
  const question = questions[index]
  const options = question !== undefined && Array.isArray(question.options) ? question.options : []
  const hasOptions = options.length > 0
  const multi = question !== undefined && question.multiSelect === true
  const notLast = index < questions.length - 1
  const current = states[index] ?? { selected: [], custom: '', skipped: false }

  const respondWith = useCallback((finalStates) => {
    if (busy) return
    if (!draftsComplete(finalStates)) {
      setError('还有未回答的问题')
      return
    }
    setBusy(true)
    setError(null)
    answerQuestions(pending, buildAnswerBatch(questions, finalStates)).catch((cause) => {
      setBusy(false)
      setError(causeText(cause))
    })
  }, [busy, questions, pending])

  const advance = (nextIndex) => {
    const text = answerText()
    setFlow(cur => ({
      index: nextIndex,
      states: cur.states.map((s, i) => (
        i !== cur.index || text.trim() === '' ? s : { ...s, custom: text, skipped: false }
      )),
    }))
    clearAnswer()
    setError(null)
  }

  const choose = (label) => {
    if (question === undefined) return
    const text = answerText()
    if (multi) {
      setFlow(cur => ({
        ...cur,
        states: cur.states.map((s, i) => (
          i === cur.index ? { ...s, selected: toggleSelected(s.selected, label), skipped: false } : s
        )),
      }))
      setError(null)
      return
    }
    // 单选：非末题快照草稿并自动进入下一题；末题直接提交（galgame 点击即答）。
    const nextStates = states.map((s, i) => (i === index ? { ...s, selected: [label], skipped: false } : s))
    if (notLast) {
      setFlow({
        index: index + 1,
        states: nextStates.map((s, i) => (i === index && text.trim() !== '' ? { ...s, custom: text } : s)),
      })
      clearAnswer()
      setError(null)
      return
    }
    setFlow({ index, states: nextStates })
    setError(null)
    if (text.trim() === '') respondWith(nextStates)
  }

  const skip = () => {
    const nextStates = states.map((s, i) => (i === index ? { ...s, selected: [], custom: '', skipped: true } : s))
    setFlow({ index, states: nextStates })
    clearAnswer()
    setError(null)
    if (notLast) advance(index + 1)
  }

  const next = () => {
    const answered = draftAnswered(current) || answerText().trim() !== ''
    if (!answered) {
      setError('请先回答本题')
      return
    }
    advance(index + 1)
  }

  const submit = () => {
    const text = answerText()
    const finalStates = text.trim() !== ''
      ? states.map((s, i) => (i === index ? { ...s, custom: text, skipped: false } : s))
      : states
    respondWith(finalStates)
    clearAnswer()
  }

  const close = () => {
    if (busy) return
    setBusy(true)
    setError(null)
    dismissPending(pending).catch((cause) => {
      setBusy(false)
      setError(causeText(cause))
    })
  }

  if (question === undefined) return null
  return (
    <div className="gv-pending-card is-awaiting" role="dialog" aria-label="提问">
      <div className="gv-pending-head">
        {typeof question.header === 'string' && question.header !== '' && (
          <span className="gv-pending-eyebrow">{question.header}</span>
        )}
        <div className="gv-pending-head-row">
          <h3 className="gv-pending-title">{question.question}</h3>
          {questions.length > 1 && <span className="gv-pending-tag">{index + 1} / {questions.length}</span>}
        </div>
        {typeof question.detail === 'string' && question.detail.trim() !== '' && (
          <p className="gv-pending-detail">{question.detail}</p>
        )}
      </div>
      <Rule />
      {hasOptions && (
        <div className="gv-pending-options">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              className={'gv-pending-option is-choice' + (current.selected.includes(option.label) ? ' is-selected' : '')}
              disabled={busy}
              onClick={() => choose(option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      <div className="gv-pending-answer">
        <input
          className="gv-pending-answer-input"
          type="text"
          placeholder="或直接输入你的回答，回车提交……"
          ref={answerRef}
          defaultValue=""
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
        />
      </div>
      <div className="gv-pending-foot">
        <button type="button" className="gv-pending-link" disabled={busy} onClick={skip}>先跳过这题</button>
        <button type="button" className="gv-pending-link" disabled={busy} onClick={close}>算了</button>
        {multi && (
          <button type="button" className="gv-pending-submit" disabled={busy} onClick={notLast ? next : submit}>
            {notLast ? '下一题' : '确定'}
          </button>
        )}
      </div>
      {error !== null && <p className="gv-pending-error">{error}</p>}
    </div>
  )
}

/** 面板整体：轻虚化 + 居中纸卡；批准与提问各取一个渲染。 */
export function PendingPanel({ pending }) {
  if (!isPending(pending)) return null
  const kind = pendingKind(pending)
  return (
    <div className="gv-pending-layer" role="region" aria-label="等待你的决定">
      <div className="gv-pending-veil" aria-hidden="true" />
      <div className="gv-pending-stack">
        {kind === 'approval'
          ? <ApprovalCard key={pending.key ?? 'approval'} pending={pending} />
          : <QuestionCard key={pending.key ?? 'question'} pending={pending} />}
      </div>
    </div>
  )
}
