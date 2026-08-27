import { Building2, DoorOpen, Info, MapPin, Users, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import FacilityCard from '../components/FacilityCard';
import PageHeader from '../components/PageHeader';
import type { Facility } from '../types';

/**
 * 04 景点详情页 (Spot Detail)
 * - 设施卡片：无障碍入口 / 升降梯 / 卫生间，带状态标签
 * - 实时提醒：众包突发障碍反馈（图标 + 文字，不依赖颜色）
 */

const FACILITIES: Facility[] = [
  {
    id: 'entrance',
    name: '无障碍入口',
    icon: 'door',
    status: 'open',
    statusText: '正常开放',
    note: '位于正门右侧，坡度 5°，宽 1.2m',
  },
  {
    id: 'elevator',
    name: '无障碍升降梯',
    icon: 'elevator',
    status: 'maintenance',
    statusText: '临时维护中',
    note: '预计 14:00 恢复，建议使用侧门坡道',
  },
  {
    id: 'restroom',
    name: '无障碍卫生间',
    icon: 'restroom',
    status: 'open',
    statusText: '正常开放',
    note: '一层近服务台，含婴儿护理台',
  },
  {
    id: 'parking',
    name: '无障碍车位',
    icon: 'parking',
    status: 'closed',
    statusText: '暂不可用',
    note: '今日有活动临时封闭，停靠指引见现场标识',
  },
];

const FACILITY_ICONS: Record<string, LucideIcon> = {
  door: DoorOpen,
  elevator: Wind,
  restroom: Users,
  parking: Building2,
};

export default function SpotDetail() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        icon={<MapPin className="h-6 w-6" />}
        title="大三巴牌坊"
        subtitle="无障碍评分 4.6 / 5 · 建议游览 1.5 小时"
      />

      {/* 无障碍设施 */}
      <section aria-labelledby="facility-heading">
        <h2
          id="facility-heading"
          className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900"
        >
          <Info aria-hidden="true" className="h-5 w-5 text-brand-600" />
          无障碍设施
        </h2>
        <ul className="space-y-3">
          {FACILITIES.map((f) => (
            <FacilityCard key={f.id} facility={f} icon={FACILITY_ICONS[f.icon]} />
          ))}
        </ul>
      </section>
    </div>
  );
}