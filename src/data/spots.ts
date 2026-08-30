import type { Spot } from '../types';

/**
 * 景点数据与推荐算法
 *
 * 数据来源：澳门特别行政区政府旅游局《无障碍旅游指南》（官方真实调查数据）
 *   https://www.macaotourism.gov.mo/zh-hans/barrier-free-access-guide
 *   - 出入口 / 升降机 / 公厕 / 停车场 / 通道 / 育婴室 等「设施无障碍水平」字段
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
    accessibilityScore: 3.0,
    description: '澳门地标。出入口与通道符合通用设计标准、适合轮椅使用者，但地面凹凸不平，升降机/公厕/停车场均无，建议提前规划前往周边洗手间。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '通行时需协助，建议结伴' },
    ],
  },
  {
    id: 'lu-kwan-yuen',
    name: '卢廉若公园',
    address: '罗利老马路 10 号',
    distanceKm: 1.5,
    accessibilityScore: 3.2,
    description: '澳门最具苏式园林特色的公园。出入口适合轮椅使用者，通道总体可用但有凹凸不平，园内无升降机/公厕/停车场。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '园内部分步道不平，需注意' },
    ],
  },
  {
    id: 'st-anthony',
    name: '圣安多尼教堂',
    address: '花王堂前地',
    distanceKm: 1.1,
    accessibilityScore: 3.0,
    description: '澳门三大古教堂之一。出入口与通道适合轮椅使用者，但地面凹凸不平，无升降机/公厕/停车场。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '堂内地面不平，通行需协助' },
    ],
  },
  {
    id: 'garden-camoes',
    name: '白鸽巢公园（贾梅士花园）',
    address: '公园前街',
    distanceKm: 1.6,
    accessibilityScore: 3.2,
    description: '绿树成荫。出入口适合轮椅使用者，通道可用但地面凹凸不平，无升降机/公厕/停车场。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '主步道部分不平' },
    ],
  },
  {
    id: 'holy-house-mercy',
    name: '仁慈堂博物馆',
    address: '议事亭前地',
    distanceKm: 0.5,
    accessibilityScore: 3.0,
    description: '位于议事亭前地的历史建筑。出入口与通道适合轮椅使用者，地面凹凸不平，无升降机/公厕/停车场。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '地面不平，通行需协助' },
    ],
  },
  {
    id: 'oriental-foundation',
    name: '东方基金会会址',
    address: '白鸽巢公园旁',
    distanceKm: 1.3,
    accessibilityScore: 3.0,
    description: '古典南欧风格建筑。出入口与通道适合轮椅使用者，地面凹凸不平，无升降机/公厕/停车场。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '花园步道不平' },
    ],
  },
  {
    id: 'camoes-garden-add',
    name: '加思栏花园',
    address: '南湾大马路',
    distanceKm: 1.2,
    accessibilityScore: 3.0,
    description: '澳门历史悠久的公园。出入口与通道适合轮椅使用者，地面凹凸不平，无升降机/公厕/停车场。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '园内步道不平' },
    ],
  },
  {
    id: 'lou-kah-mansion',
    name: '卢家大屋',
    address: '大堂巷 7 号',
    distanceKm: 0.6,
    accessibilityScore: 2.8,
    description: '澳门中式大宅代表作。出入口与通道适合轮椅使用者，但地面凹凸不平，且为古宅空间较窄。',
    facilities: [
      { id: 'entrance', name: '无障碍出入口', icon: 'door', status: 'open', statusText: '适合轮椅使用', note: '设施符合本地通用设计标准，适合轮椅使用者' },
      { id: 'path', name: '无障碍通道', icon: 'path', status: 'maintenance', statusText: '地面凹凸不平', note: '古宅地面不平，空间较窄' },
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
