# 听见·步量澳门 · 无障碍导览前端

面向视障、听障、行动不便及长者用户的无障碍旅游辅助应用前端（React + TypeScript + Tailwind CSS），全面遵循 WCAG 2.1。

> 视觉风格：阿里系蓝白色大厂风（Ant Design 色板，品牌蓝 `#1677ff` / 主按钮 `#0958d9`，浅灰蓝底 `#f5f7fa`）。

## 快速开始

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # 类型检查 + 生产构建
```

## 页面与核心功能

| 模块 | 文件 | 核心功能 |
| --- | --- | --- |
| 01 需求定制页 | `src/pages/AccessibilitySetup.tsx` | 行动/视觉/听觉障碍、长者模式多选卡片（勾选图标 + 加粗边框 + 背景色三重选中信号） |
| 04 景点详情页 | `src/pages/SpotDetail.tsx` | 无障碍设施卡片（入口/升降梯/卫生间/车位）+ 状态标签；众包突发障碍实时提醒（可刷新） |
| 05 AI 视觉导览 | `src/pages/AIVisionGuide.tsx` | 语音控制条（播放/暂停、逐句朗读 ≥64px 大按钮，Web Speech API 真实朗读）；播报文本框实时高亮当前句 |
| 06 听障沟通助手 | `src/pages/HearingAssistant.tsx` | 拍照识别（菜单/路牌模拟）+ 3D 翻转卡片 + 一键全屏大字展示；打字沟通大字出示 |
| 07 一键 SOS | `src/pages/EmergencySOS.tsx` | 长按 3 秒触发（环形倒计时动画 + 防误触取消 + 5s 撤销确认）；道路受阻/身体不适/设备损坏快速求助卡 |

## 可复用组件（`src/components`）

- `IconButton` — 最小 44×44 Hit Target 图标按钮（支持尺寸/变体/ref 转发）
- `A11yCard` — 多选需求卡片（`role="checkbox"` + `aria-checked`）
- `StatusBadge` — 状态标签（图标 + 文字，不依赖颜色传达）
- `FacilityCard` — 设施卡片
- `SOSButton` — 长按 3 秒触发（pointer/keyboard 双通道 + rAF 进度环）
- `VoiceControlBar` / `BroadcastTextBox` — 语音控制与高亮播报
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
