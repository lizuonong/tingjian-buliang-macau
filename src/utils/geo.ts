/**
 * 地理計算工具
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Haversine 計算兩點球面距離（米） */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000; // 地球半徑（米）
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
