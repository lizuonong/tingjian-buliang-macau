"""
背包澳门 · 无障碍景点数据后端

功能：
  - 从澳门旅游局官网《无障碍旅游指南》实时抓取景点无障碍数据
    (https://www.macaotourism.gov.mo/api/accessibility/zh-hans/sights.json)
  - 转换为前端 Spot 结构（出入口/通道/升降机/公厕/停车场 + 状态/备注）
  - 提供 REST 接口，并支持手动/自动同步

运行（使用 venv 的 python 执行）：
  python -m uvicorn server.main:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import json
import os
import time
from typing import Any

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="听见·步量澳门 · 景点数据后端", version="1.0.0")

# 允许前端跨域（开发时 Vite 已用代理，这里保留直连支持）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 官网数据源（含时间戳以绕过缓存）
SOURCE_URL = "https://www.macaotourism.gov.mo/api/accessibility/zh-hans/sights.json"
_lang = "zh-hans"
_CACHE_FILE = os.path.join(os.path.dirname(__file__), "cache", "spots.json")
_CACHE_TTL = 6 * 60 * 60  # 6 小时
# 官网个别景点坐标有误（纬度被写成了经度值等），此处以权威坐标覆盖：name -> (lat, lng)
_COORD_FIX: dict[str, tuple[float, float]] = {
    "烧灰炉公园": (22.18677, 113.53719),
}
_cache: dict[str, Any] = {"data": None, "ts": 0}


def _fetch_source() -> list[dict]:
    """从官网拉取原始景点 JSON 列表。"""
    url = f"{SOURCE_URL}?timestamp={int(time.time() * 1000)}"
    resp = requests.get(url, timeout=25)
    resp.raise_for_status()
    return resp.json()


def _accessibility_to_facilities(acc: dict) -> list[dict]:
    """
    把官网「设施无障碍水平」转换为前端 Facility 列表。
    官网字段示例：{"出入口":["文本", null, "备注", {"wheelChair":2}], ...}
    """
    def status_of(value: Any) -> tuple[str, str]:
        """根据字段文本判断设施状态（open/maintenance/closed）与状态文案。"""
        text = (value[0] or "").strip() if isinstance(value, list) and value else str(value)
        if not text:
            return "closed", "无"
        if "适合" in text and "轮椅" in text:
            return "open", "适合轮椅使用"
        if "不完全" in text or "不适合" in text:
            return "maintenance", "部分可用"
        if text in ("无", "没有"):
            return "closed", "无"
        return "open", text

    icons = {
        "出入口": "door",
        "通道": "path",
        "升降机": "elevator",
        "公厕": "restroom",
        "停车场": "parking",
        "育婴室": "restroom",
    }
    facilities = []
    for key, icon in icons.items():
        if key not in acc:
            continue
        value = acc[key]
        status, text = status_of(value)
        note = None
        if isinstance(value, list) and len(value) > 2 and value[2]:
            note = str(value[2])
        facilities.append({
            "id": f"{key}",
            "name": f"无障碍{key}",
            "icon": icon,
            "status": status,
            "statusText": text,
            "note": note,
        })
    return facilities


def _to_spot(raw: dict, order: int = 0) -> dict:
    """官网原始景点记录 → 前端 Spot 结构。"""
    infos = raw.get("infos", {})
    basic = infos.get("基本资料", {})
    acc = infos.get("设施无障碍水平", {})
    name = raw.get("name") or raw.get("title") or "未命名景点"

    # 计算无障碍评分：出入口/通道适合轮椅 +1，升降机 +1，公厕 +1，停车场 +1（0-5）
    score = 0.0
    if "出入口" in acc and "适合" in (acc.get("出入口", [""])[0] or ""):
        score += 1
    if "通道" in acc and "适合" in (acc.get("通道", [""])[0] or ""):
        score += 1
    if "升降机" in acc and "适合" in (acc.get("升降机", [""])[0] or ""):
        score += 1
    if "公厕" in acc and acc.get("公厕", ["无"])[0] not in ("无",):
        score += 1
    if "停车场" in acc and acc.get("停车场", ["无"])[0] not in ("无",):
        score += 1

    address = basic.get("地址", [""])[0] if isinstance(basic.get("地址"), list) else (basic.get("地址") or "")
    hours = basic.get("开放时间", [""])[0] if isinstance(basic.get("开放时间"), list) else (basic.get("开放时间") or "")

    # 官方坐标（经度, 纬度）
    coord = raw.get("coordinate") or []
    lng = float(coord[0]) if len(coord) > 0 and coord[0] not in (None, "") else None
    lat = float(coord[1]) if len(coord) > 1 and coord[1] not in (None, "") else None

    # 官网个别坐标有误，以权威坐标覆盖
    fix = _COORD_FIX.get(name)
    if fix:
        lat, lng = fix

    return {
        "id": str(raw.get("id", name)),
        "name": name,
        "address": address,
        "lat": lat,
        "lng": lng,
        "distanceKm": None,  # 由 /api/spots 根据用户位置计算
        "accessibilityScore": round(score, 1),
        "description": hours or f"{name}的无障碍设施情况，详见下方设施列表。",
        "facilities": _accessibility_to_facilities(acc),
    }


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """计算两点球面距离（公里），Haversine 公式。"""
    import math

    r = 6371.0  # 地球半径 km
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def sync_spots(force: bool = False) -> list[dict]:
    """拉取并转换官网数据；命中缓存则直接返回。"""
    now = time.time()
    if not force and _cache["data"] and (now - _cache["ts"]) < _CACHE_TTL:
        return _cache["data"]

    raw = _fetch_source()
    spots = [_to_spot(r, i) for i, r in enumerate(raw) if isinstance(r, dict) and r.get("infos")]

    # 持久化缓存
    os.makedirs(os.path.dirname(_CACHE_FILE), exist_ok=True)
    with open(_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(spots, f, ensure_ascii=False, indent=2)

    _cache["data"] = spots
    _cache["ts"] = now
    return spots


@app.on_event("startup")
def _startup() -> None:
    """启动时尝试预热缓存（失败不阻塞启动）。"""
    try:
        sync_spots(force=False)
    except Exception as exc:  # noqa: BLE001
        print(f"[spots] 预热失败（可稍后手动同步）: {exc}")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "cache_ts": _cache["ts"]}


@app.get("/api/spots")
def get_spots(force: bool = False, lat: float | None = None, lng: float | None = None) -> dict:
    """
    返回全部景点数据。

    - lat / lng：用户当前位置（可选）。提供时按 Haversine 计算每个景点与用户的真实距离
    - 未提供坐标时 distanceKm 为 null
    """
    try:
        data = sync_spots(force=force)
        spots = list(data)
        if lat is not None and lng is not None:
            for s in spots:
                if s.get("lat") is not None and s.get("lng") is not None:
                    s["distanceKm"] = round(haversine_km(lat, lng, s["lat"], s["lng"]), 1)
        return {"status": "success", "count": len(spots), "spots": spots}
    except Exception as exc:  # noqa: BLE001
        return {"status": "error", "error": str(exc), "spots": []}


@app.post("/api/spots/sync")
def manual_sync() -> dict:
    """手动触发一次官网同步。"""
    try:
        data = sync_spots(force=True)
        return {"status": "success", "count": len(data)}
    except Exception as exc:  # noqa: BLE001
        return {"status": "error", "error": str(exc)}


# ============================================================
# 托管前端构建产物（单服务部署）：把 Vite 构建的 dist/ 一并提供
# 这样前端与 /api/spots 同源，无需跨域，适合单机/单域名上线。
# 前端需先执行 `npm run build`（产物在 dist/）再启动本服务。
# ============================================================
_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))


@app.get("/")
def spa_index() -> FileResponse:
    """返回前端入口页。"""
    return FileResponse(os.path.join(_DIST_DIR, "index.html"))


if os.path.isdir(os.path.join(_DIST_DIR, "assets")):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(_DIST_DIR, "assets")),
        name="assets",
    )
