import type { SpeechSentence } from '../types';

/**
 * BroadcastTextBox —— 播报文本框
 * 无障碍约束：
 *  - 当前朗读句实时高亮（颜色 + 加粗 + 左侧指示条三重信号）
 *  - 容器 aria-live="polite" 让屏幕阅读器同步播报
 *  - 可点击句子“重读该句”，点击目标 ≥ 44px
 */
interface BroadcastTextBoxProps {
  sentences: SpeechSentence[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function BroadcastTextBox({
  sentences,
  currentIndex,
  onSelect,
}: BroadcastTextBoxProps) {
  return (
    <section
      aria-label="播报文本内容"
      aria-live="polite"
      className="card-surface relative overflow-hidden p-5 sm:p-6"
    >
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
        <span aria-hidden="true" className="h-6 w-1.5 rounded-full bg-brand-500" />
        播报文本
      </h2>
      <p className="mb-4 text-sm text-gray-600">点击任意句子可重新朗读该句。</p>

      <ol className="space-y-2">
        {sentences.map((s, idx) => {
          const active = idx === currentIndex;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(idx)}
                aria-current={active ? 'true' : undefined}
                aria-label={`第 ${idx + 1} 句：${s.text}${active ? '（正在朗读）' : ''}`}
                className={`focus-ring min-h-[44px] w-full rounded-xl px-4 py-2 text-left text-base leading-relaxed transition-colors ${
                  active
                    ? 'border-l-4 border-brand-600 bg-brand-50 font-semibold text-brand-900'
                    : 'border-l-4 border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s.text}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
