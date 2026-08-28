import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // 相对路径 base：确保部署到 GitHub Pages 子路径（如 /用户名/仓库名/）时资源可正常加载
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // 开发时将 /api 转发到本地千问菜单识别后端（FastAPI），规避跨域
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
