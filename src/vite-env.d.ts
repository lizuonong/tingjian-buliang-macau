/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 千问菜单识别后端基础地址（可选，默认走 /api 代理） */
  readonly VITE_VISION_API?: string;
  /** 实时视频/语音 WebSocket 地址（可选，默认连公网 ws://118.31.170.211:8000/ws/video） */
  readonly VITE_REALTIME_WS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
