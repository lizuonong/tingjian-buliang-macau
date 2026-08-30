# 听见·步量澳门 · 景点数据后端

从**澳门旅游局官网《无障碍旅游指南》**实时抓取景点无障碍数据，提供 REST 接口给前端。

## 数据源
- 官网页面：https://www.macaotourism.gov.mo/zh-hans/barrier-free-access-guide
- 实际 JSON 接口：`https://www.macaotourism.gov.mo/api/accessibility/zh-hans/sights.json`
- 一次返回 **73 个景点**，含「设施无障碍水平」（出入口/通道/升降机/公厕/停车场/育婴室及状态备注）

## 启动后端

```bash
# 安装依赖
.venv\Scripts\python.exe -m pip install -r server\requirements.txt

# 运行
.venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```

## 接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/health` | GET | 健康检查 |
| `/api/spots` | GET | 返回全部景点（默认走 6 小时缓存） |
| `/api/spots?force=true` | GET | 强制同步官网 |
| `/api/spots/sync` | POST | 手动触发一次官网同步 |

返回示例：
```json
{
  "status": "success",
  "count": 73,
  "spots": [
    {
      "id": "23",
      "name": "二龙喉公园",
      "address": "澳门士多鸟拜斯大马路",
      "distanceKm": 0.4,
      "accessibilityScore": 3.0,
      "description": "公园：上午6时至午夜12时...",
      "facilities": [
        { "id": "出入口", "name": "无障碍出入口", "icon": "door", "status": "open", "statusText": "适合轮椅使用", "note": null },
        ...
      ]
    }
  ]
}
```

## 前端对接
- 前端 `src/api/spots.ts` 通过 `GET /api/spots` 拉取；开发时 Vite 将 `/api` 代理到 `http://127.0.0.1:8000`
- 后端不可达时前段自动降级到本地 `src/data/spots.ts`

## 说明
- `distanceKm` 目前为后端生成的模拟距离，正式版可接前端 `geolocation` 或改为真实坐标计算
- 缓存：内存 + `server/cache/spots.json` 双缓存，TTL 6 小时
