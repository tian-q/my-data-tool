# 特会写「首页 + 登录」迁移方案（Vue 3 → Next.js 16）

> 源项目：`E:\gongzuo\AiWriter\aiWriter\web`（Vue 3 + Vite）
> 目标项目：`E:\gongzuo\tehuixie\my-data-tool\apps\web`（Next.js 16 App Router，monorepo）
> 迁移范围：仅**落地页首页** + **登录认证**。两者都是 Web 端独有，桌面端（`apps/desktop`）不包含。

---

## 0. 总原则与约束

### 0.1 必须遵守的既有约定（来自现有 monorepo）

| 约定 | 来源 | 说明 |
|---|---|---|
| Next 16，非传统用法 | `apps/web/AGENTS.md` | **写任何 Next 代码前先查 `node_modules/next/dist/docs/`**，API 与训练数据不同，留意废弃提示 |
| 状态管理用 **Zustand** | `packages/core/src/todo/TodoContext.tsx` | vanilla store + Context Provider 注入，禁止引入 Redux/Vuex 思路 |
| 存储用 **StorageAdapter 依赖倒置** | `packages/core/src/shared/storage/StorageAdapter.ts` | 业务只依赖接口，外壳注入实现 |
| 校验用 **Zod** | `apps/web/env.mjs` | 表单/环境变量校验统一 Zod |
| 代码风格 **Tab 缩进 + Biome** | `biome.json` | 提交前过 Biome，commitlint 约定式提交 |
| 路径别名 `@/*` → `src/*` | `apps/web/tsconfig.json` | 与 Vue 的 `@` 用法一致 |

### 0.2 设计原则

1. **分层清晰**：UI（components）/ 状态（store）/ 副作用封装（hooks）/ 基础设施（lib）/ 静态数据（constants）严格分目录，互不越界。
2. **共用即封装**：HTTP 客户端、Token 管理、Toast、滚动动画、验证码倒计时等跨组件复用的逻辑，一律抽成独立模块，组件只消费、不重复实现。
3. **Web 独有不进 core**：落地页与登录 UI 是 Web 形态（依赖浏览器滚动、Cookie），放 `apps/web`，**不**放 `packages/core`。
4. **小文件、单一职责**：源项目 3533 行的单文件 `index.vue` 必须按「屏」拆分，单文件控制在 ~200 行内。
5. **先确定性、后手感**：登录与首页静态层确定性高，先做；灵魂屏滚动动画手感复杂，最后单独攻坚。

### 0.3 路由与登录落点的既定规则（已拍板，照此执行）

背景：当前 `apps/web/src/app/page.tsx` **不是空脚手架**，它渲染的是 `@app/core` 的 `<TodoApp/>`——`/` 路由已被占用。本次迁移**不含工作台**，目标项目里没有 `/home` 也没有工作台落点（源项目登录成功跳的 `/home` 对应的是源里另一个 1250 行的 `view/homepage/index.vue`，与本次要迁的 3533 行 `view/index.vue` 落地页是两个文件，勿混）。

据此本期按以下规则执行，**不需再向任何人确认**：

1. **落地页接管 `/`**。把现有 `<TodoApp/>` 整体迁到新路由 `app/playground/page.tsx`（即 `/playground`），保留可访问，**不得删除** `@app/core` 的 `TodoApp`。改完 `app/page.tsx` 只渲染 `<LandingPage/>`。
2. **登录成功不做页面跳转**。本期登录/注册/微信成功后，统一只执行「关闭登录弹窗 + 刷新登录态（写入 `store.user`）」，**不要调用 `router.push('/home')` 或任何写死的工作台地址**。唯一例外：URL query 带合法 `redirect`（以 `/` 开头且非 `/`）时，跳该地址。默认落点等工作台迁移后再补。

> 阶段 4/6/7 的相关步骤均已按此规则写好，直接照做即可。

---

## 1. 目标目录结构

迁移完成后 `apps/web/src` 的最终形态：

```
apps/web/src/
├── app/                            # 路由层（Next 文件即路由）
│   ├── layout.tsx                  # 【改】根布局，挂全局 Provider/字体/全局样式
│   ├── providers.tsx               # 【改】客户端 Provider 聚合（Auth + Toast）
│   ├── globals.css                 # 【改】全局样式 + 迁移过来的 CSS 变量/字体
│   ├── page.tsx                    # 【新】首页路由 = 渲染 <LandingPage/>
│   └── auth/
│       └── wechat/
│           └── callback/
│               └── page.tsx        # 【新】微信扫码回调页（对应 Vue auth/wechatCallback.vue）
│
├── components/                     # UI 组件层（按领域分组）
│   ├── landing/                    # 落地页各屏
│   │   ├── LandingPage.tsx         # 顶层组合：拼装所有屏 + 挂登录弹窗
│   │   ├── SiteNav.tsx             # 顶部导航
│   │   ├── HeroSection.tsx         # 首屏
│   │   ├── soul/                   # §02 灵魂屏（最复杂，独立子目录）
│   │   │   ├── SoulSection.tsx     # 灵魂屏外壳 + 滚动驱动挂载
│   │   │   ├── MemoryColumn.tsx    # 左栏：长期记忆
│   │   │   ├── ChatColumn.tsx      # 中栏：协作对话
│   │   │   ├── DocColumn.tsx       # 右栏：成品文档
│   │   │   ├── BeamSvg.tsx         # SVG 光束
│   │   │   └── soulTimeline.ts     # 滚动区间状态机（源 index.vue 的 R 对象 + 进度函数）
│   │   ├── MomentsSection.tsx      # §03 四个时刻时间轴
│   │   ├── ManifestoSection.tsx    # §04 节奏切换 + 底线承诺
│   │   ├── SiteFooter.tsx          # 页脚
│   │   └── FloatCta.tsx            # 右下角浮动 CTA
│   │
│   ├── auth/                       # 登录认证 UI
│   │   ├── LoginDialog.tsx         # 弹窗外壳 + mode 状态机（对应 LoginParallax3D.vue）
│   │   ├── PasswordLoginForm.tsx   # 密码登录
│   │   ├── SmsLoginForm.tsx        # 短信登录
│   │   ├── RegisterForm.tsx        # 注册
│   │   ├── ResetPasswordForm.tsx   # 重置密码
│   │   ├── WechatQrPanel.tsx       # 微信扫码出码（对应 WechatQrCard.vue）
│   │   ├── WechatBindPhoneForm.tsx # 第 6 种模式：扫码后绑手机完成注册/登录
│   │   └── fields/                 # 表单复用控件
│   │       ├── TextField.tsx       # 带浮动 label 的输入框
│   │       └── SmsCodeField.tsx    # 验证码输入 + 倒计时按钮
│   │
│   └── ui/                         # 跨领域通用基础件
│       ├── Button.tsx
│       └── Icon.tsx
│
├── store/                          # 状态层（Zustand，对齐 core 模式）
│   └── auth/
│       ├── authStore.ts            # 登录态 store：userInfo + 登录/登出 action
│       ├── AuthProvider.tsx        # Context 注入 + 启动时 refresh（对应 main.js initAuthState）
│       └── useAuth.ts              # 选择器 hook：isLoggedIn / userInfo / actions
│
├── lib/                            # 基础设施层（框架无关，可单测）
│   ├── webStorage.ts               # 【已有】StorageAdapter 浏览器实现
│   ├── http/
│   │   ├── client.ts               # axios 实例 + 请求/响应拦截器（refresh 重放队列）
│   │   ├── token.ts                # 内存 access_token 持有者（get/set/clear）
│   │   └── types.ts                # ApiResponse<T>、ApiError、业务码常量 + 两套错误码字典(toast 4 个 + generic 40+)
│   ├── api/
│   │   └── auth.ts                 # 认证接口函数（对应 Vue api/login.js，逐个搬）
│   └── toast.ts                    # Toast 封装（替代 Element Plus ElMessage）
│
├── hooks/                          # 通用 React hooks（副作用封装）
│   ├── useLenis.ts                 # Lenis 平滑滚动初始化/销毁
│   ├── useScrollReveal.ts          # GSAP 入场动画（data-reveal 等价）
│   ├── useScrollScene.ts           # ScrollTrigger pin + 进度驱动封装
│   └── useCooldown.ts              # 验证码倒计时（对应 Vue utils/errorMessage 的 useCooldown）
│
├── constants/                      # 静态数据/文案
│   └── landing.ts                  # moments / rhythms / rules / 段落文案 / 标题等常量
│
└── types/                          # 跨模块共享类型
    └── auth.ts                     # User、AuthState、LoginPayload 等
```

> 标注说明：【已有】=当前已存在；【改】=在脚手架基础上修改；【新】=新建。

### 1.1 各文件夹职责边界（不可越界）

- `app/`：只放路由与布局，**不写业务逻辑**，页面组件薄薄一层转调 `components/`。
- `components/`：只管渲染与交互，状态从 `store/` 取、副作用走 `hooks/`、请求走 `lib/api`。
- `store/`：全局状态与跨页面共享数据，唯一数据源。
- `lib/`：与 React 无关的纯逻辑（HTTP、Token、Toast），保证可被单元测试。
- `hooks/`：把命令式副作用（GSAP/Lenis/计时器）包装成声明式 hook。
- `constants/` `types/`：无副作用的数据与类型，任何层都可引用。

---

## 2. 需要封装的「共用方法」清单

迁移前先明确哪些是公共能力，避免散落复制：

| 封装模块 | 文件 | 职责 | 对应 Vue 来源 |
|---|---|---|---|
| HTTP 客户端 | `lib/http/client.ts` | baseURL `/api`、Bearer 注入、401 自动 refresh + 请求重放队列、统一错误结构 | `utils/axios.js` |
| Token 持有者 | `lib/http/token.ts` | 内存存 `access_token`，`set/get/clear`；被 client 与 store 共用 | `utils/axios.js` 模块变量 |
| 响应类型/业务码 | `lib/http/types.ts` | `ApiResponse<T>`、`ApiError`、`code===0` 成功约定、`1005/1008/1010/1014` 等码常量 | `utils/axios.js` |
| 认证接口 | `lib/api/auth.ts` | `login/register/sendSmsCode/smsLogin/refresh/logout/getMe/wechat...` 全套函数 | `api/login.js` |
| Toast | `lib/toast.ts` | 成功/错误/警告提示，合并同文案，带 requestId | `ElMessage` + `ERROR_TOAST_MAP` |
| 登录态 store | `store/auth/authStore.ts` | `userInfo`、`isLoggedIn`、`setUser/clear`，登出广播 | Vuex `userInfo` + `auth:cleared` 事件 |
| 验证码倒计时 | `hooks/useCooldown.ts` | 60s 倒计时、禁用态、文案 | `utils/errorMessage` useCooldown |
| 平滑滚动 | `hooks/useLenis.ts` | Lenis 初始化、与 ScrollTrigger 联动、卸载清理 | `index.vue` initLenis |
| 入场动画 | `hooks/useScrollReveal.ts` | 元素进入视口的 blur/位移淡入 | `index.vue` initReveal |
| 滚动场景 | `hooks/useScrollScene.ts` | pin 区段 + 0→1 进度回调，供灵魂屏消费 | `index.vue` initSoul/initNav |

---

## 3. 分阶段迁移步骤

> 七个阶段，每阶段可独立验收。建议严格按序，前序是后序的地基。

### 阶段 0 — 准备与依赖

**目的**：把工程地基打好，后面每步都能 `pnpm dev` 跑起来。

**步骤**：

1. 在 `apps/web` 安装迁移所需依赖（在 monorepo 根用 pnpm，指定 web 包）：
   - 运行：`pnpm --filter web add axios gsap lenis sonner zustand qrcode`
   - 说明：`zustand` **必须显式加**——它当前只是 `packages/core` 的依赖、靠透传可用；本方案把 `authStore` 放在 `apps/web/store`（Web 独有），就不能依赖透传，否则 lint/类型会判为「未声明依赖」。`sonner` 替代 ElMessage；`qrcode` 用于微信扫码（与 Vue 一致）。`lenis` 确认需要——源项目 `initLenis()` 在 `onMounted` 真实启用并在卸载时 `lenis.destroy()`，不是空实现。
2. 扩展环境变量校验 `apps/web/env.mjs`，新增后端地址变量（开发用代理，生产用真实域名）：
   - 在 Zod schema 增加 `NEXT_PUBLIC_API_BASE`（默认 `/api`）。
3. 配置开发代理。Next 用 `next.config.mjs` 的 `rewrites` 替代 Vite 的 `server.proxy`：
   - 把 `/api/*` 转发到 `http://124.174.77.199`（对应 Vue `vite.config.js` 的 `VITE_API_TARGET`）。
   - 用环境变量控制目标，`.env.local` 写 `API_PROXY_TARGET=http://124.174.77.199`。
   - 注：Vue 端还代理了 `/ws`（WebSocket），但那是**工作台**用的，落地页+登录用不到，本期忽略；**以后迁工作台时记得补** WS 代理。
4. 校对 `tsconfig.json`：确认 `@/*` 别名生效（已有，无需改）。

**验收**：`pnpm --filter web dev` 启动，访问 `localhost:3000` 不报错。

---

### 阶段 1 — 基础设施层（lib）

**目的**：把与框架无关的 HTTP / Token / Toast / 类型先立起来，登录与首页都依赖它。

**步骤**：

1. **`lib/http/types.ts`** — 定义统一契约：
   - `ApiResponse<T> = { code: number; message: string; data: T }`。
   - `ApiError`：`{ status; code; message; data; requestId; toasted? }`。
   - 业务码常量：`AUTH_TOKEN_EXPIRED = 1005 | 1008`、`AUTH_REVOKED = 1010`、`AUTH_FORCED_LOGOUT = 1014`。
   - **两套错误码字典都要搬，别只搬 4 个**：
     - `ERROR_TOAST_MAP`（4 个，源 `utils/axios.js`：2030/2031/3003/3048）——命中即由拦截器自动弹 toast 的码。
     - `GENERIC_ERROR_MESSAGES`（40+ 个，源 `utils/errorMessage.js`：含 1015/1019/1029/3010–3034 等）——业务 `catch` 里用 `resolveGenericError(code)` 取友好文案。把这个字典 + `resolveGenericError` 一并搬到 `lib/http/types.ts`（或 `lib/http/errorMessages.ts`）。
2. **`lib/http/token.ts`** — 内存 token：
   - 模块级变量 + `getAccessToken/setAccessToken/clearAccessToken`，并提供 `onAuthCleared` 订阅（替代 Vue 的 `window.dispatchEvent('auth:cleared')`，浏览器环境仍可用 CustomEvent）。
3. **`lib/http/client.ts`** — axios 实例 + 拦截器，逐条移植 `utils/axios.js`：
   - 请求拦截：注入 `Authorization: Bearer <token>`。
   - 响应拦截：`code===0` 直接返回 `data`；否则 reject 成 `ApiError`。
   - 401 + `1005/1008` → 调 `/v1/auth/refresh` 换新 token，**重放队列**（`isRefreshing` + `requestQueue` 原样照搬）。
   - 401 + `1010/1014` → 直接 `clearAccessToken()` + 触发登出，避免 refresh 死循环。
   - `withCredentials: true`（refresh cookie 必需）。
4. **`lib/toast.ts`** — 用 `sonner` 包成 `toast.success/error/warning(message, { requestId })`，命中 `ERROR_TOAST_MAP` 的码合并提示。

**验收**：写一个临时按钮调用任意 `lib/api`（下阶段）能跑通拦截链；TypeScript `pnpm --filter web typecheck` 通过。

---

### 阶段 2 — 认证数据层（api + store + types）

**目的**：把登录的「数据与状态」做完，UI 不掺和。

**步骤**：

1. **`types/auth.ts`** — `User`、`LoginPayload`、`RegisterPayload`、`SmsPayload`、`AuthState`。
2. **`lib/api/auth.ts`** — 把 `api/login.js` 的每个函数 1:1 搬过来（`login/register/getMe/refresh/logout/sendSmsCode/smsLogin/smsBindPhone/resetPassword/getWechatQrcodeUrl/bindWechatPhone/unbindWechat`），仅把 `request(...)` 换成 `client(...)`，保留全部 JSDoc 注释（参数约束有业务价值）。
3. **`store/auth/authStore.ts`** — Zustand vanilla store（对齐 `core/createTodoStore` 风格）：
   - state：`user`、派生 `isLoggedIn`（按 Vue：`id/username/nickname/email` 任一存在）。
   - actions：`setUser(user)`、`clearAuth()`（清 token + 清 user + 清相关缓存）。
4. **`store/auth/AuthProvider.tsx`** — `"use client"`，对齐 core 的 `TodoStoreProvider`：
   - 启动时执行 `initAuthState`：`refresh()` → `setAccessToken` → `getMe()` → `setUser`，失败则 `clearAuth()`（对应 `main.js` 的 bootstrap）。
   - 订阅 token 的 `onAuthCleared`，触发 `clearAuth()`。
5. **`store/auth/useAuth.ts`** — `useAuth()` 选择器 hook，暴露 `user/isLoggedIn/setUser/clearAuth`。
6. 在 **`app/providers.tsx`** 里把 `<AuthProvider>` 和 `<Toaster/>`（sonner）加进 Provider 树。

**验收**：刷新页面后，若 refresh cookie 有效，控制台能拿到 `getMe` 结果并写入 store。

---

### 阶段 3 — 登录 UI（components/auth）

**目的**：把登录弹窗（`LoginParallax3D.vue`，1728 行）拆成可维护的 React 组件。

**步骤**：

1. **`components/auth/fields/TextField.tsx`、`SmsCodeField.tsx`** — 先做复用控件：
   - `TextField`：浮动 label + 下划线动效（搬 `px-field` 样式）。
   - `SmsCodeField`：输入框 + 发送按钮，倒计时接 `useCooldown`。
2. **`components/auth/LoginDialog.tsx`** — 弹窗外壳：
   - props：`open` / `onOpenChange`（替代 Vue `v-model`）。
   - `mode` 用 `useState`，**共 6 种**（源组件第 399 行注释自述「6 种模式」）：`login-password | login-sms | register | reset-password | wechat-qr | wechat-bind-phone`。前 3 个有 tab，后 3 个无 tab。移植 `setMode` 逻辑与 tab 切换；注意 `setMode` 离开 `wechat-bind-phone` 时要 `clearWechatBindContext()`。
   - 3D 视差 `onMouseMove` 用 `useState` 存 `cardStyle`。
   - 关闭/ESC/loading 禁用等交互照搬。
3. **六个表单子组件** — 每个 mode 一个文件，各自管自己的表单 state，提交时调 `lib/api/auth` + 成功后 `useAuth().setUser`：
   - `PasswordLoginForm` → `login()`
   - `SmsLoginForm` → `sendSmsCode()` + `smsLogin()`
   - `RegisterForm` → `register()`（用 Zod 校验：用户名 3-50、密码 8-32 含字母数字、手机号 11 位）
   - `ResetPasswordForm` → `sendSmsCode('reset_password')` + `resetPassword()`
   - `WechatQrPanel` → `getWechatQrcodeUrl()` + `qrcode` 渲染 + 轮询/回调
   - `WechatBindPhoneForm`（**第 6 种，别漏**）→ 扫码后若 `need_bind_phone`，进入此态：展示微信昵称/头像 + 手机号 + 验证码，`bindWechatPhone()` 完成注册/登录；1024 冲突时带 `conflict_resolution="merge"` 复用同一 `bind_ticket` 再调一次。
4. **微信两段式**：扫码回调用 `sessionStorage` 暂存 ticket/昵称/头像（与 Vue 一致，键名 `wechat_bind_ticket/nickname/avatar/intent`），进入 `wechat-bind-phone` 态后 `bindWechatPhone()` 完成绑定，用完即 `removeItem` 清理。
5. **样式**：`LoginParallax3D.vue` 的 `<style>` 整段搬到 CSS Module（`LoginDialog.module.css`）或 Tailwind，类名前缀 `px-` 保留以便比对。

**验收**：六种方式都能走通到「成功后 store.user 更新」；表单校验提示正确。

---

### 阶段 4 — 首页静态层（components/landing）

**目的**：把落地页的结构、文案、样式、入场动画做出来（不含灵魂屏复杂滚动）。

**步骤**：

1. **`constants/landing.ts`** — 把 `index.vue` 里的常量数组整体搬出：`moments`、`rhythms`、`rules`、`P_TEXTS`、`TITLE_TEXT`。纯数据，无副作用。
2. **`app/globals.css`** — 把 `index.vue` 的 CSS 变量（`--emerald/--glow/--accent-silver` 等）、字体、`.tk-*` 基础样式迁入；各组件自带样式用 CSS Module。
3. 按屏建组件，每个对应源文件一段 `<section>`：
   - `SiteNav.tsx`（导航，CTA 调 `openLogin`）
   - `HeroSection.tsx`（首屏）
   - `MomentsSection.tsx`（时间轴，消费 `constants` 的 moments）
   - `ManifestoSection.tsx`（节奏 tab 用 `useState` 的 `activePace`；承诺计数器）
   - `SiteFooter.tsx`、`FloatCta.tsx`
4. **`hooks/useLenis.ts`、`hooks/useScrollReveal.ts`** — 封装平滑滚动与入场动画，`"use client"` + `useEffect` 内初始化、卸载清理；处理 SSR 下 `window` 不存在。
5. **`components/landing/LandingPage.tsx`** — 顶层组合：拼装各屏 + 挂 `<LoginDialog>`，并提供 `openLogin()`（统一所有 CTA 入口，对应 Vue 的 `enter()`）。
6. **`app/page.tsx`** — 渲染 `<LandingPage/>`，薄转调。

**验收**：首页除灵魂屏外完整呈现，滚动入场动画正常，所有 CTA 能弹出登录框；已登录点击的行为按 §0.3 决策定（工作台未迁前，先「关弹窗 + 不跳转」，**不要硬编码 `/home`**）。

---

### 阶段 5 — 灵魂屏滚动动画（最难，单独攻坚）

**目的**：复刻 §02 灵魂屏那套「滚动进度驱动的状态机」。

**步骤**：

1. **`components/landing/soul/soulTimeline.ts`** — 把 `index.vue` 的 `R` 区间表、`clamp/sub/eo/curve/setBeamWindow` 等纯函数搬出来（无 DOM，可单测）。
2. **`hooks/useScrollScene.ts`** — 封装 ScrollTrigger：pin 住灵魂屏、把滚动映射成 `progress: 0→1`，回调里调用各栏的渲染函数。
3. **三栏组件**（`MemoryColumn/ChatColumn/DocColumn`）+ `BeamSvg` — 用 `useRef` 持有需要命令式操作的 DOM 节点（Vue 的 ref 数组 → React 的 ref 数组）。
4. **`SoulSection.tsx`** — 在 `useEffect` 里把 `progress` 喂给 `soulTimeline` 计算出的状态，逐帧驱动打字、卡片归档、光束。
5. 逐帧对照原版调参（这步是手感活，预留充足时间）。

> ⚠️ **React Compiler 注意**：目标项目 `next.config.mjs` 开了 `reactCompiler: true`。灵魂屏这套**命令式 GSAP / ref 操作**必须严格守 Rules of React——不要在 render 期间读写 ref 或改 DOM，所有命令式副作用（GSAP timeline、ScrollTrigger、Lenis、`requestAnimationFrame`）都放进 `useEffect`，并在 cleanup 里 `kill()/destroy()`。否则编译器的自动 memo 化可能与手写命令式逻辑打架，出现「动画不触发/重复初始化」。无法规避时，可对该子树用编译器的 `"use no memo"` 指令兜底。

---

### 阶段 6 — 路由守卫与认证联动

**目的**：补齐 Vue 里 `router.beforeEach` + query 触发登录的行为。

**步骤**：

1. **未登录拦截**：目标项目受保护路由（如工作台）在其布局/middleware 里校验 `isLoggedIn`，未登录重定向回 `/?auth=1&redirect=<原路径>`（对应 Vue 守卫）。Next 用 `middleware.ts` 或服务端校验实现。
2. **query 触发登录**：`LandingPage` 读 `useSearchParams()`，命中 `auth=1` / `login=1` / `wechat_bind=1` 时自动打开登录弹窗并清理 query（对应 `index.vue` 的 watch）。
3. **微信回调页** `app/auth/wechat/callback/page.tsx`：处理扫码回跳、写 `sessionStorage`、跳回首页（带 `?wechat_bind=1` 触发绑手机态）。
4. **登录成功跳转**：**按 §0.3 决策**——工作台未迁前，登录成功只「关弹窗 + 刷新登录态」，不 `router.push`；若 query 带合法 `redirect` 才跳该地址。等工作台迁移后再补默认落点。

**验收**：未登录访问受保护页被弹回首页并自动开登录框；登录成功按 §0.3 行为正确；微信扫码闭环正常。

---

### 阶段 7 — 收尾与验收

**步骤**：

1. **清理脚手架残留**：`layout.tsx` 的 `metadata.description`/`title` 改为「特会写」；现 `app/page.tsx` 渲染的 `<TodoApp/>` 按 §0.3 决策处理（移到 `/playground` 等，**勿直接删** `@app/core` 的 TodoApp）。
2. **代码质量**：过 Biome（`pnpm biome check`）、`pnpm --filter web typecheck`、`pnpm --filter web build` 三关。
3. **资源迁移**：`assets/logo.svg`、`assets/home/banner_bg.png` 等放 `public/` 或 `src/assets/`。
4. **回归对照**：开两个窗口逐屏对比 Vue 原版与 Next 版（结构、文案、动画、登录**六种**方式、错误提示）。
5. **响应式与降级**：检查移动端、`prefers-reduced-motion` 降级（源项目有处理）。

**验收清单**：

- [ ] 首页五屏完整、入场动画正常
- [ ] 灵魂屏滚动动画与原版一致
- [ ] 密码/短信/注册/重置/微信扫码/微信绑手机 六种登录全通
- [ ] 刷新保持登录态（refresh 流程）
- [ ] 401 自动刷新重放、被踢下线正确登出
- [ ] 受保护路由守卫 + query 自动弹窗
- [ ] Biome / typecheck / build 三绿
- [ ] 桌面端（`apps/desktop`）不受影响、不引入落地页代码

---

## 4. 工作量与排期建议

| 阶段 | 内容 | 难度 | 预估 |
|---|---|---|---|
| 0 | 准备与依赖 | ⭐ | 0.5 天 |
| 1 | 基础设施 lib | ⭐⭐ | 0.5 天 |
| 2 | 认证数据层 | ⭐⭐ | 0.5 天 |
| 3 | 登录 UI | ⭐⭐⭐ | 1–1.5 天 |
| 4 | 首页静态层 | ⭐⭐⭐ | 1.5–2 天 |
| 5 | 灵魂屏动画 | ⭐⭐⭐⭐ | 2–3 天 |
| 6 | 路由守卫联动 | ⭐⭐ | 0.5 天 |
| 7 | 收尾验收 | ⭐⭐ | 0.5 天 |

> 总计约 **7–9 个工作日**。其中阶段 5（灵魂屏）是不确定性最大的单点，可先做简化占位版不阻塞上线，后续迭代精修。

---

## 5. Vue → Next 心智对照速查

| Vue 概念 | Next/React 对应 |
|---|---|
| `ref()` / `reactive()` | `useState` / `useReducer` |
| `computed()` | `useMemo` 或选择器 |
| `watch()` | `useEffect`（依赖数组） |
| `v-model` | `value` + `onChange`（受控） |
| `onMounted` / `onBeforeUnmount` | `useEffect(() => {...; return cleanup}, [])` |
| 模板 ref 数组 | `useRef` + 数组 |
| Vuex store | Zustand store + Context |
| vue-router 路由表 | `app/` 文件即路由 |
| `router.push` | `useRouter().push`（`next/navigation`） |
| `route.query` | `useSearchParams()` |
| Element Plus `ElMessage` | `sonner` toast |
| Vite `server.proxy` | `next.config.mjs` `rewrites` |
| `@/` 别名 | `@/`（tsconfig paths，已配） |

---

*本文档随迁移进展更新；每完成一个阶段勾掉对应验收项。*
