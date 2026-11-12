# AGENTS.md

本仓库的 AI 协作指令唯一权威文件。各包的细节见各包自己的 `AGENTS.md`；本文只维护 monorepo 级事实。

## What this is

`@mini-dev/safe-area` monorepo：小程序安全区适配能力的两个包 + 一个微信示例工程。核心是把"安全区 / 状态栏 / 胶囊按钮"的适配数值收敛到一份逻辑库，组件库只做布局决策。

- `packages/safe-area` —— 逻辑库（TypeScript，tsdown 双格式 CJS+ESM，jest 单测，`miniprogram` 指向 `dist/cjs/index.js`）
- `packages/safe-area-ui` —— 组件库（源码直发，五个对等组件：`safe-area-top` / `safe-area-bottom` / `statusbar-safe-top` 占位容器 + `navigation-bar` / `navigation-bar-base` 导航栏组件；navigation-bar 系组件随本包 0.0.1 首发，无先前版本历史）
- `sample-safe-area-ui-wechat/` —— 独立示例工程（不属于 workspace，`npm install`）

## Commands

```shell
pnpm install                                   # workspace 安装（pnpm 12，allowBuilds 已配置 esbuild）
pnpm --filter @mini-dev/safe-area build        # tsdown 双格式构建（dist/cjs + dist/esm，各自带 d.ts）
pnpm --filter @mini-dev/safe-area test         # jest 单测
pnpm --filter @mini-dev/safe-area test:dist    # 双格式产物冒烟
pnpm --filter <pkg> lint / typecheck            # 各包静态校验
pnpm lint                                      # 全仓 eslint
pnpm changeset                                 # 生成变更集（发布流程）
pnpm publish:all                               # 直发 packages/ 下全部包到 npm（pnpm publish，不经 changesets；scoped access 由各包 publishConfig 提供）
```

本地联调（组件行为只能靠示例工程预览）：`cd sample-xxx-wechat && npm install`，微信开发者工具打开该目录 → 工具 → 构建 npm。CLI 自动化：

```shell
/Applications/wechatwebdevtools.app/Contents/MacOS/cli build-npm --project <sample 绝对路径>
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project <sample 绝对路径>
```

## Architecture

- **平台分发层**：`packages/safe-area/src/platforms/` —— `wechat.ts` 是当前唯一实现，`index.ts` 按运行时全局探测（`wx`）分发。加端（支付宝/抖音）只往 `platforms/` 加适配器并注册进数组，消费者 API 不变。
- **双轨经验（核心领域知识）**：iOS 真机的顶部安全区可用 CSS `env(safe-area-inset-top)`；Android 真机与开发者工具的 `env()` 不可靠，HarmonyOS NEXT 与未识别平台（`unknown`）不可假设，均必须用 JS 数值内联；windows/mac 桌面端未经验证但无顶部 inset（两轨一致为 0），维持 CSS 轨。判定字段是 `getSafeAreaInfo().useCSSSafeAreaEnv`（白名单 ios / windows / mac，其余一律 JS 轨），消费方是 safe-area-top（safe-area 链唯一双轨消费者；safe-area-bottom 不消费判定、恒 JS 内联 `bottomInset`）；navigation-bar 系组件不消费此判定，内容栏两轨统一 JS 内联 `statusBarHeight`。两个包的行为都依赖此口径，改动需全链路同步并真机回归。
- **胶囊锚点经验（核心领域知识）**：胶囊由客户端参照 `statusBarHeight` 定位；真机实测（iOS）`statusBarHeight` 与 `safeArea.top` 可能不一致（两条独立取值路径，无恒等保证）。因此 navigation-bar 系组件的内容栏高度推导与两条轨道的内联 `padding-top` 均以 `statusBarHeight` 为锚（居中由构造成立；wxss 的 `env()` 仅作首帧近似与未执行兜底）；`safeAreaTop`（`getSafeAreaInfo()` 顶层字段）语义仅保留给 safe-area-top/bottom，`statusbar-safe-top` 与 navigation-bar 系同以 `statusBarHeight` 为锚。公式层权威表述见 `packages/safe-area/README.md` §2.5。
- **防御**：`wechat.ts` 的 `readSystemInfo` 优先 `getWindowInfo`/`getDeviceInfo`（基础库 2.20+），缺失时降级 `getSystemInfoSync`，都没有则抛带上下文的错误；原始数据经 metrics 层 `normalizeRawSafeAreaData` 归一（窗口尺寸非法抛错、`safeArea` 无效合成回退矩形、`statusBarHeight` 非有限归零），`platform` 非字符串或未收录值经适配器 `normalizeRuntimePlatform` 归一为 `unknown`——防御集中在逻辑库，组件不重复写。无运行时的错误消息由适配器数组动态生成。
- **navigation-bar 组件契约**：平铺在 `packages/safe-area-ui/libs/navigation-bar/` 与 `libs/navigation-bar-base/`，构建 npm 后消费路径 `@mini-dev/safe-area-ui/navigation-bar` 与 `/navigation-bar-base`（无 `libs/` 前缀）；样式里的 `--height` 由组件 `attached` 时用 `getNavBarMetrics().barHeight`（`capsule.top − statusBarHeight` 间隙镜像推导，锚点与胶囊定位基准一致，胶囊垂直居中）内联注入；内容栏顶部内边距两轨统一内联 `statusBarHeight`（与锚点同源），wxss 里的 `env(safe-area-inset-top)` 与静态 44/48 仅承担 setData 生效前首帧的近似与 JS 失效兜底；home icon 纯事件驱动（`onTapHome` 只发 `home` 事件，无内置跳转，跳转由消费方实现）；不套 `_Component` 基座。

## Conventions

- **提交**：约定式提交（commitlint 强制），scope 用包名短称（safe-area / safe-area-ui）。
- **版本**：首发版本已写在各包 `package.json`（safe-area 0.0.1 / safe-area-ui 0.0.1；navigation-bar 系组件为本包全新实现，0.0.1 首发即首个版本，与任何独立时期的旧项目无版本延续关系），首发直接 `pnpm release`（changesets publish，access:public 在根 `.changeset/config.json`）；之后的一切变更先 `pnpm changeset` 再 release。
- **示例工程依赖**：sample 不进 workspace；依赖用 `file:../packages/<pkg>`，并用 npm `overrides` 把 `@mini-dev/safe-area` 钉到本地路径（发布前 registry 上没有该包）。
- **源码风格**：逻辑库 ESM + `import type`（verbatimModuleSyntax）；组件库 CJS。eslint 按包继承根配置（小程序全局在根 `globals`）。
- **sample 的 appid**：仓库内 `project.config.json` 留 `your_appid` 占位，真实 appid 写在 gitignore 的 `project.private.config.json`。

## Testing conventions

- 逻辑库：jest + esbuild transform；平台 API 用 `globalThis.wx` stub（库是调用期探测，不需要 resetModules）；纯派生逻辑的用例进 `tests/metrics.test.ts`，平台适配进 `tests/platform.test.ts`。
- 组件库：无单测（模板惯例），回归靠示例工程页面矩阵；真机验证（iOS env() 轨 / Android JS 轨）是发布前硬门槛。

## Known follow-ups

- 真机双轨预览（sample 四页面矩阵各一次 iOS + Android）待执行；回归覆盖：竖屏胶囊上下间隙相等（居中验收主项）、分离机型上 statusbar-safe-top 与 safe-area-top 的取值差异核对、横屏下 `statusBarHeight` 旋转行为与导航栏表现、safe-area 链 `env() ≡ safeArea.top` 同源假设复验（公式体系唯一非构造性假设）。
