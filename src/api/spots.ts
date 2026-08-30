import type { Spot } from '../types';

/**
 * 景点数据 API 封装
 *
 * 优先从后端（FastAPI，同步官网）拉取，失败时降级到本地 `src/data/spots.ts`。
 * 开发时 Vite 将 `/api` 代理到 http://127.0.0.1:8000。
 */

const SPOTS_API = import.meta.env.VITE_SPOTS_API || '/api/spots';

export async function fetchSpots(): Promise<Spot[]> {
  try {
    const resp = await fetch(SPOTS_API, { method: 'GET' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.status === 'success' && Array.isArray(data.spots) && data.spots.length > 0) {
      return data.spots as Spot[];
    }
    throw new Error(data.error || '空数据');
  } catch {
    // 后端不可达 → 降级到本地数据
    const { SPOTS } = await import('../data/spots');
    return SPOTS;
  }
}
