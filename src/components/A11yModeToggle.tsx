import { Type, Contrast } from 'lucide-react';
import { useA11y } from '../context/A11yContext';

/**
 * A11yModeToggle —— 无障碍模式快速切换（大字号 / 高对比度）
 * 无障碍约束：
 *  - 切换按钮 aria-pressed 表达状态
 *  - 文字标签 + 图标双编码
 *  - 状态切换会立即反馈到 <html> class，全局生效
 */
export default function A11yModeToggle() {
  const { largeText, highContrast, toggleLargeText, toggleHighContrast } = useA11y();

  return (
    <div role="group" aria-label="无障碍显示模式" className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={largeText}
        aria-label={largeText ? '关闭大字号模式' : '开启大字号模式'}
        onClick={toggleLargeText}
        className={`focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 text-sm font-semibold transition-colors ${
          largeText
            ? 'border-brand-600 bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20'
            : 'border-gray-300 bg-white text-gray-700 hover:border-brand-400'
        }`}
      >
        <Type aria-hidden="true" className="h-5 w-5" />
        大字号
      </button>

      <button
        type="button"
        aria-pressed={highContrast}
        aria-label={highContrast ? '关闭高对比度模式' : '开启高对比度模式'}
        onClick={toggleHighContrast}
        className={`focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 text-sm font-semibold transition-colors ${
          highContrast
            ? 'border-brand-600 bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20'
            : 'border-gray-300 bg-white text-gray-700 hover:border-brand-400'
        }`}
      >
        <Contrast aria-hidden="true" className="h-5 w-5" />
        高对比度
      </button>
    </div>
  );
}
