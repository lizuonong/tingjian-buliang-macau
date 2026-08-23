import { CircleCheck, CircleAlert, CircleX } from 'lucide-react';
import type { FacilityStatus } from '../types';

/**
 * StatusBadge —— 状态标签
 * 无障碍约束：
 *  - 状态 = 图标 + 文字，绝不只靠颜色表达（WCAG 1.4.1 Use of Color）
 *  - 深色文字保证 ≥ 4.5:1 对比度
 */
interface StatusBadgeProps {
  status: FacilityStatus;
  text: string;
}

const config: Record<
  FacilityStatus,
  { icon: typeof CircleCheck; cls: string }
> = {
  open: {
    icon: CircleCheck,
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  maintenance: {
    icon: CircleAlert,
    cls: 'bg-amber-50 text-amber-800 border-amber-400',
  },
  closed: {
    icon: CircleX,
    cls: 'bg-red-50 text-red-800 border-red-300',
  },
};

export default function StatusBadge({ status, text }: StatusBadgeProps) {
  const { icon: Icon, cls } = config[status];
  return (
    <span
      className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${cls}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
      {text}
    </span>
  );
}
