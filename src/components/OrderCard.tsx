import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Maximize2 } from 'lucide-react';
import type { MenuItem } from '../api/vision';

/**
 * OrderCard —— 内嵌在聊天气泡里的「点餐小列表」
 *
 * 将菜单识别结果（结构化菜品字段）渲染为紧凑的可勾选列表，
 * 贴合在 AI 消息气泡内；选中若干餐品后可一键全屏大字展示给他人看
 * （例如递给服务员）。
 *
 * 无障碍约束：
 *  - 每个菜品为 role="checkbox" + aria-checked，勾选状态不依赖颜色
 *  - 全屏模态 role="dialog" aria-modal + Esc 关闭 + 焦点管理 + aria-live 播报
 */
interface OrderCardProps {
  menu: MenuItem[];
  summary?: string;
}

export default function OrderCard({ menu, summary }: OrderCardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /** 切换某道菜的选中状态 */
  const toggleItem = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  /** 全屏大字模态：Esc 关闭 + 锁定滚动 + 聚焦关闭按钮 */
  useEffect(() => {
    if (!fullscreen) return;
    closeBtnRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  /** 选中的菜品（按原顺序） */
  const selectedItems = menu.filter((_, i) => selected.has(i));
  const selectedCount = selectedItems.length;

  return (
    <>
      {/* 内嵌点餐小列表（贴合 AI 气泡样式） */}
      <div
        aria-label="点餐列表"
        className="w-[88%] max-w-sm overflow-hidden rounded-2xl border border-brand-200 bg-white"
      >
        {/* 列表表头 */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-brand-50 px-3 py-2">
          <h3 className="text-sm font-bold text-brand-800">🍽 点餐</h3>
          <span className="text-xs font-medium text-gray-500">共 {menu.length} 道</span>
        </div>

        {/* 菜品列表（可勾选） */}
        <ul className="divide-y divide-gray-100">
          {menu.map((item, idx) => {
            const checked = selected.has(idx);
            return (
              <li key={idx}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={`${item.name}${item.price ? `，${item.price}` : ''}${checked ? '，已勾选' : ''}`}
                  onClick={() => toggleItem(idx)}
                  className={`focus-ring flex min-h-[48px] w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    checked ? 'bg-brand-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 ${checked ? 'text-brand-600' : 'text-gray-300'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {item.name}
                    </span>
                    {item.detail && (
                      <span className="block truncate text-xs text-gray-500">{item.detail}</span>
                    )}
                  </span>
                  {item.price && (
                    <span className="shrink-0 text-sm font-bold text-brand-700">{item.price}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* 底部：提示 + 全屏展示按钮 */}
        <div className="border-t border-gray-100 px-3 py-2.5">
          {summary && <p className="mb-2 text-xs leading-relaxed text-gray-500">{summary}</p>}
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => setFullscreen(true)}
            className="focus-ring inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 px-3 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-colors hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Maximize2 aria-hidden="true" className="h-4 w-4" />
            全屏展示选中（{selectedCount}）
          </button>
        </div>
      </div>

      {/* 全屏大字展示选中的餐品 */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="全屏展示点餐"
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between bg-gray-900 p-3">
            <span className="text-base font-semibold text-white">
              我的点餐（{selectedCount} 道）
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setFullscreen(false)}
              className="focus-ring min-h-[44px] rounded-lg px-4 text-base font-semibold text-white hover:bg-white/10"
            >
              关闭 ✕
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6">
            <ol className="space-y-5 text-center">
              {selectedItems.map((item) => (
                <li key={`${item.name}-${item.price}`}>
                  <p className="text-a11y-3xl font-bold leading-snug text-white">{item.name}</p>
                  {item.detail && (
                    <p className="mt-1 text-a11y-xl leading-relaxed text-gray-300">{item.detail}</p>
                  )}
                  {item.price && (
                    <p className="mt-1 text-a11y-xl font-semibold text-brand-300">{item.price}</p>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-8 text-a11y-xl text-gray-400" aria-live="polite">
              就这些，谢谢！
            </p>
          </div>
        </div>
      )}
    </>
  );
}
