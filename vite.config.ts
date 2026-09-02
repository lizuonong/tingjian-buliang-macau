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
    // 开发时将 /api 转发到本地景点后端，/agent 转发到公网 Agent 后端，规避跨域
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/agent': {
        target: 'http://118.31.170.211:8000',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/agent/, ''),
      },
    },
  },
});
