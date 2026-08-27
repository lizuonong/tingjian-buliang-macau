import type { Spot } from '../types';

/**
 * 景点数据与推荐算法
 *
 * 数据来源：澳门特别行政区政府旅游局《无障碍旅游指南》
 *   https://www.macaotourism.gov.mo/zh-hans/barrier-free-access-guide
 *
 * 说明：`distanceKm` 目前为模拟距离（假设用户在澳门半岛中心），
 * 正式版可接入浏览器 geolocation 或后台定位服务后动态覆盖。
 * `accessibilityScore` 依据官网「设施无障碍水平」归类（出入口/升降机/公厕/通道等）估算。
 */

export const SPOTS: Spot[] = [
  {
    id: 'ruins-st-paul',
    name: '大三巴牌坊',
    address: '耶稣会纪念广场',
    distanceKm: 0.8,
    accessibilityScore: 3.2,
    description: '澳门地标，通道与出入口适合轮椅使用者，但周边地面凹凸不平，需注意。',
    facilities: [
      { id: 'entrance', name: '无障碍入口', icon: 'door', status: 'open', statusText: '正常开放', note: '符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '通行时需协助，建议结伴' },
    ],
  },
  {
    id: 'lu-kwan-yuen',
    name: '卢廉若公园',
    address: '罗利老马路 10 号',
    distanceKm: 1.5,
    accessibilityScore: 4.4,
    description: '澳门最具苏式园林特色的公园，无障碍设施完善，适合悠闲散步。',
    facilities: [
      { id: 'entrance', name: '无障碍入口', icon: 'door', status: 'open', statusText: '正常开放', note: '主入口设无障碍坡道' },
      { id: 'restroom', name: '无障碍卫生间', icon: 'restroom', status: 'open', statusText: '正常开放', note: '近南门，空间充足' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'open', statusText: '正常开放', note: '园内主步道平坦宽阔' },
    ],
  },
  {
    id: 'st-anthony',
    name: '圣安多尼教堂',
    address: '花王堂前地',
    distanceKm: 1.1,
    accessibilityScore: 3.8,
    description: '澳门三大古教堂之一，入口设缓坡，内部通道便于轮椅通行。',
    facilities: [
      { id: 'entrance', name: '无障碍入口', icon: 'door', status: 'open', statusText: '正常开放', note: '侧门设无障碍缓坡' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'open', statusText: '正常开放', note: '堂内走道宽敞平缓' },
    ],
  },
  {
    id: 'garden-camoes',
    name: '白鸽巢公园（贾梅士花园）',
    address: '公园前街',
    distanceKm: 1.6,
    accessibilityScore: 4.1,
    description: '绿树成荫，设多条无障碍坡道与休息区，适合长者与轮椅使用者。',
    facilities: [
      { id: 'entrance', name: '无障碍入口', icon: 'door', status: 'open', statusText: '正常开放', note: '多个入口设坡道' },
      { id: 'restroom', name: '无障碍卫生间', icon: 'restroom', status: 'maintenance', statusText: '临时维护中', note: '预计下午恢复' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'open', statusText: '正常开放', note: '主步道坡度平缓' },
    ],
  },
  {
    id: 'holy-house-mercy',
    name: '仁慈堂博物馆',
    address: '议事亭前地',
    distanceKm: 0.5,
    accessibilityScore: 3.5,
    description: '位于议事亭前地的历史建筑，入口设无障碍通道，展示澳门慈善历史。',
    facilities: [
      { id: 'entrance', name: '无障碍入口', icon: 'door', status: 'open', statusText: '正常开放', note: '侧门设无障碍通道' },
      { id: 'elevator', name: '无障碍升降梯', icon: 'elevator', status: 'closed', statusText: '暂不可用', note: '前往二层的升降梯维修中' },
    ],
  },
  {
    id: 'oriental-foundation',
    name: '东方基金会会址',
    address: '白鸽巢公园旁',
    distanceKm: 1.3,
    accessibilityScore: 3.6,
    description: '古典南欧风格建筑，前花园设无障碍坡道，环境幽静。',
    facilities: [
      { id: 'entrance', name: '无障碍入口', icon: 'door', status: 'open', statusText: '正常开放', note: '前门设无障碍坡道' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'open', statusText: '正常开放', note: '花园步道平整' },
    ],
  },
];

/** 设施图标名 → lucide 组件 key */
export const FACILITY_ICON_KEYS = ['door', 'elevator', 'restroom', 'parking', 'path'] as const;

/**
 * 推荐算法：综合「无障碍水平评分」与「距离」加权排序
 *
 * score = accessibilityScore * 权重 - 距离 * 权重
 * 归一化处理后，无障碍更高、距离更近的景点得分更高。
 */
export function recommendSpots(currentSpotId: string, spots: Spot[] = SPOTS): Spot[] {
  return spots
    .filter((s) => s.id !== currentSpotId)
    .map((s) => {
      // 无障碍权重 0.6，距离权重 0.4（距离越近分越高）
      const score = s.accessibilityScore * 0.6 - s.distanceKm * 0.4;
      return { spot: s, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((r) => r.spot);
}

/** 根据景点无障碍评分生成推荐理由文案 */
export function recommendReason(spot: Spot): string {
  const scoreText = spot.accessibilityScore >= 4 ? '无障碍设施完善' : '无障碍设施基本可用';
  return `${scoreText} · 距此 ${spot.distanceKm.toFixed(1)} km`;
}
