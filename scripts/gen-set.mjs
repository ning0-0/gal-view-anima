/**
 * 批量生成 GAL 视窗背景（FLUX.1-schnell @ HF Space，匿名可用）。
 * 用法：node scripts/gen-set.mjs [name...]   —— 不给名字就全跑
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const SPACE = 'https://black-forest-labs-flux-1-schnell.hf.space'
const outDir = path.join(root, 'art', 'incoming')
fs.mkdirSync(outDir, { recursive: true })

const STYLE =
  'anime visual novel background art, no humans, watercolor and cel-shaded animation background painting, ' +
  'soft volumetric light, ice blue and cream white with warm wood palette, clean brushwork, high key, ' +
  'gentle paper grain, 16:9 wide shot, no text, no watermark, no characters'

const SCENES = [
  ['bedroom', 'empty japanese schoolgirl dorm bedroom at dawn, white lace canopy bed, warm wooden floor, sheer curtains, small potted plant on windowsill, misty morning light', 1344, 768, 101],
  ['corridor', 'empty japanese school dormitory hallway, long one-point perspective, wooden floor, big window at the far end with sea view, warm wall lamps, soft daylight', 1344, 768, 202],
  ['dining', 'empty school cafeteria, wooden long tables and chairs, afternoon slanting sunlight, large windows with green foliage outside', 1344, 768, 303],
  ['library', 'empty school library, tall wooden bookshelves, light shafts through floating dust, wooden reading tables, quiet atmosphere', 1344, 768, 404],
  ['courtyard', 'empty school courtyard, tree shadows on paving stones, stone bench, red brick walls, sunny dappled light, clear sky', 1344, 768, 505],
  ['bridge_dusk', 'riverside stone bridge at dusk, blue purple sky, calm river with reflections, distant town lights, lantern glow on the bridge', 1344, 768, 606],
  ['night_market', 'japanese night market street, warm string lights, wet pavement reflections, small wooden shop stalls without text, deep blue night sky', 1344, 768, 707],
  ['rain_room', 'cozy room beside a rainy window, raindrops tracing on the glass, cold blue light outside, cream curtains, warm indoor lamp glow', 1344, 768, 808],
]

const wanted = process.argv.slice(2)
const list = wanted.length > 0 ? SCENES.filter(s => wanted.includes(s[0])) : SCENES

async function generate([name, scene, w, h, seed]) {
  const out = path.join(outDir, name + '.webp')
  if (fs.existsSync(out)) {
    console.log('[gen] skip', name)
    return
  }
  const prompt = scene + ', ' + STYLE
  const post = await fetch(SPACE + '/gradio_api/call/infer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: [prompt, seed, false, w, h, 4] }),
  })
  if (!post.ok) throw new Error('submit ' + post.status + ' ' + (await post.text()).slice(0, 200))
  const { event_id: eventId } = await post.json()
  const stream = await fetch(SPACE + '/gradio_api/call/infer/' + eventId, {
    headers: { accept: 'text/event-stream' },
  })
  const text = await stream.text()
  let payload = null
  for (const line of text.split('\n')) {
    if (!line.startsWith('data:')) continue
    const raw = line.slice(5).trim()
    if (raw === '' || raw === 'null') continue
    try {
      const obj = JSON.parse(raw)
      if (Array.isArray(obj) && obj[0] !== undefined) payload = obj
    } catch {
      /* 进度行 */
    }
  }
  if (payload === null) throw new Error('no result: ' + text.slice(-300))
  const first = payload[0]
  const url = typeof first === 'string' ? first : first?.url
  if (!url) throw new Error('no url: ' + JSON.stringify(first).slice(0, 200))
  const abs = url.startsWith('http') ? url : SPACE + '/gradio_api/file=' + url
  const bin = await fetch(abs)
  const buf = Buffer.from(await bin.arrayBuffer())
  fs.writeFileSync(out, buf)
  console.log('[gen] ok', name, buf.length, 'bytes')
}

for (const scene of list) {
  try {
    await generate(scene)
  } catch (err) {
    console.error('[gen] FAIL', scene[0], err.message)
  }
}
