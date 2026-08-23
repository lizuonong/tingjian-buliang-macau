import { Accessibility, Eye, Ear, PersonStanding } from 'lucide-react';
import type { ReactNode } from 'react';
import A11yCard from '../components/A11yCard';
import PageHeader from '../components/PageHeader';
import { useA11y } from '../context/A11yContext';
import type { A11yNeed, A11yNeedItem } from '../types';

/**
 * 01 需求定制页 (Accessibility Setup)
 * - 多选卡片：行动障碍 / 视觉障碍 / 听觉障碍 / 长者模式
 * - 选中态：勾选图标 + 加粗边框 + 色块（三重信号）
 */

const NEED_ITEMS: A11yNeedItem[] = [
  {
    id: 'mobility',
    title: '行动障碍',
    description: '轮椅/拐杖出行，需要坡道、升降梯与平坦路线',
  },
  {
    id: 'visual',
    title: '视觉障碍',
    description: '需要语音导览、触觉指引与高对比度标识',
  },
  {
    id: 'hearing',
    title: '听觉障碍',
    description: '需要文字播报、视觉提示与手语/打字沟通',
  },
  {
    id: 'elderly',
    title: '长者模式',
    description: '大字体、慢步调导览与就近休息点推荐',
  },
];

const CARD_ICONS: Record<A11yNeed, ReactNode> = {
  mobility: <PersonStanding className="h-8 w-8" />,
  visual: <Eye className="h-8 w-8" />,
  hearing: <Ear className="h-8 w-8" />,
  elderly: <Accessibility className="h-8 w-8" />,
};

export default function AccessibilitySetup() {
  const { selectedNeeds, toggleNeed, clearNeeds, navigate } = useA11y();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        icon={<Accessibility className="h-6 w-6" />}
        title="无障碍需求定制"
        subtitle="选择您的出行需求，我们将为您智能推荐最合适的路线与辅助功能。可选择多项。"
      />

      {/* 需求多选卡片组（fieldset 语义归类） */}
      <fieldset>
        <legend className="mb-3 text-base font-semibold text-gray-900">
          请选择您的需求（可多选）
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {NEED_ITEMS.map((item) => (
            <A11yCard
              key={item.id}
              title={item.title}
              description={item.description}
              icon={CARD_ICONS[item.id]}
              selected={selectedNeeds.includes(item.id)}
              onToggle={() => toggleNeed(item.id)}
            />
          ))}
        </div>
      </fieldset>

      {/* 已选摘要（aria-live 播报） */}
      <div
        aria-live="polite"
        className="rounded-xl border border-gray-200 bg-white p-4"
      >
        <p className="text-sm font-semibold text-gray-900">
          已选择 {selectedNeeds.length} 项需求：
        </p>
        {selectedNeeds.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {selectedNeeds.map((id) => (
              <li
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-800"
              >
                {NEED_ITEMS.find((n) => n.id === id)?.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">尚未选择，跳过将以默认模式继续。</p>
        )}
        {selectedNeeds.length > 0 && (
          <button
            type="button"
            onClick={clearNeeds}
            className="focus-ring mt-3 inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-alert-700 underline-offset-4 hover:underline"
          >
            清空已选
          </button>
        )}
      </div>

      {/* 下一步 */}
      <button
        type="button"
        onClick={() => navigate('spot')}
        className="focus-ring flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 text-lg font-bold text-white shadow-md shadow-brand-500/20 transition-colors hover:from-brand-400 hover:to-brand-500 active:from-brand-600 active:to-brand-700"
      >
        开始探索澳门 →
      </button>
    </div>
  );
}
