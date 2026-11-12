# AGENTS.md

This file provides guidance to AI coding agents when working in this package.

## What this is

`@mini-dev/safe-area` 是小程序安全区适配逻辑库：把 wx 等平台 API 归一成数值接口，供 `safe-area-top`、`navigation-bar` 等组件库消费。纯逻辑库，零运行时依赖。

## Commands

- Test: `pnpm --filter @mini-dev/safe-area test` (jest + esbuild transform)
- Single test: `pnpm --filter @mini-dev/safe-area exec jest -t "<test name>"`
- Build: `pnpm --filter @mini-dev/safe-area build` (tsdown → `dist/cjs` + `dist/esm`，各自带 d.ts)
- Dist smoke: `pnpm --filter @mini-dev/safe-area test:dist`
- Typecheck: `pnpm --filter @mini-dev/safe-area typecheck`（含 tests 目录）

## Architecture

- `src/types.ts` 类型定义（`RawSafeAreaData` / `NormalizedSafeAreaData` 为内部契约，不进公共导出；公共类型为 `SafeAreaInfo` / `NavBarMetrics` / `Rect` / `PlatformId` / `RuntimePlatform`）；`src/metrics.ts` 纯派生计算（safe-area 链指标、导航区指标、原始数据归一化），无平台 API 依赖，可直接单测。
- API 面按链对齐：`getSafeAreaInfo()` 承载 safe-area 链（`safeAreaTop` / `bottomInset` / `useCSSSafeAreaEnv` 均为其顶层字段）；`getNavBarMetrics()` 只承载导航栏链（`statusBarHeight` / `barHeight` / `capsule` / `capsuleRightGap`），两链无共享派生值，不要把 safe-area 链字段挂回 NavBarMetrics。
- `src/platforms/index.ts` 平台分发层：适配器数组（每项带 `globalName`，无运行时的错误消息由 `describeExpectedRuntimes()` 动态生成）+ 运行时探测（wx 存在 → wechat）。加端（支付宝/抖音）只在此数组追加，消费者 API 不变。
- `src/platforms/wechat.ts` 微信实现：`wx.getWindowInfo` / `wx.getDeviceInfo` / `wx.getMenuButtonBoundingClientRect`，带防御（API 缺失、胶囊零尺寸返回 null、`safeArea` 运行时可能为 null 原样透传给归一化层、`platform` 非字符串归一为 `unknown`）。
- 归一化防御（`normalizeRawSafeAreaData`，集中在本层）：窗口宽高非有限抛错；`safeArea` null / 非有限 / 零尺寸时合成回退矩形（`top` 取 `statusBarHeight` 近似、`bottom` 取 `windowHeight`）；`statusBarHeight` 非有限归零。消费方无需重复兜底。
- 双轨经验（核心领域知识）：iOS 真机 `env(safe-area-inset-top)` 可用，Android/devtools 必须走 JS 数值内联；HarmonyOS NEXT 与未识别平台（`unknown`）的 `env()` 行为不可假设，均保守走 JS 轨（`useCSSSafeAreaEnv = false`，危害不对称下的保守方向：JS 轨最坏情况等价 CSS 轨最佳情况）；windows/mac 桌面端未经验证但无顶部 inset（两轨一致为 0），维持 CSS 轨。平台归一化识别 `harmony` / `harmonyos` / `ohos` → `harmony`，鸿蒙端原始返回值以真机为准。胶囊锚点经验：胶囊由客户端参照 `statusBarHeight` 定位，真机实测 `statusBarHeight` 与 `safeArea.top` 可能不一致，`barHeight` 推导以 `statusBarHeight` 为锚；`useCSSSafeAreaEnv` 的消费方是 safe-area-top（safe-area-bottom 不消费判定、恒 JS 内联 `bottomInset`），`statusbar-safe-top` 与 navigation-bar 系均以 `statusBarHeight` 为锚、不消费该判定。

## Testing conventions

平台探测在调用时读取全局 `wx`（非模块加载时捕获），测试直接 set/delete `globalThis.wx`，无需 `jest.resetModules`。派生逻辑的用例放在 `tests/metrics.test.ts`（纯函数），平台适配用例放在 `tests/platform.test.ts`（stub 全局）。

## Build conventions

双格式产物（`dist/cjs` + `dist/esm`），`.js` 同名后缀靠目录级 `package.json` 的 type 标记区分；`miniprogram` 字段指向完整 CJS 入口文件路径。每个 build pass 显式 `target: 'es2015'`，dts 随各自 pass 生成且 `dts.sourcemap` 与顶层 `sourcemap` 保持一致。
