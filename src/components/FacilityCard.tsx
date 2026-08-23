import type { LucideIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { Facility } from '../types';

/**
 * FacilityCard —— 景点设施卡片
 * 展示无障碍设施（入口/升降梯/卫生间等）并附带状态标签
 */
interface FacilityCardProps {
  facility: Facility;
  icon: LucideIcon;
}

export default function FacilityCard({ facility, icon: Icon }: FacilityCardProps) {
  return (
    <li className="card-surface flex min-h-[96px] items-center gap-4 p-4">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"
      >
        <Icon className="h-7 w-7" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-gray-900">{facility.name}</h3>
        {facility.note && (
          <p className="mt-0.5 truncate text-sm text-gray-600">{facility.note}</p>
        )}
      </div>

      <StatusBadge status={facility.status} text={facility.statusText} />
    </li>
  );
}
