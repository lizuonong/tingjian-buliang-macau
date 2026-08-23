import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

/**
 * A11yCard —— 多选/单选需求卡片
 * 无障碍约束：
 *  - 使用原生 button + aria-pressed 表达开关状态（而非仅靠颜色）
 *  - 选中态 = 勾选图标 + 加粗边框 + 背景变化（三重信号，不依赖单一颜色）
 *  - 最小触控区不小于 64px 高
 */
interface A11yCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onToggle: () => void;
}

export default function A11yCard({
  title,
  description,
  icon,
  selected,
  onToggle,
}: A11yCardProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`${title}：${description}`}
      onClick={onToggle}
      className={`focus-ring group relative flex min-h-[88px] w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 ${
        selected
          ? 'border-[3px] border-brand-600 bg-brand-50 shadow-card-lg'
          : 'border-2 border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
      }`}
    >
      {/* 图标容器（本身不承担交互，无需可聚焦） */}
      <span
        aria-hidden="true"
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors ${
          selected
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {icon}
      </span>

      <span className="flex-1">
        <span
          className={`block text-lg font-semibold ${
            selected ? 'text-brand-800' : 'text-gray-900'
          }`}
        >
          {title}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-gray-600">
          {description}
        </span>
      </span>

      {/* 勾选图标：选中时出现（不只靠边框颜色） */}
      <span
        aria-hidden="true"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          selected
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-gray-300 bg-white text-transparent group-hover:border-brand-400'
        }`}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
    </button>
  );
}
