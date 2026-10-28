# 致谢 · Credits

「GAL 视窗」不是从零长出来的。它的骨架、取数方式、皮肤与周边，都站在下面这几位作者的作品上。
如果你觉得这个视图好用，请把掌声也分给他们。

| 项目 | 作者 | 在这里被用到了什么 |
| --- | --- | --- |
| [Ayase34/gal-view](https://github.com/Ayase34/gal-view) | [@Ayase34](https://github.com/Ayase34) | **原版 GAL 视窗**：官方 bundle 插件骨架、会话页标签注入、场景编辑器（拖拽/属性/图层）、打字机与转录映射、以及**随包分发的默认立绘**。本仓库是在它之上做视觉与叙事改造的衍生版。 |
| [RichardMLe/gal-view](https://github.com/RichardMLe/gal-view) | [@RichardMLe](https://github.com/RichardMLe) | 上游 fork 与维护，取数与宿主编排（含 `useSessionStatus` 的 pending 交互接线）一路的参考实现。安装命令 `dsh plugin --profile web add github:RichardMLe/gal-view#main` 即来自这里。 |
| [RichardMLe/dsh-deep-whale](https://github.com/RichardMLe/dsh-deep-whale) | [@RichardMLe](https://github.com/RichardMLe) | 「深度鲸」桌面吉祥物/鲸鲸系交互的起点，也是本视图里鲸鱼娘气质的来源之一。 |
| [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | [@MeteorNOX](https://github.com/MeteorNOX) | 鲸鱼形态的状态/余额挂件设计参考，影响了下方的状态条与「召唤鲸鲸」式的入口。 |

## 关于立绘

本仓库分发的 `gal-scene.json` 使用**上游 gal-view 的默认立绘**（深蓝连衣裙的鲸鱼娘），
来源见上表第一行，遵循其仓库的许可。

作者本地另有一套自制立绘与表情素材，**不随本仓库分发**（`.gitignore` 已忽略 `art/poses/`）。
相关代码（姿态切换、表情气泡）保持一致：缺素材时回退到默认立绘，不影响使用。

## 关于背景

`art/incoming/` 与 `art/out/` 里的场景背景图由本仓库作者用开源文生图模型（FLUX.1-schnell）
生成后经 `scripts/fit-bg.py` 统一调色，可自由替换为你自己的场景图。

## 许可

插件代码沿用上游 gal-view 的许可；上游各项目的代码与美术资源版权归各自作者所有。
