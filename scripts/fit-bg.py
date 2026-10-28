"""把 art/incoming 里的图裁成 1920x1080（cover）+ 统一调色 + 存 webp。

用法：fit-bg.py <in> <out> [strength]

统一调色（grade）的目的：让 FLUX 生成的场景和立绘（水彩/柔和动漫风）能对得上——
降饱和、压一点动态范围、往米黄纸色偏、加轻微暗角。strength=0 关闭。
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

W, H = 1920, 1080
PAPER = (246, 240, 228)


def grade(im: Image.Image, strength: float) -> Image.Image:
    if strength <= 0:
        return im
    # 0) 先柔化细节：生成图的砖纹/树叶是「色块堆」，立绘是水彩笔触；
    #    抹掉一点高频，让两者的细节密度接近（0.6px 只掉锐度，不掉结构）。
    im = im.filter(ImageFilter.GaussianBlur(0.9))
    a = np.asarray(im, dtype=np.float32) / 255.0

    # 1) 降饱和：往灰度靠，抹掉生成图那种“数码艳”，贴近立绘的水彩感
    gray = a.mean(axis=2, keepdims=True)
    a = gray + (a - gray) * (1.0 - 0.18 * strength)

    # 2) 压动态范围 + 提中间调：纸面柔光，别让阴影死黑吃掉对话框
    a = np.clip(a, 0.0, 1.0) ** 0.94
    a = 0.05 + a * 0.95

    # 3) 往米黄纸色偏一点点（和 AnimaVN 的纸对话框同源）
    tint = np.array(PAPER, dtype=np.float32) / 255.0
    k = 0.08 * strength
    a = a * (1.0 - k) + tint * k

    # 4) 轻微暗角：视线收回到中央的角色与对话框
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - (w - 1) / 2) / (w / 2)) ** 2 + ((yy - (h - 1) / 2) / (h / 2)) ** 2)
    vig = np.clip(1.0 - 0.16 * np.clip(r - 0.55, 0.0, None) ** 1.4, 0.0, 1.0)[..., None]
    a = a * vig

    return Image.fromarray((np.clip(a, 0.0, 1.0) * 255.0).astype(np.uint8))


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    strength = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    im = Image.open(src).convert("RGB")
    sw, sh = im.size
    scale = max(W / sw, H / sh)
    nw, nh = int(round(sw * scale)), int(round(sh * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    left = (nw - W) // 2
    top = int((nh - H) * 0.42)
    im = im.crop((left, top, left + W, top + H))
    im = grade(im, strength)
    im.save(dst, "WEBP", quality=88, method=6)
    print("ok", dst, im.size, "grade", strength)


if __name__ == "__main__":
    main()
