"""把写实底画「动画化」，并派生 5 个时段/天气变体（1920x1080 webp）。

为什么需要这些步骤：底画是写实风格的园林石桥（橄榄绿 + 暖金色），人物是白/冰蓝
轻水彩 anime 立绘。只做调色会留下「照片 + 纸片人」的割裂感。所以：

1. painterly —— 半分辨率中值滤波 ×2 再放大，抹掉石材/树叶的写实高频纹理，混合
   少量高斯模糊保住构图轮廓；量化到 12 级再轻微模糊，得到接近赛璐璐的色块。
2. unify —— 把黄绿/橄榄棕搬到青蓝色相（人物的主色），但用「平滑权重」而不是硬
   阈值，避免边缘出现青点；高亮区域（石桥、天光）只降饱和不搬色相，保留石头的
   暖白，跟人物的白裙呼应；天空单独拉成淡蓝。
3. grade —— 按时段/天气调色：清晨淡蓝雾、白天冰蓝高调、黄昏玫瑰金、夜里靛蓝、
   雨天灰青。
4. 抬黑位 + 极淡纸纹，贴近 AnimaVN 的奶油纸界面。

用法：
    python scripts/make-bg-variants.py     # → .tmpbg/bg-*.webp
    node   scripts/add-bg-assets.mjs       # 写回 gal-scene.json
"""
import base64
import io
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

WS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENE = os.path.join(WS, "gal-scene.json")
OUT = os.path.join(WS, ".tmpbg")
SLOTS = ("dawn", "day", "dusk", "night", "rain")


# ---------- 基础工具 ----------

def to_float(img):
    return np.asarray(img, dtype=np.float32) / 255.0


def to_img(a):
    return Image.fromarray((np.clip(a, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8), "RGB")


def sat(a, s):
    l = (a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114)[..., None]
    return l + (a - l) * s


def gains(a, g):
    return a * np.array(g, dtype=np.float32)


def lift(a, black, white):
    return black + a * (white - black)


def vignette(a, strength):
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2.0) / (w / 2.0)) ** 2 + ((yy - h / 2.0) / (h / 2.0)) ** 2) / math.sqrt(2)
    return a * (1.0 - strength * (r ** 2))[..., None]


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def blur_mask(mask, radius):
    """把 float 掩膜转成 8bit 图模糊后再回来：权重边界平滑，不会出现硬边斑点。"""
    img = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(img, dtype=np.float32) / 255.0


def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.max(a, axis=-1)
    mn = np.min(a, axis=-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    i = m & (mx == r)
    h[i] = ((g[i] - b[i]) / d[i]) % 6.0
    i = m & (mx == g)
    h[i] = (b[i] - r[i]) / d[i] + 2.0
    i = m & (mx == b)
    h[i] = (r[i] - g[i]) / d[i] + 4.0
    return h * 60.0, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0), mx


def hsv_to_rgb(h, s, v):
    h = (h % 360.0) / 60.0
    c = v * s
    x = c * (1.0 - np.abs(h % 2.0 - 1.0))
    m = v - c
    z = np.zeros_like(h)
    seg = np.floor(h).astype(np.int32) % 6
    r = np.select([seg == 0, seg == 1, seg == 2, seg == 3, seg == 4, seg == 5], [c, x, z, z, x, c])
    g = np.select([seg == 0, seg == 1, seg == 2, seg == 3, seg == 4, seg == 5], [x, c, c, x, z, z])
    b = np.select([seg == 0, seg == 1, seg == 2, seg == 3, seg == 4, seg == 5], [z, z, x, c, c, x])
    return np.stack([r + m, g + m, b + m], axis=-1)


# ---------- 一、动画化 ----------

def painterly(img):
    w, h = img.size
    half = img.resize((w // 2, h // 2), Image.LANCZOS)
    flat = half.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MedianFilter(5))
    up = flat.resize((w, h), Image.LANCZOS)
    return Image.blend(up, img.filter(ImageFilter.GaussianBlur(2.0)), 0.30)


def unify(img):
    p = to_float(img)
    h, s, v = rgb_to_hsv(p)

    # 1) 黄绿 / 橄榄棕 → 青蓝。权重按色相平滑过渡，并随饱和度衰减（灰石头不动）。
    w = smoothstep(10.0, 42.0, h) * (1.0 - smoothstep(168.0, 200.0, h))
    w = w * np.clip((s - 0.05) / 0.20, 0.0, 1.0)
    # 2) 高亮（石桥、天光）保护：只降温搬一点，别把暖白石头变绿。
    w = w * (1.0 - 0.90 * smoothstep(0.50, 0.78, v))
    w = blur_mask(w, 6.0)

    t = np.clip((h - 10.0) / 190.0, 0.0, 1.0)
    target = 218.0 - 12.0 * t        # 一律落到 218~206 的蓝青区间
    h2 = h + (target - h) * w * 0.95
    s2 = s * (1.0 - 0.34 * w)
    v2 = v * (1.0 + 0.05 * w)

    # 3) 高亮石头：只去饱和不搬色相，让它读成暖白石材，跟人物的白裙呼应。
    bright = smoothstep(0.55, 0.86, v)
    bright = blur_mask(bright, 8.0)
    s2 = s2 * (1.0 - 0.30 * bright)

    # 4) 天空：顶部高亮区固定成淡蓝，去掉底画原本的暖金天空。
    hh = np.mgrid[0:p.shape[0], 0:p.shape[1]][0] / float(p.shape[0])
    sky = smoothstep(0.34, 0.02, hh) * smoothstep(0.60, 0.84, v)
    sky = blur_mask(sky, 12.0)
    h2 = h2 + (222.0 - h2) * sky * 0.92
    s2 = s2 * (1.0 - sky) + 0.13 * sky
    v2 = v2 * (1.0 - sky) + 0.95 * sky

    q = hsv_to_rgb(h2, s2, v2)
    q = np.round(q * 11.0) / 11.0          # 轻量化，得到色块感
    q = lift(q, 0.075, 0.975)              # 抬黑位：暗部是蓝灰不是死黑
    q = sat(q, 0.88)
    q = q * np.array([0.995, 1.0, 1.05], dtype=np.float32) + np.array([0.0, 0.004, 0.014], dtype=np.float32)

    # 5) 暗部往蓝紫走（动画背景的阴影是冷的），并加一点 S 形对比，避免发灰。
    shadow = (1.0 - smoothstep(0.06, 0.48, v2))[..., None]
    q = q * (1.0 - 0.30 * shadow) + np.array([0.15, 0.18, 0.29], dtype=np.float32) * 0.30 * shadow
    q = q + (q - 0.5) * 0.10

    rng = np.random.default_rng(20261028)
    q = q + rng.normal(0.0, 1.0, size=(q.shape[0], q.shape[1], 1)).astype(np.float32) * 0.005
    return to_img(q).filter(ImageFilter.GaussianBlur(0.9))


# ---------- 二、时段调色 ----------

def grade(img, name):
    a = to_float(img)
    if name == "dawn":        # 清晨：淡蓝雾 + 一点粉
        a = gains(a, (0.95, 0.99, 1.08))
        a = lift(a, 0.12, 0.95)
        a = sat(a, 0.88)
        a = a + np.array([0.040, 0.026, 0.050], dtype=np.float32)
        a = vignette(a, 0.08)
    elif name == "day":       # 白天：冰蓝高调
        a = gains(a, (0.97, 1.00, 1.02))
        a = lift(a, 0.08, 0.98)
        a = sat(a, 0.98)
        a = vignette(a, 0.05)
    elif name == "dusk":      # 黄昏：玫瑰金，暗部偏蓝紫
        a = gains(a, (1.10, 0.97, 0.88))
        a = a + np.array([0.050, 0.018, 0.028], dtype=np.float32)
        a = lift(a, 0.09, 0.96)
        a = sat(a, 1.04)
        a = vignette(a, 0.14)
    elif name == "night":     # 夜里：靛蓝 + 月光
        a = gains(a, (0.62, 0.72, 1.02))
        a = lift(a, 0.06, 0.84)
        a = sat(a, 0.82)
        a = a + np.array([0.008, 0.016, 0.042], dtype=np.float32)
        a = vignette(a, 0.30)
    elif name == "rain":      # 雨天：灰青低对比
        a = sat(a, 0.58)
        a = gains(a, (0.94, 0.99, 1.02))
        a = lift(a, 0.15, 0.90)
        a = vignette(a, 0.12)
    else:
        raise SystemExit("unknown grade " + name)
    img = to_img(a)
    if name == "rain":
        img = img.filter(ImageFilter.GaussianBlur(0.7))
    return img


def load_base():
    with open(SCENE, "r", encoding="utf-8") as f:
        scene = json.load(f)
    for key, value in scene["assets"].items():
        if key == "asset-anima-bg":
            raw = base64.b64decode(value["dataUrl"].split(",", 1)[1])
            return Image.open(io.BytesIO(raw)).convert("RGB")
    raise SystemExit("asset-anima-bg not found")


def main():
    os.makedirs(OUT, exist_ok=True)
    base = load_base()
    if base.size != (1920, 1080):
        base = base.resize((1920, 1080), Image.LANCZOS)
    styled = unify(painterly(base))
    for name in SLOTS:
        img = grade(styled, name)
        path = os.path.join(OUT, "bg-%s.webp" % name)
        img.save(path, "WEBP", quality=85, method=6)
        print("%-6s %6d KB" % (name, os.path.getsize(path) // 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
