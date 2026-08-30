# 听见·步量澳门 · 无障碍导览前端

面向视障、听障、行动不便及长者用户的无障碍旅游辅助应用前端（React + TypeScript + Tailwind CSS），全面遵循 WCAG 2.1。

> 视觉风格：阿里系蓝白色大厂风（Ant Design 色板，品牌蓝 `#1677ff` / 主按钮 `#0958d9`，浅灰蓝底 `#f5f7fa`）。

## 快速开始

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # 类型检查 + 生产构建
```

## 景点数据后端（实时同步澳门旅游局官网）

景点详情页的无障碍数据优先从后端拉取（73 个景点，实时同步官网），后端不可达时自动降级到本地数据。

```bash
# 启动后端（Python + FastAPI，端口 8000）
.venv\Scripts\python.exe -m pip install -r server\requirements.txt
.venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```

后端从官网 JSON 接口 `https://www.macaotourism.gov.mo/api/accessibility/zh-hans/sights.json` 抓取，
`GET /api/spots` 返回全部景点（含出入口/通道/升降机/公厕/停车场/育婴室设施水平），6 小时缓存。
开发时 Vite 将 `/api` → `http://127.0.0.1:8000`。详见 `server/README.md`。

## 菜单识别（千问多模态后端对接）

沟通助手「识别菜单」调用千问多模态模型（`qwen3.7-flash-2026-07-15`）识别菜单图片，
后端由 HP-Macau Agent（FastAPI）提供：

- 端点：`POST /api/vision/menu`（multipart：`image` + `target`，默认 `zh`）
- 返回：`{ status, menu:[{ name, price, intro, detail, translation }], summary }`
- 开发代理：Vite 将 `/api` → `http://127.0.0.1:8000`

### 让识别真正工作（本机演示）

1. 启动千问后端（同学侧）：

   ```bash
   D:\Effy\anaconda3\envs\qwenpaw\python.exe -X utf8 D:\Desktop\Doing\阿里AI竞赛\QwenPaw-vs\hear-pace-macau\api\run_bridge.py
   ```

2. 打开 `http://localhost:5173` → 沟通助手 → 「识别菜单」（手机将直接调用后置摄像头，桌面为文件选择）→ 拍菜单照片 → 返回结构化菜品与推荐。

> 后端未启动时前端会自动降级展示示例菜单并提示，不会报错。
>
> ⚠️ 后端仅在本机运行；GitHub Pages 线上版无法访问 `127.0.0.1:8000`，
> 需将后端部署到公网后用环境变量 `VITE_VISION_API` 指定其地址。

## 页面与核心功能

| 模块 | 文件 | 核心功能 |
| --- | --- | --- |
| 04 景点详情页 | `src/pages/SpotDetail.tsx` | 切换景点（下拉）+ 无障碍水平/距离加权推荐；设施卡片（入口/升降梯/卫生间/通道）+ 状态标签 |
| 05 AI 视觉导览 | `src/pages/AIVisionGuide.tsx` | 「豆包打电话」式语音通话界面：摄像头识别画面 + AI 语音球 + 流式文字 + 说话/静音/结束控制（预留千问流式接口） |
| 06 听障沟通助手 | `src/pages/HearingAssistant.tsx` | 聊天式界面：识别菜单（千问 API）/ 听取语音（全屏大字请对方说话）/ 打字沟通，均支持全屏大字出示 |
| 07 一键 SOS | `src/pages/EmergencySOS.tsx` | 长按 3 秒触发（环形倒计时 + 防误触 + 发送前确定弹窗）；道路受阻/身体不适/设备损坏快速求助卡 |

## 可复用组件（`src/components`）

- `IconButton` — 最小 44×44 Hit Target 图标按钮（支持尺寸/变体/ref 转发）
- `StatusBadge` — 状态标签（图标 + 文字，不依赖颜色传达）
- `FacilityCard` — 设施卡片
- `SOSButton` — 长按 3 秒触发（pointer/keyboard 双通道 + rAF 进度环）
- `ConfirmDialog` — 发送前二次确认弹窗（`role="alertdialog"` + 焦点管理 + Esc 关闭）
- `FlipCard` — 翻转/全屏大字模态（Esc 关闭 + 焦点管理）
- `PageHeader` / `A11yModeToggle` — 页头与无障碍模式切换

## 无障碍设计要点

- **触控**：可点击元素 ≥ 44×44px；主按钮 ≥ 52px；SOS ≥ 192px
- **对比度**：正文 ≥ 4.5:1、图标/大字号 ≥ 3:1（主按钮白字在 `#0958d9` 上 6.2:1）
- **不依赖颜色**：所有状态均配图标 + 文字（选中勾选、设施状态、播报高亮左侧指示条等）
- **焦点**：全局 `.focus-ring`（`focus-visible:ring-4`）
- **感知**：`aria-live` 状态播报、`role="dialog"` 全屏模态、跳过导航链接、`prefers-reduced-motion` 尊重
- **自适应**：大字号（`html.a11y-large-text`，根字号 16→20px）与高对比度（`html.a11y-high-contrast`，CSS 变量接管）双模式，顶栏一键切换

## 目录结构

```
src/
├── App.tsx                 # 主入口 + 底部导航（aria-current）
├── index.css               # 全局样式 + 无障碍模式 CSS 变量
├── context/A11yContext.tsx # 无障碍模式/需求选择/页面路由状态
├── components/             # 可复用组件
├── pages/                  # 五个功能页面
└── types/index.ts          # TypeScript 类型定义
```
