/**
 * 全局类型定义 —— 听见·步量澳门
 */

/** 设施状态 */
export type FacilityStatus = 'open' | 'maintenance' | 'closed';

/** 设施卡片 */
export interface Facility {
  id: string;
  name: string;
  icon: string; // lucide 图标名
  status: FacilityStatus;
  statusText: string;
  note?: string;
}

/** 众包实时提醒 */
export interface CrowdAlert {
  id: string;
  type: 'blocked' | 'noise' | 'crowd' | 'assist';
  title: string;
  description: string;
  time: string;
  urgent: boolean;
}

/** 景点（含设施与推荐所需数据），数据来源：澳门旅游局无障碍旅游指南 */
export interface Spot {
  id: string;
  name: string;
  address: string;
  /** 与用户的模拟距离（km），可接入真实定位后覆盖 */
  distanceKm: number;
  /** 无障碍水平评分 0-5，基于官网「设施无障碍水平」归类 */
  accessibilityScore: number;
  description: string;
  facilities: Facility[];
}

/** 照片识别结果 */
export interface RecognitionResult {
  id: string;
  kind: 'menu' | 'sign' | 'other';
  title: string;
  lines: string[]; // 识别出的文本行
  confidence: number; // 0-1 置信度
  capturedAt: string;
}

/** SOS 紧急求助类别 */
export type SOSCategory = 'blocked' | 'unwell' | 'device' | 'emergency';

/** SOS 快捷项 */
export interface SOSQuickItem {
  id: SOSCategory;
  title: string;
  description: string;
}

/** 页面导航 */
export type PageId =
  | 'spot' // 04 景点详情
  | 'vision' // 05 AI 视觉导览
  | 'hearing' // 06 听障沟通助手
  | 'sos'; // 07 一键 SOS
