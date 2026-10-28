"""把每个姿态叠到当前背景上，生成一张拼版图，用于检查裁切/比例/投影是否合理。
用法: python scripts/preview-poses.py [out.jpg]
"""
import json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SCENE = os.path.join(ROOT, 'gal-scene.json')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'art', 'poses', '_stage_preview.jpg')

scene = json.load(open(SCENE, encoding='utf-8'))
settings = scene['settings']
assets = scene['assets']

def data_of(asset_id):
    a = assets.get(asset_id)
    if not a:
        return None
    raw = a.get('dataUrl') or a.get('data') if isinstance(a, dict) else a
    import base64, io
    if isinstance(raw, str) and raw.startswith('data:'):
        raw = raw.split(',', 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(raw)))

bg_el = next(e for e in scene['elements'] if e['type'] == 'background')
char_el = next(e for e in scene['elements'] if e['type'] == 'character')
W, H = settings['stageW'], settings['stageH']
bg = data_of(bg_el['image']).convert('RGB').resize((W, H))

def fit(im, box_w, box_h):
    r = min(box_w / im.width, box_h / im.height)
    return im.resize((max(1, round(im.width * r)), max(1, round(im.height * r))), Image.LANCZOS)

tiles = []
poses = settings['posePool']
for p in poses:
    im = data_of(p['asset'])
    if im is None:
        continue
    canvas = bg.copy()
    fitted = fit(im.convert('RGBA'), char_el['w'], char_el['h'])
    x = char_el['x'] + (char_el['w'] - fitted.width) // 2
    y = char_el['y'] + char_el['h'] - fitted.height
    canvas.paste(fitted, (x, y), fitted)
    # 标出角色盒子
    from PIL import ImageDraw
    d = ImageDraw.Draw(canvas)
    d.rectangle([char_el['x'], char_el['y'], char_el['x'] + char_el['w'], char_el['y'] + char_el['h']],
                outline=(255, 60, 60), width=3)
    d.text((char_el['x'] + 8, char_el['y'] + 8), p['pose'], fill=(255, 60, 60))
    tiles.append((p['pose'], canvas))

cols = 3
rows = (len(tiles) + cols - 1) // cols
tw, th = 640, 360
sheet = Image.new('RGB', (cols * tw, rows * th), (30, 30, 34))
for i, (name, im) in enumerate(tiles):
    sheet.paste(im.resize((tw, th), Image.LANCZOS), ((i % cols) * tw, (i // cols) * th))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
sheet.save(OUT, quality=88, optimize=True)
print('->', OUT, sheet.size, [t[0] for t in tiles])
