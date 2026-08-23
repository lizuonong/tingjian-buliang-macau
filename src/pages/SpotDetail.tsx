import {
  Accessibility,
  Building2,
  DoorOpen,
  Info,
  MapPin,
  Megaphone,
  RefreshCw,
  Users,
  Volume2,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import FacilityCard from '../components/FacilityCard';
import PageHeader from '../components/PageHeader';
import { useA11y } from '../context/A11yContext';
import type { CrowdAlert, Facility } from '../types';

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

const INITIAL_ALERTS: CrowdAlert[] = [
  {
    id: 'a1',
    type: 'blocked',
    title: '东侧阶梯临时施工',
    description: '一位轮椅用户反馈东侧入口坡道被施工围挡，请改走正门。',
    time: '5 分钟前',
    urgent: true,
  },
  {
    id: 'a2',
    type: 'assist',
    title: '服务台提供手语服务',
    description: '热心游客反馈服务台有手语翻译平板，可于 10:00-17:00 借用。',
    time: '32 分钟前',
    urgent: false,
  },
];

const ALERT_ICONS: Record<CrowdAlert['type'], LucideIcon> = {
  blocked: MapPin,
  noise: Volume2,
  crowd: Users,
  assist: Megaphone,
};

export default function SpotDetail() {
  const { navigate } = useA11y();
  const [alerts, setAlerts] = useState<CrowdAlert[]>(INITIAL_ALERTS);

  /** 刷新众包提醒（模拟实时拉取） */
  const refreshAlerts = () => {
    setAlerts((prev) => [
      {
        id: `live-${Date.now()}`,
        type: 'blocked',
        title: '西北角无障碍车位已恢复',
        description: '现场管理员确认车位已清空，可正常使用。',
        time: '刚刚',
        urgent: false,
      },
      ...prev,
    ]);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        icon={<MapPin className="h-6 w-6" />}
        title="大三巴牌坊"
        subtitle="澳门地标 · 无障碍评分 4.6 / 5 · 建议游览 1.5 小时"
        actions={
          <button
            type="button"
            onClick={() => navigate('vision')}
            className="focus-ring inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:from-brand-400 hover:to-brand-500"
          >
            <Accessibility className="h-5 w-5" aria-hidden="true" />
            AI 导览
          </button>
        }
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

      {/* 实时提醒（众包反馈） */}
      <section aria-labelledby="alert-heading">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2
            id="alert-heading"
            className="flex items-center gap-2 text-lg font-bold text-gray-900"
          >
            <Megaphone aria-hidden="true" className="h-5 w-5 text-brand-600" />
            实时提醒 · 众包反馈
          </h2>
          <button
            type="button"
            onClick={refreshAlerts}
            className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border-2 border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-brand-400 hover:bg-brand-50"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            刷新
          </button>
        </div>

        <ul aria-live="polite" className="space-y-3">
          {alerts.map((a) => {
            const Icon = ALERT_ICONS[a.type];
            return (
              <li
                key={a.id}
                className={`card-surface p-4 ${
                  a.urgent ? 'border-l-4 border-alert-600' : 'border-l-4 border-brand-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      a.urgent ? 'bg-red-50 text-alert-700' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                      <span className="text-xs text-gray-500">{a.time}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {a.description}
                    </p>
                    {a.urgent && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-alert-700">
                        ⚠️ 建议绕行
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
