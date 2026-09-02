# 线上部署指南（单体服务版：前端 + 景点后端）

> 目标：把「听见·步量澳门」的**前端(SPA) + 景点数据后端(FastAPI)** 作为一个整体发布到线上。
> 不需要部署 Agent API（菜单识别 / 语音转文字 / 实时导览），这三项会走前端降级。

## 一、架构（已改造完毕）

`server/main.py` 现在会**同时托管前端构建产物和 API**：

```
浏览器
  │
  ├─ GET /            → dist/index.html（前端 SPA）
  ├─ GET /assets/*    → dist/assets/*（JS/CSS）
  ├─ GET /api/spots   → 景点后端（拉取澳门旅游局官网数据 + 算距离）
  └─ GET /health      → 健康检查
```

- 前后端**同源**，无需处理 CORS。
- Agent API（`/api/vision/menu`、`/api/audio/asr`、`/ws/video`）仍指向公网 `http://118.31.170.211:8000`，不随本次部署移动。

## 二、本机打包

```powershell
cd "c:\Users\w2415\Desktop\千模百炼\Demo"
npm install
npm run build          # 生成 dist/（前端产物）
```

## 三、部署到一台服务器

### 3.1 服务器准备（Linux 示例）

```bash
# 1. 装 Python 3.11+
sudo apt update && sudo apt-get install -y python3 python3-venv nginx

# 2. 上传项目，进入目录
cd /opt/tingjian-macau   # 你放项目的路径

# 3. 建虚拟环境并装依赖
python3 -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt   # 依赖：fastapi/uvicorn/requests/bs4

# 4. 确保前端产物已上传（dist/ 与 server/ 同级）
ls dist/index.html
```

### 3.2 启动单体服务

```bash
# 前台试跑（0.0.0.0 才能被外部访问）
.venv/bin/python -m uvicorn server.main:app --host 0.0.0.0 --port 8000

# 后台运行
nohup .venv/bin/python -m uvicorn server.main:app \
  --host 0.0.0.0 --port 8000 > logs/server.log 2>&1 &
```

此时直接访问 `http://<服务器IP>:8000` 即可看到完整 APP。

### 3.3 用 Nginx 提供 80/443 + HTTPS（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 静态资源（前端 SPA 与 API 由 FastAPI 提供，这里反代到 uvicorn）
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    # WebSocket（如以后要启用实时导览）
    location /ws/video {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

HTTPS 用 `certbot`（Let's Encrypt）免费证书，或云厂商免费证书。

### 3.4 防火墙

```bash
sudo ufw allow 8000/tcp     # 直连端口（可选）
sudo ufw allow 80,443/tcp   # Nginx
```

## 四、部署平台选择（三选一）

| 平台 | 适合 | 说明 |
|------|------|------|
| **你已有的云服务器 (118.31.170.211)** | ✅ 首选，零额外成本 | 在服务器上跑上面的 uvicorn；若该端口已被 Agent 占用，可把单体服务放另一个端口/域名，或用 Nginx 按路径分流 |
| **阿里云/腾讯云 轻量应用服务器** | 国内用户、稳定 | 独立可控，速度快，需备案域名（或直接用 IP/端口访问演示） |
| **Render.com** | 无需服务器、免费 | 部署为 Web Service：start command 用上面 uvicorn；自动 HTTPS；免费档 15 分钟无访问休眠、大陆访问可能慢 |

## 五、关于 Agent API（不部署）

前端三项 Agent 功能默认指向公网 `http://118.31.170.211:8000`：

| 功能 | 前端文件 | 默认地址 |
|------|----------|----------|
| 菜单识别 | `src/api/vision.ts` | `http://118.31.170.211:8000/api/vision/menu` |
| 语音转文字 | `src/api/asr.ts` | `http://118.31.170.211:8000/api/audio/asr` |
| 实时导览 | `src/api/realtime.ts` | `ws://118.31.170.211:8000/ws/video` |

- 若在线版是 **HTTPS**，浏览器会因 **mixed content** 拦截这些 `http://` 调用 → 各项自动走降级（菜单显示示例、听取语音提示失败、实时导览显示连接失败）。这与「Agent api 不用」的预期一致。
- 若想彻底隐藏这些入口，可构建时把 `VITE_VISION_API` / `VITE_ASR_API` / `VITE_REALTIME_WS` 置为无效地址，让它们静默降级。

## 六、本次改动

- `server/main.py`：新增 `StaticFiles`/`FileResponse`，托管 `dist/`（前端）与 `/assets/*`；保留 `/api/spots`、`/health`。单服务即可运行。
