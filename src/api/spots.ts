import type { Spot } from '../types';

/**
 * 景点数据 API 封装
 *
 * 优先从后端（FastAPI，同步官网）拉取，失败时降级到本地 `src/data/spots.ts`。
 * 开发时 Vite 将 `/api` 代理到 http://127.0.0.1:8000。
 */

const SPOTS_API = import.meta.env.VITE_SPOTS_API || '/api/spots';

/** 获取用户当前位置（经纬度），失败返回 null */
export function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

export async function fetchSpots(): Promise<Spot[]> {
  const loc = await getUserLocation();
  try {
    // 有定位则让后端按用户位置计算各景点真实距离
    const query = loc ? `?lat=${loc.lat}&lng=${loc.lng}` : '';
    const resp = await fetch(`${SPOTS_API}${query}`, { method: 'GET' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.status === 'success' && Array.isArray(data.spots) && data.spots.length > 0) {
      return data.spots as Spot[];
    }
    throw new Error(data.error || '空数据');
  } catch {
    // 后端不可达 → 降级到本地数据；若已拿到用户定位，则用本地权威坐标现算距离
    const { SPOTS } = await import('../data/spots');
    if (!loc) return SPOTS;
    const { haversineMeters } = await import('../utils/geo');
    return SPOTS.map((s) => {
      if (s.lat == null || s.lng == null) return s;
      const km = haversineMeters({ lat: s.lat, lng: s.lng }, loc) / 1000;
      return { ...s, distanceKm: Math.round(km * 10) / 10 };
    });
  }
}
