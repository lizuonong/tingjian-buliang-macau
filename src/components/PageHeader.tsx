import type { ReactNode } from 'react';

/**
 * PageHeader —— 页面标题区
 * 无障碍约束：
 *  - 使用 <header> + <h1> 语义结构
 *  - subtitle 描述提供给所有用户（不只依赖图标）
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20"
          >
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
