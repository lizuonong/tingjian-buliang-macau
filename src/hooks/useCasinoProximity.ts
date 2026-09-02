import { useEffect, useState } from 'react';
import { CASINOS, type Casino } from '../data/casinos';
import { haversineMeters } from '../utils/geo';

/** 進入提醒的半徑（米）——依需求「距賭場中心點約 50 米」 */
export const CASINO_TRIGGER_M = 50;

export interface CasinoProximity {
  /** 用戶是否位於任一娛樂場中心 50 米內 */
  inZone: boolean;
  /** 當前最近的娛樂場（僅在範圍內有值） */
  casino: Casino | null;
  /** 到最近娛樂場中心的距離（米） */
  distance: number | null;
}

/**
 * DEV 模式：透過 URL `?casino=<id>` 強制模擬位於指定娛樂場附近，便於本機驗證。
 * 例如 `http://localhost:5173/?casino=grand-lisboa` 會直接觸發提醒。
 */
function devCasinoOverride(): { casino: Casino; distance: number } | null {
  if (!import.meta.env.DEV) return null;
  const id = new URL(window.location.href).searchParams.get('casino');
  if (!id) return null;
  const casino = CASINOS.find((c) => c.id === id);
  return casino ? { casino, distance: 10 } : null;
}

/**
 * 監聽用戶定位，檢測是否進入任一娛樂場中心約 50 米範圍。
 * 定位被拒絕/不可用時安靜返回（不觸發提醒）。
 */
export function useCasinoProximity(): CasinoProximity {
  const [state, setState] = useState<CasinoProximity>({
    inZone: false,
    casino: null,
    distance: null,
  });

  useEffect(() => {
    // DEV 模擬：直接視為進入範圍，不依賴真實定位
    const dev = devCasinoOverride();
    if (dev) {
      setState({ inZone: true, casino: dev.casino, distance: dev.distance });
      return;
    }

    if (!('geolocation' in navigator)) return;

    const onPos = (pos: GeolocationPosition) => {
      const user = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      let nearest: { casino: Casino; distance: number } | null = null;
      for (const c of CASINOS) {
        const d = haversineMeters(user, c);
        if (!nearest || d < nearest.distance) nearest = { casino: c, distance: d };
      }
      if (!nearest) return;
      const inZone = nearest.distance <= CASINO_TRIGGER_M;
      setState({
        inZone,
        casino: inZone ? nearest.casino : null,
        distance: nearest.distance,
      });
    };

    const onErr = () => {
      setState({ inZone: false, casino: null, distance: null });
    };

    const id = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}
