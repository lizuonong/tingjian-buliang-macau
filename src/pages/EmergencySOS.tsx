import { BatteryLow, HeartPulse, ShieldAlert, TrafficCone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import SOSButton from '../components/SOSButton';
import PageHeader from '../components/PageHeader';
import type { SOSCategory, SOSQuickItem } from '../types';

/**
 * 07 一键 SOS (Emergency Assistance)
 * - 核心：长按 3 秒触发（SOSButton 内含防误触逻辑 + 倒计时动画）
 * - 高频求助快捷项：道路受阻 / 身体不适 / 设备损坏 大字号快速选择卡片
 */

const QUICK_ITEMS: SOSQuickItem[] = [
  {
    id: 'blocked',
    title: '道路受阻',
    description: '坡道/电梯故障或路面施工，无法通行',
  },
  {
    id: 'unwell',
    title: '身体不适',
    description: '需要就近医疗点或工作人员协助',
  },
  {
    id: 'device',
    title: '设备损坏',
    description: '轮椅/助听器/导盲设备出现故障',
  },
  {
    id: 'emergency',
    title: '紧急求助',
    description: '直接呼叫景区应急服务与 999',
  },
];

const QUICK_ICONS: Record<SOSCategory, ReactNode> = {
  blocked: <TrafficCone className="h-8 w-8" />,
  unwell: <HeartPulse className="h-8 w-8" />,
  device: <BatteryLow className="h-8 w-8" />,
  emergency: <ShieldAlert className="h-8 w-8" />,
};

export default function EmergencySOS() {
  const [sentCategory, setSentCategory] = useState<SOSCategory | null>(null);

  /** 发送快速求助（模拟） */
  const sendQuickHelp = (cat: SOSCategory) => {
    setSentCategory(cat);
    window.setTimeout(() => setSentCategory(null), 6000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        icon={<ShieldAlert className="h-6 w-6" />}
        title="一键 SOS"
        subtitle="紧急时使用。长按 3 秒触发，期间松手即可取消，防止误触。"
      />

      {/* 长按触发按钮 */}
      <section
        aria-label="长按紧急求助"
        className="card-surface flex flex-col items-center gap-4 p-6 sm:p-8"
      >
        <SOSButton onTrigger={() => setSentCategory('emergency')} />
        <p className="max-w-md text-center text-sm leading-relaxed text-gray-600">
          「{sentCategory === 'emergency' ? '已向景区应急中心发送定位与求助' : '按住按钮 3 秒触发'}」
        </p>
      </section>

      {/* 高频求助快捷项 */}
      <section aria-labelledby="quick-heading">
        <h2
          id="quick-heading"
          className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900"
        >
          <ShieldAlert aria-hidden="true" className="h-5 w-5 text-brand-600" />
          高频求助快捷项
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_ITEMS.map((item) => {
            const sent = sentCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => sendQuickHelp(item.id)}
                className={`focus-ring flex min-h-[96px] flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all ${
                  sent
                    ? 'border-alert-600 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-brand-400 hover:bg-brand-50'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700"
                >
                  {QUICK_ICONS[item.id]}
                </span>
                <span className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  {item.title}
                  {sent && (
                    <span
                      aria-hidden="true"
                      className="rounded-full bg-alert-600 px-2.5 py-0.5 text-xs font-bold text-white"
                    >
                      已发送
                    </span>
                  )}
                </span>
                <span className="text-sm leading-relaxed text-gray-600">{item.description}</span>
              </button>
            );
          })}
        </div>

        {/* 发送反馈（aria-live 播报） */}
        <p role="status" aria-live="polite" className="mt-3 sr-only">
          {sentCategory ? `已发送「${QUICK_ITEMS.find((i) => i.id === sentCategory)?.title}」求助` : ''}
        </p>
      </section>

      {/* 使用提示 */}
      <section
        aria-label="使用提示"
        className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-5"
      >
        <h3 className="text-base font-bold text-brand-900">使用提示</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand-900">
          <li>按住红色按钮满 3 秒即发出求助，中途松手立即取消。</li>
          <li>触发后 5 秒内可点击「撤销求助」，进一步防误触。</li>
          <li>发送的内容包含您的实时定位与所选障碍类型。</li>
        </ul>
      </section>
    </div>
  );
}
