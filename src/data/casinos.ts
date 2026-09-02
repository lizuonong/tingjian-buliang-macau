/**
 * 澳門娛樂場（博彩區）中心座標
 *
 * 依《博彩監察協調局（DICJ）》規定，娛樂場賭檯周圍嚴禁攝影、錄音與使用
 * 計算輔助設備。本清單用於「賭場熔斷 → 溫馨提醒」地理圍欄：
 * 當用戶進入任一娛樂場中心約 50 米範圍時，App 觸發溫馨提醒
 * （「請勿跟隨人流進入博彩區」），**不再強制關閉相機或凍結 AI 模塊**。
 *
 * 座標為各娛樂場中心點的近似值（萬分位），用於演示與邏輯驗證；
 * 正式版可替換為營運商提供的精確圍欄多邊形。
 */
export interface Casino {
  id: string;
  name: string;
  area: '澳門半島' | '路氹城';
  lat: number;
  lng: number;
}

export const CASINOS: Casino[] = [
  // 澳門半島
  { id: 'grand-lisboa', name: '新葡京', area: '澳門半島', lat: 22.1864, lng: 113.5435 },
  { id: 'lisboa', name: '葡京', area: '澳門半島', lat: 22.1882, lng: 113.5447 },
  { id: 'wynn-macau', name: '永利澳門', area: '澳門半島', lat: 22.1876, lng: 113.5453 },
  { id: 'mgm-macau', name: '美高梅', area: '澳門半島', lat: 22.187, lng: 113.5479 },
  { id: 'sands-macau', name: '金沙', area: '澳門半島', lat: 22.1846, lng: 113.543 },
  // 路氹城
  { id: 'galaxy', name: '銀河', area: '路氹城', lat: 22.1485, lng: 113.557 },
  { id: 'venetian', name: '威尼斯人', area: '路氹城', lat: 22.1466, lng: 113.5604 },
  { id: 'londoner', name: '倫敦人', area: '路氹城', lat: 22.1469, lng: 113.5588 },
  { id: 'parisian', name: '巴黎人', area: '路氹城', lat: 22.145, lng: 113.5618 },
  { id: 'city-of-dreams', name: '新濠天地', area: '路氹城', lat: 22.1454, lng: 113.5608 },
  { id: 'wynn-palace', name: '永利皇宮', area: '路氹城', lat: 22.1494, lng: 113.562 },
  { id: 'mgm-cotai', name: '美高梅路氹', area: '路氹城', lat: 22.148, lng: 113.5612 },
  { id: 'studio-city', name: '新濠影匯', area: '路氹城', lat: 22.1402, lng: 113.5663 },
  { id: 'lisboeta', name: '上葡京', area: '路氹城', lat: 22.1499, lng: 113.5586 },
];
