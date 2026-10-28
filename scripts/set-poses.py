# -*- coding: utf-8 -*-
"""把「鲸鱼娘_矢量立绘素材」里的全身类姿态，统一摆到 900x1500 的画布上（底部对齐、水平居中），
输出 art/poses/<name>.webp。之后由 scripts/ingest-poses.mjs 内联进 gal-scene.json。

用法：
    python scripts/set-poses.py ["<素材目录>"] [--preview]

为什么要统一画布：舞台里的立绘元素是 520x900 的框，图片按「高 100%、底部对齐」渲染；
如果每张图尺寸不同，切换姿态时人物大小会跳。统一画布 = 换姿态时只有形状变化，不跳尺寸。
"""
from __future__ import annotations

import os
import sys
from PIL import Image

CANVAS_W, CANVAS_H = 900, 1500
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'art', 'poses')

# name: (源文件名, 缩放系数) —— 系数按「与 01 站立同样身高」估算后手调
POSES = [
    # name, 源文件, 缩放系数, 可选裁剪框（相对源图的比例 l,t,r,b）
    ('stand', '01_full_body_standing.png', 1.40),   # 全身站立（默认）
    ('back', '12_back_view_standing.png', 2.42),    # 侧身回眸
    ('kneel', '13_seated_kneeling.png', 1.95, (0.0, 0.0, 0.85, 1.0)),  # 跪坐（右侧有蓝绸残片，裁掉）
    ('curl', '14_curl_up_seated.png', 1.38),        # 抱膝坐
    ('sleep', '05_sleeping_with_whale.png', 2.10),  # 抱着小鲸鱼趴睡
    ('chibi', '15_chibi_hug_whale.png', 1.55),      # Q 版小鲸鱼（彩蛋）
]

# 表情头像（小圆形气泡用），保持原图比例，只裁掉多余透明边
FACES = [
    ('face_smile', '06_expression_soft_smile.png'),
    ('face_shy', '07_expression_bashful.png'),
    ('face_wink', '08_expression_wink.png'),
    ('face_surprise', '09_expression_surprised.png'),
    ('face_sleepy', '10_expression_sleepy.png'),
    ('face_happy', '11_expression_happy.png'),
]



def largest_component(im: Image.Image, floor: int = 16, coarse_w: int = 200) -> Image.Image:
    """只保留最大的不透明连通块。

    素材 PNG 里常混着**别的构图的残片**（相邻姿态的肩膀、另一张图的边缘），
    它们会把 bbox 撑大、让主体偏移到画布一侧。做法：把 alpha 缩到宽 200 的粗网格，
    BFS 标记连通块取最大者，再把掩码放大回原尺寸去乘 alpha。"""
    import numpy as np
    from collections import deque

    alpha = np.array(im.split()[-1])
    h, w = alpha.shape
    k = max(1, w // coarse_w)
    small = alpha[::k, ::k] > floor
    sh, sw = small.shape
    seen = np.zeros_like(small, dtype=bool)
    best: list[tuple[int, int]] = []
    for y0 in range(sh):
        for x0 in range(sw):
            if not small[y0, x0] or seen[y0, x0]:
                continue
            q = deque([(y0, x0)])
            seen[y0, x0] = True
            pts = []
            while q:
                y, x = q.popleft()
                pts.append((y, x))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            q.append((ny, nx))
            if len(pts) > len(best):
                best = pts
    if not best:
        return im
    mask_small = np.zeros_like(small, dtype=bool)
    for y, x in best:
        mask_small[y, x] = True
    mask = Image.fromarray((mask_small * 255).astype("uint8"), "L")
    mask = mask.resize((w, h), Image.NEAREST).point(lambda v: 255 if v > 128 else 0)
    keep = np.array(mask) > 128
    a = alpha.copy()
    a[~keep] = 0
    out = im.copy()
    out.putalpha(Image.fromarray(a, "L"))
    return out


def clean(im: Image.Image, floor: int = 16) -> Image.Image:
    """alpha < floor 的杂点清零（描摹残留的淡色碎屑会撑大 bbox）。"""
    a = im.split()[-1].point(lambda v: 0 if v < floor else v)
    out = im.copy()
    out.putalpha(a)
    return out


def trim(im: Image.Image, pad: int = 2) -> Image.Image:
    box = im.split()[-1].getbbox()
    if box is None:
        return im
    l, t, r, b = box
    l = max(0, l - pad); t = max(0, t - pad)
    r = min(im.width, r + pad); b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def build_pose(src_path: str, scale: float, crop=None) -> Image.Image:
    src = clean(Image.open(src_path).convert('RGBA'))
    if crop is not None:
        l, t, r, b = crop
        src = src.crop((round(l * src.width), round(t * src.height), round(r * src.width), round(b * src.height)))
    src = trim(largest_component(src))
    w = max(1, round(src.width * scale))
    h = max(1, round(src.height * scale))
    if h > CANVAS_H:
        k = CANVAS_H / h
        w, h = max(1, round(w * k)), CANVAS_H
    fig = src.resize((w, h), Image.LANCZOS)
    canvas = Image.new('RGBA', (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    canvas.alpha_composite(fig, ((CANVAS_W - w) // 2, CANVAS_H - h))
    return canvas


def build_face(src_path: str) -> Image.Image:
    src = trim(largest_component(clean(Image.open(src_path).convert('RGBA')), floor=16, coarse_w=120), pad=0)
    side = max(src.width, src.height)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.alpha_composite(src, ((side - src.width) // 2, (side - src.height) // 2))
    return sq.resize((192, 192), Image.LANCZOS)


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    preview = '--preview' in sys.argv
    src_dir = args[0] if args else os.path.join(os.path.dirname(OUT_DIR), 'poses-src')
    if not os.path.isdir(src_dir):
        print('素材目录不存在:', src_dir)
        print('用法: python scripts/set-poses.py <素材目录> [--preview]')
        return 2
    os.makedirs(OUT_DIR, exist_ok=True)

    made = []
    for pose in POSES:
        name, fname, scale = pose[:3]
        crop = pose[3] if len(pose) > 3 else None
        p = os.path.join(src_dir, fname)
        if not os.path.exists(p):
            print('跳过（缺文件）:', fname)
            continue
        im = build_pose(p, scale, crop)
        out = os.path.join(OUT_DIR, name + '.webp')
        im.save(out, 'WEBP', quality=88, method=6)
        made.append((name, out, im))

    for name, fname in FACES:
        p = os.path.join(src_dir, fname)
        if not os.path.exists(p):
            print('跳过（缺文件）:', fname)
            continue
        im = build_face(p)
        out = os.path.join(OUT_DIR, name + '.webp')
        im.save(out, 'WEBP', quality=90, method=6)
        made.append((name, out, im))

    for name, out, _ in made:
        print(f'{name:12s} {os.path.getsize(out) // 1024:4d} KB  -> {out}')

    if preview:
        sheet = Image.new('RGBA', (len(POSES) * 300, 500), (247, 242, 232, 255))
        x = 0
        for pose in POSES:
            name, fname, scale = pose[:3]
            crop = pose[3] if len(pose) > 3 else None
            p = os.path.join(src_dir, fname)
            if not os.path.exists(p):
                continue
            im = build_pose(p, scale, crop).resize((300, 500), Image.LANCZOS)
            sheet.alpha_composite(im, (x, 0))
            x += 300
        pv = os.path.join(OUT_DIR, '_preview.jpg')
        sheet.convert('RGB').save(pv, 'JPEG', quality=90)
        print('预览:', pv)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
