/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 千问菜单识别后端基础地址（可选，默认走 /api 代理） */
  readonly VITE_VISION_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
