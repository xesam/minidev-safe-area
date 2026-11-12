# AGENTS.md

This file provides guidance to AI coding agents when working in this package.

## What this is

`@mini-dev/safe-area-ui` 是小程序安全区与导航栏组件库（源码直发，无构建），五个对等组件平铺在 `libs/` 下：

- `safe-area-top` / `safe-area-bottom` —— 安全区占位容器（视口遮挡语义：`safeArea.top` / `bottomInset`），走共享基座 `_Component`；
- `statusbar-safe-top` —— 状态栏锚点占位容器（`padding-top = statusBarHeight`，与胶囊/导航链同锚），走共享基座 `_Component`；
- `navigation-bar` / `navigation-bar-base` —— 全新的导航栏组件与纯适配壳（随本包 0.0.1 首发，与任何独立时期的旧项目无关联），**未套 `_Component` 基座**。

适配数据来自 `@mini-dev/safe-area` 逻辑库（workspace 依赖）。

## Commands

- Lint: `pnpm --filter @mini-dev/safe-area-ui lint`
- Typecheck: `pnpm --filter @mini-dev/safe-area-ui typecheck`（只校验 `libs/**/*.d.ts`）
- 本地联调：`cd sample-safe-area-ui-wechat && npm install`，微信开发者工具打开该目录 → 构建 npm → 预览

## Architecture

- 五个对等组件各占一个目录：`libs/safe-area-top/`、`libs/safe-area-bottom/`、`libs/statusbar-safe-top/`、`libs/navigation-bar/`、`libs/navigation-bar-base/`，消费路径 `@mini-dev/safe-area-ui/<name>`（构建 npm 平铺 `libs/`，无 `libs/` 前缀）。
- `libs/_Component.js` 共享基座：注入 `externalClasses: ['mini-class','ui-class','ext-class']`、`virtualHost`、`styleIsolation: 'isolated'`、`multipleSlots`、`pureDataPattern: /^\$_/`。`safe-area-top` / `safe-area-bottom` 经由它注册；`navigation-bar` 系组件直接 `Component()`，`styleIsolation: 'apply-shared'` 是其自身行为面，不要"顺手统一"。
- 页面样式进入 `_Component` 系组件只有外部样式类一条通道：wxml 里**字面引用** `ext-class` / `mini-class` / `ui-class`；类名插值（`class="... {{extClass}}"`）在 isolated 下不生效，是历史坑，不要再引入。
- `libs/index.js` 纯 JS（不注册组件），只导出 `_Component` 供 JS 消费者二次封装；也是包 `main` 入口。
- 顶部双轨：safe-area-top 的 wxss 常态 `padding-top: env(safe-area-inset-top, 0px)`——CSS 轨（ios/windows/mac）下是值提供者，JS 轨（android/devtools/harmony/unknown）下仅为 setData 生效前首帧的近似与 JS 失效兜底；JS 轨时 attached 里用 `getSafeAreaInfo().safeAreaTop` 拼内联样式覆盖，判定字段同源 `getSafeAreaInfo().useCSSSafeAreaEnv`（白名单 ios/windows/mac，未识别平台保守走 JS 轨）。safe-area-bottom：不消费该判定，wxss `env(safe-area-inset-bottom)` 兜底，attached 里 JS 数值内联 `bottomInset` 为主。
- `statusbar-safe-top`：`_Component` 基座占位组件，`padding-top` 恒由 JS 内联 `getSafeAreaInfo().statusBarHeight`（状态栏锚点，无 CSS 等价物，无双轨）；wxss `env()` 仅作首帧近似与未执行兜底。窗口旋转双通道与其他组件一致。
- navigation-bar 双入口（`navigation-bar` / `navigation-bar-base`）的 `attached` 都调用 `getNavBarMetrics()`：`androidBar` 判定用 `runtimePlatform === 'android'`（正向断言；wxml 类 token `android-bar` / `default-bar` 仅切换静态 `--height` 48/44 的首帧近似与 JS 失效兜底，运行时被 `heightVar` 内联覆盖，两组件 data 初值统一 `false` 即首帧全按 44 家族近似；`is*` 布尔族已从库结果中移除）、内容行高度用 `barHeight` 内联注入 `--height`（以 `statusBarHeight` 为锚的胶囊居中推导）、胶囊避让宽度用 `capsuleRightGap`、`statusBarTop` 内联样式（`height` / `padding-top` 均取 `statusBarHeight`，与胶囊定位基准一致）两条轨道无条件生成——navigation-bar 系不消费 `useCSSSafeAreaEnv`。
- navigation-bar 样式层：wxss 里的 `--height` 静态值（`default-bar` 44 / `android-bar` 48）与 `env(safe-area-inset-top)` 均仅为 setData 生效前首帧的近似与 JS 失效兜底；运行时以 `barHeight`（`--height`）与 `statusBarHeight`（`statusBarTop` 的 `height` / `padding-top`）内联覆盖。`show` 隐藏语义：`animated` 走 `opacity: 0` + `pointer-events: none`（占位保留、不可误触），非 `animated` 走 `visibility: hidden`（占位保留），两条路径均不塌陷，与 README「隐藏时仍保留高度占位」的承诺一致。
- `autoNavIcon` 在 `attached` 里按 `getCurrentPages().length` 决定 back/homeButton 形态（栈深 1 → home icon，判定一次、不监听运行中栈变化，开启时覆盖手动 back/homeButton）；home icon 点击纯事件驱动（`onTapHome` 只发 `home` 事件，无任何内置跳转，页面跳转由消费方在事件中实现）；返回按钮的 `navigateBack` 带 `fail` 日志；事件契约均为通知语义、非拦截语义。
- 窗口尺寸变化（旋转）：五个组件在 `attached` 注册 `wx.onWindowResize` → `_updateLayout()` 重算、`detached` 注销，并叠加 `pageLifetimes.resize` 兜底双通道；`onWindowResize`/`offWindowResize` 带 `typeof` 防护（老基础库缺失该 API 时降级为仅 `pageLifetimes` 单通道，不抛错）。`_updateLayout` 整体 `try/catch`：取数异常（无运行时 / API 缺失 / 窗口尺寸非法）时停留 wxss 静态兜底并 `console.error`，不中断组件生命周期。取数逻辑只存在于 `_updateLayout`，`attached` 不留副本。开发者工具模拟器「旋转」不派发 resize 事件（实测差异），示例 `pages/index` 提供手动重算入口（`onRecompute`：刷新数值卡片 + `selectComponent` 触发组件重算），页面 `onResize` 仅真机生效。
- 源码 CJS（`require`/`module.exports`），eslint `sourceType: 'commonjs'`。

## Conventions

- 无单测、无构建——组件行为只能靠 sample 真机/模拟器预览验证（组件库模板惯例）。
- README §3 的属性表/事件表/插槽表是 API 事实来源：改 `properties`/`triggerEvent` 必须同步改表。
- navigation-bar 系组件随本包 0.0.1 首发，无历史版本记录；本包后续变更走 changesets。
- sample 依赖用 `file:` 协议指向本地包；`@mini-dev/safe-area` 通过 npm `overrides` 固定到本地路径（发布前 registry 上没有该包）。
