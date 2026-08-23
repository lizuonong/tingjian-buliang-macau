import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * IconButton —— 通用图标按钮
 * 无障碍约束：
 *  - 最小 Hit Target 44x44px
 *  - 必须提供 aria-label（非文本元素描述）
 *  - 键盘聚焦时显示 focus-visible ring
 */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // aria-label 必填
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode; // 图标
}

const sizeMap = {
  sm: 'h-hit w-hit', // 44px
  md: 'h-hit-lg w-hit-lg', // 52px
  lg: 'h-hit-xl w-hit-xl', // 64px 大颗粒按钮
};

const variantMap = {
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20 hover:from-brand-400 hover:to-brand-500 active:from-brand-600 active:to-brand-700',
  secondary:
    'bg-white text-brand-700 border-2 border-brand-300 hover:border-brand-500 hover:bg-brand-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  danger: 'bg-alert-600 text-white hover:bg-alert-700',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, size = 'md', variant = 'primary', className = '', children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={`focus-ring inline-flex items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${sizeMap[size]} ${variantMap[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

export default IconButton;
