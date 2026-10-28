/**
 * 用 Hugging Face Space（FLUX.1-schnell）免费接口生成背景图。
 * 用法：node scripts/gen-flux.mjs <outName> "<prompt>" [w] [h] [seed]
 *
 * 走 gradio 的 call/infer + SSE 取结果，再把图下载到 art/incoming/<outName>.png
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const SPACE = 'https://black-forest-labs-flux-1-schnell.hf.space'

const [outName, prompt, w = '1344', h = '768', seedArg] = process.argv.slice(2)
if (!outName || !prompt) {
  console.error('usage: node scripts/gen-flux.mjs <outName> "<prompt>" [w] [h] [seed]')
  process.exit(1)
}
const seed = Number(seedArg ?? Math.floor(Math.random() * 1e9))

const post = await fetch(SPACE + '/gradio_api/call/infer', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    data: [prompt, seed, false, Number(w), Number(h), 4],
  }),
})
if (!post.ok) {
  console.error('[gen] 提交失败', post.status, (await post.text()).slice(0, 300))
  process.exit(1)
}
const { event_id: eventId } = await post.json()
console.log('[gen] event', eventId, 'seed', seed)

const stream = await fetch(SPACE + '/gradio_api/call/infer/' + eventId, {
  headers: { accept: 'text/event-stream' },
})
const text = await stream.text()
const lines = text.split('\n')
let payload = null
for (const line of lines) {
  if (!line.startsWith('data:')) continue
  const raw = line.slice(5).trim()
  if (raw === '' || raw === 'null') continue
  try {
    const obj = JSON.parse(raw)
    if (Array.isArray(obj) && obj[0] !== undefined) payload = obj
  } catch {
    /* 非 JSON 的进度行 */
  }
}
if (payload === null) {
  console.error('[gen] 没拿到结果：', text.slice(-400))
  process.exit(1)
}
const first = payload[0]
const url = typeof first === 'string' ? first : first?.url
if (!url) {
  console.error('[gen] 结果里没有图片地址：', JSON.stringify(first).slice(0, 300))
  process.exit(1)
}
const abs = url.startsWith('http') ? url : SPACE + '/gradio_api/file=' + url
const bin = await fetch(abs)
const buf = Buffer.from(await bin.arrayBuffer())
const outDir = path.join(root, 'art', 'incoming')
fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, outName + '.png')
fs.writeFileSync(out, buf)
console.log('[gen] saved', out, buf.length, 'bytes')
