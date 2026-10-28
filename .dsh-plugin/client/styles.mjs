/** GAL 视窗样式：全部作用域限定在 [data-gal-view] 之下，避免污染宿主。
 * 视觉基调：深色夜晚 + 半透明毛玻璃 + 紫蓝/靛青/暗红点缀 + 细边框 + 克制的发光。
 */

export const CSS = `
[data-gal-view] {
  --gv-bg: #0a0d1c;
  --gv-panel: rgba(16, 20, 38, .86);
  --gv-panel-2: rgba(24, 29, 52, .94);
  --gv-line: rgba(255, 255, 255, .09);
  --gv-line-strong: rgba(255, 255, 255, .17);
  --gv-text: #e6e9f4;
  --gv-text-dim: #98a1c2;
  --gv-accent: #8f7bff;
  --gv-accent-2: #4f8cff;
  --gv-accent-red: #e05a6b;
  --gv-glow: 0 0 0 1px rgba(143, 123, 255, .30), 0 0 16px rgba(143, 123, 255, .16);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 60vh;
  overflow: hidden;
  background:
    radial-gradient(1200px 500px at 18% -10%, rgba(79, 140, 255, .07), transparent 60%),
    radial-gradient(900px 420px at 85% 110%, rgba(143, 123, 255, .08), transparent 60%),
    var(--gv-bg);
  color: var(--gv-text);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif;
  user-select: none;
}
[data-gal-view] *, [data-gal-view] *::before, [data-gal-view] *::after { box-sizing: border-box; }
[data-gal-view] input, [data-gal-view] textarea, [data-gal-view] select { user-select: text; }

/* ---------- 填满会话区 ---------- */
/* 挂载时组件隐藏会话外壳的输入席并给根节点打上该标记：绝对定位占满整个会话主体。 */
[data-gal-view][data-gal-fills] {
  position: absolute;
  inset: 0;
  height: auto;
  min-height: 0;
  z-index: 5;
}

/* ---------- 顶部栏 ---------- */
.gv-topbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--gv-line);
  background: linear-gradient(180deg, rgba(20, 24, 44, .7), rgba(14, 17, 34, .35));
}
.gv-brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; letter-spacing: .12em; color: var(--gv-text); }
.gv-brand-mark {
  width: 10px; height: 10px; transform: rotate(45deg);
  background: linear-gradient(135deg, var(--gv-accent), var(--gv-accent-2));
  box-shadow: 0 0 10px rgba(143, 123, 255, .55);
}
.gv-mode-switch { display: flex; border: 1px solid var(--gv-line-strong); }
.gv-mode-btn {
  border: 0; background: transparent; color: var(--gv-text-dim);
  padding: 4px 16px; font-size: 12px; cursor: pointer;
  transition: color .15s ease, background .15s ease;
}
.gv-mode-btn + .gv-mode-btn { border-left: 1px solid var(--gv-line-strong); }
.gv-mode-btn:hover { color: var(--gv-text); background: rgba(255, 255, 255, .04); }
.gv-mode-btn.is-on { color: #fff; background: linear-gradient(180deg, rgba(143, 123, 255, .22), rgba(79, 140, 255, .14)); box-shadow: inset 0 -2px 0 var(--gv-accent); }
.gv-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.gv-topbar-hint { font-size: 11px; color: var(--gv-text-dim); letter-spacing: .05em; }

/* ---------- 按钮 ---------- */
.gv-btn {
  border: 1px solid var(--gv-line-strong);
  background: rgba(255, 255, 255, .03);
  color: var(--gv-text);
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 3px;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease, box-shadow .15s ease, color .15s ease;
}
.gv-btn:hover:not(:disabled) {
  border-color: rgba(143, 123, 255, .65);
  background: rgba(143, 123, 255, .10);
  box-shadow: 0 0 12px rgba(143, 123, 255, .22);
  color: #fff;
}
.gv-btn:disabled { opacity: .38; cursor: not-allowed; }
.gv-btn-accent {
  border-color: rgba(143, 123, 255, .55);
  background: linear-gradient(180deg, rgba(143, 123, 255, .20), rgba(79, 140, 255, .12));
}
.gv-btn-accent:hover:not(:disabled) { background: linear-gradient(180deg, rgba(143, 123, 255, .30), rgba(79, 140, 255, .18)); }
.gv-toggle.is-on {
  border-color: rgba(143, 123, 255, .7);
  background: rgba(143, 123, 255, .14);
  color: #fff;
  box-shadow: 0 0 10px rgba(143, 123, 255, .2);
}

/* ---------- 舞台 ---------- */
.gv-stage-area { flex: 1 1 auto; min-height: 0; display: flex; }
.gv-stage-wrap {
  flex: 1 1 auto; min-width: 0; min-height: 0;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative;
  background: radial-gradient(900px 460px at 50% 30%, rgba(30, 36, 70, .5), transparent 70%), #070912;
}
.gv-stage {
  position: relative;
  flex: none;
  /* 居中缩放：wrap 按未缩放的布局盒居中，原点取中心才能让缩放后的舞台视觉居中（0 0 会在小窗口把舞台挤到左上并被裁掉）。 */
  transform-origin: 50% 50%;
  background: #0c1026;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, .06), 0 22px 60px rgba(0, 0, 0, .55);
}
.gv-grid {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background-image:
    linear-gradient(rgba(143, 123, 255, .10) 1px, transparent 1px),
    linear-gradient(90deg, rgba(143, 123, 255, .10) 1px, transparent 1px);
}
/* 边缘吸附指引线（手势期间显示）。 */
.gv-guide {
  position: absolute; z-index: 9998; pointer-events: none;
  background: var(--gv-accent-2);
  box-shadow: 0 0 6px rgba(79, 140, 255, .85);
}
.gv-guide-x { top: 0; bottom: 0; width: 1px; }
.gv-guide-y { left: 0; right: 0; height: 1px; }

/* ---------- 元素 ---------- */
.gv-el { position: absolute; border-style: solid; pointer-events: none; overflow: visible; }
.gv-stage.is-editor .gv-el.is-pickable { pointer-events: auto; cursor: move; }
/* 透明功能按钮：游戏模式可点击（元素级交互，无悬停高亮）。 */
[data-gal-mode='game'] .gv-el-action-button { pointer-events: auto; cursor: pointer; }
.gv-el-action-button.is-on { border-color: var(--gv-accent); background: rgba(143, 123, 255, .14); color: #fff; }
/* 浅色皮肤下的「自动」开启态：沿用元素自身文字色，避免白字落在奶油底上不可读。 */
.gv-el-action-button.is-on { border-color: rgba(31, 111, 178, .55); background: rgba(31, 111, 178, .14); color: inherit; }
.gv-stage.is-editor .gv-el.is-pickable:hover { outline: 1px solid rgba(143, 123, 255, .55); outline-offset: 1px; }
.gv-el.is-locked { cursor: not-allowed; }

/* 背景占位 */
.gv-elbg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: inherit; overflow: hidden; }
/* 背景交叉淡入：上一张压在新图上方淡出，避免硬切。 */
.gv-bgghost { position: absolute; inset: 0; background-size: cover; background-position: center; pointer-events: none; animation: gv-bgfade 900ms ease forwards; }
@keyframes gv-bgfade { from { opacity: 1; } to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .gv-bgghost { animation-duration: 1ms; } }
.gv-elbg-label {
  font-size: inherit; letter-spacing: .5em; text-indent: .5em; opacity: .4; color: inherit;
  text-shadow: 0 1px 12px rgba(0, 0, 0, .5);
}
.gv-elbg-corners {
  position: absolute; inset: 10px; border: 1px solid rgba(255, 255, 255, .07);
}
.gv-elbg-corners::before, .gv-elbg-corners::after {
  content: ''; position: absolute; width: 18px; height: 18px;
}
.gv-elbg-corners::before { top: -1px; left: -1px; border-top: 2px solid rgba(255, 255, 255, .22); border-left: 2px solid rgba(255, 255, 255, .22); }
.gv-elbg-corners::after { bottom: -1px; right: -1px; border-bottom: 2px solid rgba(255, 255, 255, .22); border-right: 2px solid rgba(255, 255, 255, .22); }

/* 角色占位立绘 */
.gv-char { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; }
.gv-el-character .gv-char { animation: gv-float 4.6s ease-in-out infinite; }
.gv-char-svg { width: 100%; height: calc(100% - 30px); filter: drop-shadow(0 10px 22px rgba(0, 0, 0, .5)); }
/* 真实立绘：底部对齐、等比缩放（保持透明 PNG 的轮廓与站位一致）。 */
.gv-char-img { width: 100%; height: calc(100% - 30px); object-fit: contain; object-position: bottom center; filter: drop-shadow(0 10px 22px rgba(0, 0, 0, .5)); }
.gv-char.is-speaking .gv-char-svg {
  filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 10px 22px rgba(0, 0, 0, .5));
  color: var(--gv-speak-color, #9b8cff);
}
.gv-char-plate {
  margin-top: 6px; display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 3px 12px;
  background: rgba(12, 15, 30, .78);
  border: 1px solid var(--gv-line-strong);
  border-radius: 2px;
}
.gv-char-label { font-size: 10px; letter-spacing: .28em; color: var(--gv-text-dim); }
.gv-char-name { font-size: 12px; font-weight: 600; }
/* 立绘标签牌留空时整体隐藏（干净的全幅立绘，不留空壳边框）。 */
.gv-char-plate:has(.gv-char-label:empty):has(.gv-char-name:empty) { display: none; }

/* 编辑器里的对话框静态样式 */
.gv-elbox { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 14px 18px 12px 30px; overflow: hidden; }
.gv-elbox-name {
  position: absolute; top: -18px; left: 8px;
  padding: 1px 14px; font-size: 13px; font-weight: 600; letter-spacing: .1em;
  background: rgba(14, 17, 34, .92); border-left: 3px solid currentColor;
}
.gv-elbox-text { font-size: inherit; line-height: 1.7; color: inherit; margin-top: auto; }

/* 文本/形状/按钮/装饰 */
.gv-eltext { position: absolute; inset: 0; display: flex; align-items: center; justify-content: inherit; padding: 6px; overflow: hidden; word-break: break-word; }
.gv-elbtn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: inherit; overflow: hidden; letter-spacing: .12em; }
.gv-elshape { position: absolute; inset: 0; display: flex; align-items: center; justify-content: inherit; overflow: hidden; letter-spacing: .18em; }
.gv-eldeco {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: inherit; overflow: hidden;
  background-image: repeating-linear-gradient(45deg, transparent 0 7px, rgba(255, 255, 255, .05) 7px 8px);
  border-style: dashed !important;
}
.gv-eldeco-label { font-size: inherit; letter-spacing: .22em; color: inherit; opacity: .85; }

/* ---------- 游戏对话框 ----------
 * 不启用 backdrop-filter：毛玻璃会把背后立绘 PNG 的透明区域复合成实心模糊块，
 * 破坏「透明度 → 看到清晰立绘」的预期。透明只走标准 alpha 混合（元素 opacity + 半透明背景）。 */
.gv-dialogue {
  position: absolute; pointer-events: auto; cursor: pointer;
  border-style: solid;
  transition: box-shadow .2s ease, border-color .2s ease;
}
/* 游戏模式对话区不渲染任何悬停/聚焦高亮（点击跳过打字无需视觉反馈边框）。 */
.gv-dialogue:focus, .gv-dtext:focus { outline: none; }
/* 浅色场景：对话框浮在插画上的投影（深色场景同样成立，不影响可读性）。 */
[data-gal-mode='game'] .gv-dialogue { box-shadow: 0 18px 46px rgba(38, 30, 18, .28); }
/* 浅色场景：AI 状态行（思考中…）用中性墨色，避免浅色底上看不清。 */
[data-gal-mode='game'] .gv-dtext-status { color: #6b6a66; }
/* 浅色场景：立绘换成暖调柔和投影，避免默认 50% 黑投影在亮底上留下黑边。
 * --gv-char-tone 由舞台的 data-bg-slot 决定（夜间/黄昏/雨天按场景调色），
 * 让立绘跟着背景的色温走，避免夜里人物还是白天打光那种「贴纸感」。 */
[data-gal-mode='game'] .gv-char-img,
[data-gal-mode='game'] .gv-char-svg {
  filter: var(--gv-char-tone, none) drop-shadow(0 2px 3px rgba(38, 30, 20, .22)) drop-shadow(0 16px 30px rgba(45, 35, 22, .34));
}
[data-gal-mode='game'] .gv-stage[data-bg-slot='dawn'] { --gv-char-tone: brightness(1.02) saturate(1.03) sepia(.05); }
[data-gal-mode='game'] .gv-stage[data-bg-slot='day'] { --gv-char-tone: brightness(1.01) saturate(1.05) sepia(.06); }
[data-gal-mode='game'] .gv-stage[data-bg-slot='dusk'] { --gv-char-tone: brightness(.97) saturate(1.04) sepia(.10); }
[data-gal-mode='game'] .gv-stage[data-bg-slot='night'] { --gv-char-tone: brightness(.82) saturate(.90) hue-rotate(-6deg); }
[data-gal-mode='game'] .gv-stage[data-bg-slot='rain'] { --gv-char-tone: brightness(.93) saturate(.84) hue-rotate(5deg); }
/* 立绘背后压一个极淡的柔光暗角：浅背景（书架/白墙/窗光）上把角色托出来，
 * 不做硬边光晕，避免像贴纸贴上去。 */
[data-gal-mode='game'] .gv-el-character::before {
  content: '';
  position: absolute;
  inset: -8% -6% -4% -6%;
  border-radius: 50%;
  background: radial-gradient(56% 50% at 50% 48%, rgba(34, 40, 56, .26), rgba(34, 40, 56, 0) 74%);
  pointer-events: none;
  z-index: 0;
}
[data-gal-mode='game'] .gv-el-character .gv-char { position: relative; z-index: 1; width: 100%; height: 100%; }
/* 脚下的椭圆投影：把人物「放」在地面上，而不是浮在背景前。
 * 位置用 --gv-char-shadow-* 可调（相对角色元素盒子）：默认贴在立绘脚底、对话纸上沿之上。
 * 双层（内核实、外圈虚）+ 高斯模糊，避免出现一圈生硬的灰饼。 */
[data-gal-mode='game'] .gv-el-character::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: var(--gv-char-shadow-bottom, 0px);
  width: var(--gv-char-shadow-w, 106%);
  height: var(--gv-char-shadow-h, 56px);
  transform: translateX(-50%);
  border-radius: 50%;
  background:
    radial-gradient(62% 60% at 50% 40%, rgba(20, 14, 8, .54), rgba(20, 14, 8, 0) 78%),
    radial-gradient(closest-side, rgba(28, 20, 12, .34), rgba(28, 20, 12, 0) 80%);
  filter: blur(8px);
  opacity: var(--gv-char-shadow-o, 1);
  pointer-events: none;
  z-index: 0;
}
/* 独立「说话人」元素：文本框类型（默认纯文本外观，可自行加背景/边框），
 * 游戏模式动态显示当前台词行的说话人（你/DeepSeek/隐藏）。 */
.gv-sname {
  position: absolute; border-style: solid;
  display: flex; align-items: center; justify-content: inherit; overflow: hidden;
  padding: 2px 6px; white-space: nowrap;
  letter-spacing: .14em; font-weight: 700;
}
.gv-el > .gv-sname { inset: 0; }
.gv-dialogue-body {
  position: absolute; inset: 10px 18px 8px 18px;
  overflow-y: auto; scrollbar-width: thin;
  font-size: inherit; line-height: 1.8; letter-spacing: .02em;
  white-space: pre-wrap; word-break: break-word; color: inherit;
}
.gv-dialogue-caret {
  display: inline-block; width: 2px; height: 1.05em; margin-left: 3px;
  background: var(--gv-accent-2); vertical-align: text-bottom;
  animation: gv-blink 1s steps(2, start) infinite;
}
/* 独立「台词」元素：实时对话文本渲染进它，位置/尺寸/字号/颜色随元素属性。
 * 完全透明（无背景/无悬停描边/无滚动条视觉），避免边缘黑框。 */
.gv-dtext {
  position: absolute; pointer-events: auto; cursor: pointer;
  overflow: hidden; scrollbar-width: none;
  padding: 2px 10px;
  line-height: 1.8; letter-spacing: .02em;
  white-space: pre-wrap; word-break: break-word;
  border-style: solid;
}
.gv-dtext::-webkit-scrollbar { display: none; }
/* 页尾省略号：紧贴文本（负边距抵消 letter-spacing 间隙）。 */
.gv-dtext-ellipsis {
  letter-spacing: 0;
  margin-left: -0.02em;
  opacity: .85;
}
/* Galgame 翻页提示（还有下一页时显示在文本框右下角）。 */
.gv-dtext-more {
  position: absolute; right: 8px; bottom: 2px;
  font-size: .7em; color: var(--gv-accent);
  animation: gv-pulse 1.4s ease-in-out infinite;
}
/* AI 状态行（思考中…/编写代码中…）：与对话文本同字号、次级色、轻微呼吸。 */
.gv-dtext-status {
  color: var(--gv-text-dim);
  letter-spacing: .04em;
  animation: gv-pulse 1.6s ease-in-out infinite;
}

/* ---------- 输入 ----------
 * 游戏模式底部仅剩输入区（84px，固定高度）；控制功能已迁入场景内「透明按钮」元素。
 * 编辑模式用「工具栏 40px + 占位条 44px」对齐这里的 84px，
 * 保证两种模式的舞台槽位尺寸严格一致 → WYSIWYG。 */
.gv-input { flex: none; height: 84px; display: flex; gap: 10px; align-items: stretch; padding: 8px 16px 10px; }
.gv-input.is-waiting { visibility: hidden; }
.gv-input-box {
  flex: 1 1 auto; resize: none;
  background: rgba(10, 13, 28, .72);
  border: 1px solid var(--gv-line-strong);
  border-radius: 4px;
  color: var(--gv-text);
  font-family: inherit; font-size: 14px; line-height: 1.6;
  padding: 8px 12px;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.gv-input-box:focus { border-color: rgba(143, 123, 255, .6); box-shadow: 0 0 0 1px rgba(143, 123, 255, .25), 0 0 16px rgba(143, 123, 255, .12); }
.gv-input-box::placeholder { color: var(--gv-text-dim); }
.gv-send { align-self: stretch; min-width: 84px; }

/* ---------- 游戏模式：AnimaVN 纸质外框（顶栏 / 模式切换 / 输入行 / 历史浮层 / 舞台留白） ----------
 * 舞台里是手绘插画 + 奶油纸对话框，外框若仍是旧深蓝玻璃就会「里外两种皮肤」。
 * 这里把游戏模式的外框整体换成同一套纸质语言：奶油底、发丝边、藏蓝强调、圆角胶囊按钮。
 * 编辑模式保持原来的深色工作台（工具属性面板需要高对比度）。 */
[data-gal-mode='game'] {
  --gv-accent: #1f6fb2;
  --gv-accent-2: #2a7cbe;
  --gv-text: #1e222a;
  --gv-text-dim: #6b6a66;
  background: linear-gradient(180deg, #f7f2e8, #eee6d6);
  color: #1e222a;
}
[data-gal-mode='game'] .gv-topbar {
  border-bottom: 1px solid rgba(122, 108, 88, .24);
  background: linear-gradient(180deg, rgba(252, 249, 243, .97), rgba(246, 240, 229, .93));
}
[data-gal-mode='game'] .gv-brand {
  color: #1e222a;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  letter-spacing: .18em;
}
[data-gal-mode='game'] .gv-brand-mark {
  background: linear-gradient(135deg, #1f6fb2, #4a90d9);
  box-shadow: 0 0 10px rgba(31, 111, 178, .32);
}
[data-gal-mode='game'] .gv-mode-switch {
  border: 1px solid rgba(122, 108, 88, .28);
  border-radius: 999px;
  background: rgba(255, 255, 255, .62);
  overflow: hidden;
}
[data-gal-mode='game'] .gv-mode-btn { color: #6b6a66; padding: 3px 16px; }
[data-gal-mode='game'] .gv-mode-btn + .gv-mode-btn { border-left: 1px solid rgba(122, 108, 88, .20); }
[data-gal-mode='game'] .gv-mode-btn:hover { color: #17466c; background: rgba(31, 111, 178, .08); }
[data-gal-mode='game'] .gv-mode-btn.is-on {
  color: #fff; box-shadow: none;
  background: linear-gradient(180deg, #2a7cbe, #1f5c8f);
}
[data-gal-mode='game'] .gv-btn {
  background: #e7eef7;
  border: 1px solid rgba(31, 111, 178, .30);
  border-radius: 999px;
  color: #1f5c8f;
  box-shadow: none;
}
[data-gal-mode='game'] .gv-btn:hover:not(:disabled) {
  background: #dce8f6;
  border-color: rgba(31, 111, 178, .45);
  color: #17466c;
  box-shadow: none;
}
[data-gal-mode='game'] .gv-stage-wrap { background: linear-gradient(180deg, #f4eddf, #e9e0ce); }
/* 游戏模式裁到舞台边框：立绘底部对齐 + 浮动动画会溢出 16:9 舞台，
 * 不裁的话脚会穿出舞台下沿、出现在对话框下面的留白里。 */
[data-gal-mode='game'] .gv-stage { overflow: hidden; }
/* 铺满视窗：底画 cover 到整块舞台区，16:9 舞台浮在中间；暗角 + 轻模糊把边缘压下去，视线仍在舞台内。 */
.gv-stage-wrap.is-bleed {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.gv-bleed-scrim {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(118% 88% at 50% 46%, rgba(20, 16, 10, 0) 38%, rgba(20, 16, 10, .46) 100%);
  backdrop-filter: blur(4px) saturate(.98) brightness(.9);
}
.gv-stage-wrap.is-bleed .gv-stage { z-index: 1; }
[data-gal-mode='game'] .gv-stage { box-shadow: 0 0 0 1px rgba(122, 108, 88, .26), 0 20px 50px rgba(38, 30, 18, .22); }
[data-gal-mode='game'] .gv-stage-wrap.is-bleed .gv-stage { box-shadow: 0 0 0 1px rgba(255, 255, 255, .10), 0 26px 70px rgba(18, 14, 8, .40); }
[data-gal-mode='game'] .gv-input {
  border-top: 1px solid rgba(122, 108, 88, .20);
  background: linear-gradient(180deg, rgba(247, 242, 232, .94), rgba(240, 233, 220, .97));
}
[data-gal-mode='game'] .gv-input-box {
  background: rgba(255, 255, 255, .94);
  border: 1px solid rgba(122, 108, 88, .30);
  border-radius: 10px;
  color: #1e222a;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  line-height: 1.7;
}
[data-gal-mode='game'] .gv-input-box::placeholder { color: #a09a8c; }
[data-gal-mode='game'] .gv-input-box:focus {
  border-color: rgba(31, 111, 178, .55);
  box-shadow: 0 0 0 3px rgba(31, 111, 178, .10);
}
[data-gal-mode='game'] .gv-send {
  background: linear-gradient(180deg, #2a7cbe, #1f5c8f);
  border: 1px solid rgba(23, 70, 108, .42);
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  letter-spacing: .12em;
}
[data-gal-mode='game'] .gv-send:hover:not(:disabled) {
  background: linear-gradient(180deg, #2f86cc, #25689c);
  border-color: rgba(23, 70, 108, .55);
  color: #fff;
  box-shadow: 0 8px 18px rgba(31, 92, 143, .26);
}
[data-gal-mode='game'] .gv-history {
  background: rgba(250, 247, 240, .97);
  border-left: 1px solid rgba(122, 108, 88, .28);
  box-shadow: -18px 0 44px rgba(38, 30, 18, .18);
  backdrop-filter: none;
  color: #1e222a;
}
[data-gal-mode='game'] .gv-history-head {
  border-bottom: 1px solid rgba(122, 108, 88, .22);
  color: #1e222a;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  letter-spacing: .22em;
}
[data-gal-mode='game'] .gv-history-row { border-bottom: 1px solid rgba(122, 108, 88, .16); }
[data-gal-mode='game'] .gv-history-name { color: #1f5c8f; }
[data-gal-mode='game'] .gv-history-text { color: #33322e; }
[data-gal-mode='game'] .gv-history-empty { color: #8a8272; }

/* ---------- 历史面板 ---------- */
.gv-history {
  position: absolute; top: 0; right: 0; bottom: 0; z-index: 80;
  width: min(400px, 92%);
  display: flex; flex-direction: column;
  background: rgba(13, 16, 32, .94);
  border-left: 1px solid rgba(143, 123, 255, .3);
  box-shadow: -18px 0 44px rgba(0, 0, 0, .5);
  backdrop-filter: blur(10px);
  animation: gv-slide-in .24s cubic-bezier(.16, 1, .3, 1);
}
.gv-history-head {
  flex: none; display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--gv-line-strong);
  font-size: 13px; font-weight: 600; letter-spacing: .2em;
}
.gv-history-list { flex: 1; overflow-y: auto; padding: 6px 14px 14px; }
.gv-history-row { padding: 9px 0; border-bottom: 1px solid var(--gv-line); }
.gv-history-name { font-size: 12px; font-weight: 700; letter-spacing: .1em; }
.gv-history-text { margin: 3px 0 0; font-size: 13px; line-height: 1.7; color: var(--gv-text); white-space: pre-wrap; word-break: break-word; }
.gv-history-empty { padding: 24px 0; text-align: center; color: var(--gv-text-dim); font-size: 13px; }

/* ---------- 设置浮层 ---------- */
.gv-settings {
  position: absolute; right: 16px; bottom: 92px; z-index: 80;
  width: 300px;
  background: var(--gv-panel-2);
  border: 1px solid var(--gv-line-strong);
  box-shadow: 0 18px 44px rgba(0, 0, 0, .5), var(--gv-glow);
  backdrop-filter: blur(10px);
  padding: 12px 14px;
  animation: gv-rise .18s cubic-bezier(.16, 1, .3, 1);
}
.gv-settings-head {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 8px; margin-bottom: 6px;
  border-bottom: 1px solid var(--gv-line-strong);
  font-size: 13px; font-weight: 600; letter-spacing: .2em;
}
.gv-settings-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 5px 0; font-size: 12px; color: var(--gv-text-dim); }
.gv-settings-row input[type="text"], .gv-settings-row select {
  width: 170px;
  background: rgba(10, 13, 28, .7);
  border: 1px solid var(--gv-line-strong);
  color: var(--gv-text);
  font-size: 12px; padding: 3px 8px; border-radius: 3px; outline: none;
}
.gv-settings-row input:focus, .gv-settings-row select:focus { border-color: rgba(143, 123, 255, .6); }
.gv-settings-hint { margin: 8px 0 0; font-size: 11px; color: var(--gv-text-dim); line-height: 1.6; }

/* ---------- 编辑模式 ----------
 * 舞台槽位与游戏模式同尺寸：工具栏 40px 对齐游戏控制条，底部占位条 84px 对齐输入区；
 * 侧栏悬浮在舞台之上（不挤压舞台），隐藏侧栏时舞台尺寸不变。 */
.gv-editor { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.gv-editor-toolbar {
  flex: none; height: 40px; display: flex; flex-wrap: nowrap; align-items: center; gap: 8px;
  overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
  padding: 0 12px;
  border-bottom: 1px solid var(--gv-line);
  background: linear-gradient(180deg, rgba(20, 24, 44, .7), rgba(14, 17, 34, .4));
}
.gv-editor-toolbar::-webkit-scrollbar { height: 0; }
.gv-editor-spacer { flex: none; height: 44px; }
.gv-toolbar-group { display: flex; gap: 4px; align-items: center; }
.gv-toolbar-group + .gv-toolbar-group { border-left: 1px solid var(--gv-line-strong); padding-left: 8px; }
.gv-toolbar-right { margin-left: auto; border-left: 0 !important; }
/* 添加菜单挂在编辑根节点（锚点由 JS 按按钮位置计算），避免被工具栏 overflow 裁剪。 */
.gv-add-menu {
  position: absolute; left: 0; top: 0; z-index: 90;
  min-width: 132px;
  background: var(--gv-panel-2);
  border: 1px solid var(--gv-line-strong);
  box-shadow: 0 14px 36px rgba(0, 0, 0, .5);
  padding: 4px;
  animation: gv-rise .16s cubic-bezier(.16, 1, .3, 1);
}
.gv-add-menu button {
  display: flex; align-items: center; gap: 8px; width: 100%;
  background: transparent; border: 0; color: var(--gv-text);
  font-size: 12px; padding: 5px 8px; cursor: pointer; text-align: left;
}
.gv-add-menu button:hover { background: rgba(143, 123, 255, .14); color: #fff; }

.gv-editor-body { flex: 1 1 auto; min-height: 0; position: relative; }
/* 侧栏悬浮于舞台之上：不挤压舞台，保证编辑所见即游戏所得。 */
.gv-editor-side {
  position: absolute; top: 0; bottom: 0; z-index: 20;
  display: flex; flex-direction: column; overflow: hidden;
  background: rgba(13, 16, 32, .84);
  backdrop-filter: blur(8px) saturate(1.1);
  box-shadow: 0 0 28px rgba(0, 0, 0, .38);
  transition: width .18s cubic-bezier(.16, 1, .3, 1), visibility 0s linear .18s;
}
.gv-editor-tree { left: 0; width: 216px; border-right: 1px solid var(--gv-line-strong); }
.gv-editor-props { right: 0; width: 264px; border-left: 1px solid var(--gv-line-strong); overflow-y: auto; }
/* 边栏隐藏：宽度收拢到 0（保留挂载，状态与动画不丢）。 */
.gv-editor-side.is-collapsed { width: 0 !important; border-left: 0; border-right: 0; visibility: hidden; }
.gv-editor-canvas { position: absolute; inset: 0; display: flex; }
.gv-editor-canvas .gv-stage-wrap { background: radial-gradient(900px 460px at 50% 30%, rgba(30, 36, 70, .5), transparent 70%), #070912; }

/* 元素树 */
.gv-tree { display: flex; flex-direction: column; min-height: 0; }
.gv-tree-root {
  flex: none; display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gv-line-strong);
  font-size: 12px; font-weight: 700; letter-spacing: .16em;
}
.gv-tree-count { margin-left: auto; font-size: 10px; font-weight: 400; color: var(--gv-text-dim); letter-spacing: 0; }
.gv-tree-list { flex: 1 1 auto; overflow-y: auto; padding: 4px; }
.gv-tree-row {
  display: flex; align-items: center; gap: 7px;
  padding: 4px 8px; margin: 1px 0;
  font-size: 12px; color: var(--gv-text);
  cursor: pointer; border: 1px solid transparent;
  transition: background .12s ease, border-color .12s ease;
}
.gv-tree-row:hover { background: rgba(255, 255, 255, .05); }
.gv-tree-row.is-selected { background: rgba(143, 123, 255, .14); border-color: rgba(143, 123, 255, .45); }
.gv-tree-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gv-tree-toggle {
  flex: none; border: 1px solid var(--gv-line-strong); background: transparent;
  color: var(--gv-text-dim); font-size: 10px; width: 18px; height: 18px;
  border-radius: 2px; cursor: pointer; line-height: 1; padding: 0;
}
.gv-tree-toggle:hover { color: #fff; border-color: rgba(143, 123, 255, .6); }
.gv-tree-toggle.is-on { color: #fff; background: rgba(143, 123, 255, .22); border-color: rgba(143, 123, 255, .6); }
.gv-tree-toggle.is-off { opacity: .35; }
.gv-tree-scene { flex: none; border-top: 1px solid var(--gv-line-strong); padding: 8px 12px 12px; }

/* 类型记号（纯 CSS 图形） */
.gv-glyph { flex: none; width: 10px; height: 10px; display: inline-block; }
.gv-glyph-scene { border: 1px solid var(--gv-text-dim); box-shadow: inset 0 0 0 2px var(--gv-panel-2), inset 0 0 0 3px var(--gv-text-dim); }
.gv-glyph-background { background: linear-gradient(135deg, var(--gv-accent-2), var(--gv-accent)); opacity: .9; }
.gv-glyph-character { border: 1px solid var(--gv-accent); border-radius: 50% 50% 40% 40%; height: 11px; }
.gv-glyph-dialogue { border: 1px solid var(--gv-accent-2); border-radius: 2px; }
.gv-glyph-dialogue-text { border: 1px solid var(--gv-accent-2); border-radius: 2px; box-shadow: inset 0 -4px 0 rgba(79, 140, 255, .55); }
.gv-glyph-speaker-name { border: 1px solid var(--gv-accent); border-left-width: 3px; border-radius: 2px; }
.gv-glyph-text { background: linear-gradient(90deg, var(--gv-text-dim) 0 70%, transparent 70%); }
.gv-glyph-button { border: 1px solid var(--gv-accent-2); border-radius: 5px; }
.gv-glyph-image { border: 1px solid var(--gv-accent-2); background: linear-gradient(160deg, transparent 52%, var(--gv-accent) 52% 70%, transparent 70%); }
.gv-glyph-rect { border: 1px solid var(--gv-text-dim); }
.gv-glyph-circle { border: 1px solid var(--gv-accent-red); border-radius: 50%; }
.gv-glyph-decoration { border: 1px dashed var(--gv-text-dim); transform: rotate(45deg) scale(.85); }

/* 属性面板 */
.gv-props { padding: 10px 12px 16px; }
.gv-props-head {
  display: flex; align-items: baseline; gap: 8px;
  padding: 2px 0 8px; margin-bottom: 6px;
  border-bottom: 1px solid var(--gv-line-strong);
}
.gv-props-type {
  flex: none; font-size: 10px; letter-spacing: .2em; color: var(--gv-accent);
  border: 1px solid rgba(143, 123, 255, .5); padding: 0 6px; border-radius: 2px;
}
.gv-props-title { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gv-props-sec {
  margin: 10px 0 4px; padding-bottom: 2px;
  font-size: 10px; letter-spacing: .28em; color: var(--gv-text-dim);
  border-bottom: 1px solid var(--gv-line);
}
.gv-prop-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 3px 0; }
.gv-prop-label { flex: none; font-size: 11px; color: var(--gv-text-dim); min-width: 58px; }
.gv-prop-input {
  width: 108px;
  background: rgba(10, 13, 28, .7);
  border: 1px solid var(--gv-line-strong);
  color: var(--gv-text);
  font-size: 12px; padding: 2px 7px; border-radius: 3px; outline: none;
  font-variant-numeric: tabular-nums;
}
.gv-prop-input:focus { border-color: rgba(143, 123, 255, .6); box-shadow: 0 0 8px rgba(143, 123, 255, .15); }
.gv-prop-row input[type="checkbox"] { accent-color: var(--gv-accent); }
.gv-prop-actions { display: flex; gap: 6px; padding: 4px 0; flex-wrap: wrap; }
.gv-prop-actions .gv-btn { font-size: 11px; padding: 2px 8px; }
.gv-prop-color { display: flex; align-items: center; gap: 6px; width: 108px; }
.gv-prop-color input[type="color"] {
  flex: none; width: 30px; height: 22px; padding: 0; border: 1px solid var(--gv-line-strong);
  background: transparent; border-radius: 3px; cursor: pointer;
}
.gv-prop-color-value { flex: 1; font-size: 10px; color: var(--gv-text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.gv-props-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; color: var(--gv-text-dim); text-align: center; }
.gv-props-empty p { margin: 0; font-size: 12px; }
.gv-props-empty-hint { font-size: 11px !important; line-height: 1.7; opacity: .8; }
.gv-props-empty-mark {
  width: 40px; height: 40px; border: 1px dashed rgba(143, 123, 255, .5);
  transform: rotate(45deg);
}

/* 选中框与手柄 */
.gv-sel {
  position: absolute; z-index: 9999; pointer-events: none;
  border: 1px solid var(--gv-accent);
  box-shadow: 0 0 0 1px rgba(143, 123, 255, .25), 0 0 18px rgba(143, 123, 255, .28);
}
.gv-sel-label {
  position: absolute; top: -20px; left: -1px;
  font-size: 10px; letter-spacing: .1em; color: #fff;
  background: rgba(120, 105, 240, .92);
  padding: 1px 8px; white-space: nowrap;
}
.gv-sel-handle {
  position: absolute; width: 10px; height: 10px;
  background: #0a0d1c; border: 1.5px solid var(--gv-accent);
  pointer-events: auto;
}
.gv-sel-handle:hover { background: var(--gv-accent); box-shadow: 0 0 8px rgba(143, 123, 255, .6); }
.gv-sel-rotate {
  position: absolute; top: -40px; left: calc(50% - 5px);
  width: 10px; height: 10px; border-radius: 50%;
  background: #0a0d1c; border: 1.5px solid var(--gv-accent-2);
  pointer-events: auto; cursor: grab;
}
.gv-sel-rotate::before {
  content: ''; position: absolute; left: 50%; top: 10px;
  width: 1px; height: 28px; background: rgba(79, 140, 255, .5);
  transform: translateX(-50%);
}
.gv-sel-rotate:hover { background: var(--gv-accent-2); }

/* ---------- 动画 ---------- */
@keyframes gv-blink { 50% { opacity: 0; } }
@keyframes gv-pulse { 0%, 100% { opacity: .4; } 50% { opacity: 1; } }
@keyframes gv-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes gv-slide-in { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes gv-rise { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* ---------- 设置选项卡（渲染在设置面板内，GAL 根节点之外 → 无作用域） ---------- */
.gvsv-tab {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px;
  font-family: inherit;
}
.gvsv-head { display: flex; flex-direction: column; gap: 4px; }
.gvsv-title { font-size: 15px; font-weight: 700; letter-spacing: .08em; }
.gvsv-desc { font-size: 12px; opacity: .7; line-height: 1.7; }
.gvsv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 4px;
}
.gvsv-label { font-size: 13px; font-weight: 600; }
.gvsv-hint { flex: 1; font-size: 11px; opacity: .6; line-height: 1.6; }
.gvsv-row input[type="checkbox"] { accent-color: #8f7bff; width: 16px; height: 16px; }

/* ---------- AnimaVN 纸质皮肤：设置浮层与选择框（仅游戏模式） ---------- */
[data-gal-mode='game'] .gv-settings {
  width: 322px;
  background: linear-gradient(180deg, rgba(250, 247, 240, .97), rgba(242, 236, 224, .96));
  border: 1px solid rgba(122, 108, 88, .32);
  border-radius: 14px;
  box-shadow: 0 18px 46px rgba(38, 30, 18, .26);
  color: #1e222a;
  padding: 14px 18px 12px;
}
[data-gal-mode='game'] .gv-settings-head {
  border-bottom: 1px solid rgba(122, 108, 88, .24);
  color: #1e222a;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .18em;
}
[data-gal-mode='game'] .gv-settings-row { color: #6b6a66; font-size: 12.5px; }
[data-gal-mode='game'] .gv-settings-row select,
[data-gal-mode='game'] .gv-settings-row input[type='text'] {
  width: 180px;
  background: rgba(255, 255, 255, .94);
  border: 1px solid rgba(122, 108, 88, .30);
  border-radius: 8px;
  color: #1e222a;
  font-size: 12.5px;
  padding: 5px 10px;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}
[data-gal-mode='game'] .gv-settings-row select:focus,
[data-gal-mode='game'] .gv-settings-row input[type='text']:focus {
  border-color: rgba(31, 111, 178, .55);
  box-shadow: 0 0 0 3px rgba(31, 111, 178, .10);
}
[data-gal-mode='game'] .gv-settings-row option { background: #fbf8f2; color: #1e222a; }
[data-gal-mode='game'] .gv-settings-hint { color: #8a8272; }
[data-gal-mode='game'] .gv-settings .gv-btn {
  background: #e7eef7;
  border: 1px solid rgba(31, 111, 178, .30);
  border-radius: 999px;
  color: #1f5c8f;
  padding: 3px 14px;
}
[data-gal-mode='game'] .gv-settings .gv-btn:hover:not(:disabled) {
  background: #dce8f6;
  border-color: rgba(31, 111, 178, .45);
  box-shadow: none;
  color: #17466c;
}

/* ---------- 待决交互（批准 / 提问）：纸质卡片 ---------- */
.gv-stage-area { position: relative; }
.gv-pending-layer {
  position: absolute; inset: 0; z-index: 40;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.gv-pending-veil {
  position: absolute; inset: 0;
  background: radial-gradient(72% 62% at 50% 45%, rgba(20, 16, 10, .14), rgba(20, 16, 10, .38));
  backdrop-filter: blur(1.5px) saturate(1.06);
}
.gv-pending-stack {
  position: relative;
  display: flex; flex-direction: column; gap: 12px;
  width: min(680px, 92%); max-height: 100%;
  overflow: auto;
  scrollbar-width: thin;
}
.gv-pending-card {
  background: linear-gradient(180deg, rgba(250, 247, 240, .97), rgba(242, 236, 224, .96));
  border: 1px solid rgba(122, 108, 88, .32);
  border-radius: 14px;
  padding: 22px 24px 18px;
  box-shadow: 0 18px 46px rgba(38, 30, 18, .26), inset 0 0 0 1px rgba(255, 255, 255, .5);
  color: #1e222a;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif;
  animation: gv-pending-in .18s ease-out;
}
/* 等待决定的强调边（批准/提问未答时）：金色细亮边。 */
.gv-pending-card.is-awaiting {
  border-color: rgba(190, 153, 82, .72);
  box-shadow: 0 18px 46px rgba(38, 30, 18, .26), inset 0 0 0 1px rgba(214, 186, 128, .40);
}
@keyframes gv-pending-in {
  from { opacity: 0; transform: translateY(6px) scale(.985); }
  to { opacity: 1; transform: none; }
}
.gv-pending-head { display: flex; flex-direction: column; gap: 6px; }
.gv-pending-eyebrow {
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 10.5px; letter-spacing: .26em; text-transform: uppercase;
  color: #8a8272;
}
.gv-pending-head-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.gv-pending-title {
  margin: 0; font-size: 21px; font-weight: 600; line-height: 1.45;
  color: #1e222a; letter-spacing: .01em;
}
.gv-pending-tag {
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 11px; letter-spacing: .04em;
  color: #7a5a22; background: rgba(197, 164, 104, .16);
  border: 1px solid rgba(191, 154, 82, .40);
  border-radius: 999px; padding: 2px 9px;
}
.gv-pending-detail { margin: 2px 0 0; font-size: 14.5px; line-height: 1.7; color: #4a4a46; }
.gv-pending-reason {
  margin: 4px 0 0; font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 11.5px; line-height: 1.6; color: #7a7568; word-break: break-word;
}
.gv-pending-rule {
  height: 1px; margin: 14px 0 12px;
  background: linear-gradient(90deg, rgba(197, 164, 104, .04), rgba(197, 164, 104, .46), rgba(197, 164, 104, .04));
}
/* 选项区：整块列表，纸面本身不换色（只靠发丝分隔），选中才上茶金色。 */
.gv-pending-options {
  display: flex; flex-direction: column;
  border: 1px solid rgba(122, 108, 88, .20);
  border-radius: 10px;
  background: rgba(255, 252, 245, .55);
  overflow: hidden;
}
.gv-pending-option {
  display: block; width: 100%; text-align: left; cursor: pointer;
  font-family: inherit; font-size: 15.5px; line-height: 1.5;
  color: #2a2925;
  background: transparent;
  border: none; border-top: 1px solid rgba(122, 108, 88, .14);
  border-radius: 0;
  padding: 11px 16px;
  transition: background .14s ease, color .14s ease;
}
.gv-pending-option:first-child { border-top: none; }
.gv-pending-option:hover:not(:disabled) { background: rgba(176, 138, 74, .10); }
.gv-pending-option:disabled { opacity: .5; cursor: default; }
.gv-pending-option.is-choice { position: relative; padding-left: 34px; }
.gv-pending-option.is-choice::before {
  content: ""; position: absolute; left: 15px; top: 50%;
  width: 9px; height: 9px; margin-top: -4.5px;
  border-radius: 50%; border: 1.5px solid rgba(122, 108, 88, .42);
  transition: background .14s ease, border-color .14s ease, box-shadow .14s ease;
}
.gv-pending-option.is-choice.is-selected {
  background: rgba(197, 164, 104, .22); color: #5c451f; font-weight: 600;
  box-shadow: inset 3px 0 #bf9a52;
}
.gv-pending-option.is-choice.is-selected::before {
  background: #b3893c; border-color: #b3893c;
  box-shadow: 0 0 0 3px rgba(197, 164, 104, .26);
}
/* 批准卡的「允许一次」：不是整条实心色带，只给淡蓝底 + 左侧细竖线。 */
.gv-pending-option.is-affirm {
  color: #5c451f; font-weight: 600;
  background: rgba(197, 164, 104, .16);
  box-shadow: inset 3px 0 #bf9a52;
}
.gv-pending-option.is-affirm:hover:not(:disabled) { background: rgba(197, 164, 104, .26); }
.gv-pending-answer { margin: 12px 0 0; padding: 0 2px; }
.gv-pending-answer-input {
  width: 100%; box-sizing: border-box;
  font-family: inherit; font-size: 15px; color: #1e222a;
  background: transparent;
  border: none; border-bottom: 1px solid rgba(122, 108, 88, .30);
  border-radius: 0; padding: 9px 2px;
  outline: none;
  transition: border-color .14s ease;
}
.gv-pending-answer-input::placeholder { color: #a09a8c; }
.gv-pending-answer-input:focus { border-bottom-color: rgba(31, 111, 178, .55); }
/* 脚部：左边两个文字链，右边一颗藏蓝胶囊（下一题 / 确定）。 */
.gv-pending-foot {
  display: flex; align-items: center; gap: 16px;
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid rgba(122, 108, 88, .18);
}
.gv-pending-link {
  font-family: inherit; font-size: 13px; cursor: pointer;
  color: #6b6a66; background: none; border: none; padding: 0;
  border-bottom: 1px solid transparent;
  transition: color .14s ease, border-color .14s ease;
}
.gv-pending-link:hover:not(:disabled) { color: #8a6222; border-bottom-color: rgba(191, 154, 82, .55); }
.gv-pending-link:disabled { opacity: .5; cursor: default; }
.gv-pending-submit {
  margin-left: auto;
  font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer;
  letter-spacing: .10em;
  color: #2b2008; background: linear-gradient(180deg, #d3ad63, #b08a36);
  border: 1px solid rgba(133, 100, 38, .50);
  border-radius: 999px; padding: 7px 22px;
  box-shadow: 0 6px 14px rgba(150, 115, 50, .26);
  transition: background .14s ease, box-shadow .14s ease, transform .14s ease;
}
.gv-pending-submit:hover:not(:disabled) {
  background: linear-gradient(180deg, #dcb872, #bb9440);
  box-shadow: 0 8px 18px rgba(150, 115, 50, .32);
}
.gv-pending-submit:active:not(:disabled) { transform: translateY(1px); }
.gv-pending-submit:disabled { opacity: .5; cursor: default; box-shadow: none; }
.gv-pending-error {
  margin: 10px 0 0; font-size: 12.5px; line-height: 1.6; color: #a8423a;
}

/* ---------------- 立绘姿态切换 / 表情气泡 ---------------- */
/* 姿态图（scripts/set-poses.py 输出，统一 900x1500 画布）：交叉淡入，旧图留 520ms 垫底，
 * 避免切换瞬间透出背景。 */
[data-gal-mode='game'] .gv-el-character .gv-char-img.is-pose { animation: gv-pose-in .52s ease-out both; }
[data-gal-mode='game'] .gv-el-character .gv-char-img.is-leaving {
  animation: gv-pose-out .52s ease-out both;
  pointer-events: none;
}
@keyframes gv-pose-in {
  from { opacity: 0; transform: translateY(7px) scale(.994); }
  to { opacity: 1; transform: none; }
}
@keyframes gv-pose-out { from { opacity: 1; } to { opacity: 0; } }

/* 表情气泡：说话时在她肩头飘一个小圆头像（6 个表情素材）。 */
.gv-char-face {
  position: absolute;
  right: 0;
  top: 5%;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  background: #fdfaf4;
  border: 2px solid rgba(255, 255, 255, .9);
  box-shadow: 0 8px 20px rgba(40, 30, 18, .3);
  pointer-events: none;
  z-index: 4;
  animation: gv-face-in .34s cubic-bezier(.2, .9, .3, 1.2) both;
}
@keyframes gv-face-in {
  from { opacity: 0; transform: scale(.72) translateY(8px); }
  to { opacity: 1; transform: none; }
}

/* 坐/卧姿态的投影要更宽更低，Q 版更小 —— 否则脚下一小圈灰饼会显得人物悬浮。 */
[data-gal-mode='game'] .gv-el-character[data-pose='kneel']::after,
[data-gal-mode='game'] .gv-el-character[data-pose='curl']::after {
  width: 80%;
  height: 38px;
  bottom: 30px;
}
[data-gal-mode='game'] .gv-el-character[data-pose='sleep']::after {
  width: 96%;
  height: 34px;
  bottom: 24px;
}
[data-gal-mode='game'] .gv-el-character[data-pose='chibi']::after {
  width: 46%;
  height: 20px;
  bottom: 26px;
}
/* 坐着时别再用站立那种上下浮动，换成很轻的呼吸。 */
[data-gal-mode='game'] .gv-el-character[data-pose='kneel'] .gv-char,
[data-gal-mode='game'] .gv-el-character[data-pose='curl'] .gv-char,
[data-gal-mode='game'] .gv-el-character[data-pose='sleep'] .gv-char {
  animation: gv-char-breathe 6.2s ease-in-out infinite;
}
@keyframes gv-char-breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.004); }
}
[data-gal-mode='game'] .gv-el-character[data-pose='chibi'] .gv-char { animation: gv-char-bounce 2.6s ease-in-out infinite; }
@keyframes gv-char-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  [data-gal-view] .gv-el-character .gv-char { animation: none; }
  [data-gal-view] .gv-char-img.is-pose,
  [data-gal-view] .gv-char-img.is-leaving,
  [data-gal-view] .gv-char-face { animation: none; }
  [data-gal-view] .gv-dialogue-caret { animation: none; }
  [data-gal-view] .gv-pending-card { animation: none; }
}
`
