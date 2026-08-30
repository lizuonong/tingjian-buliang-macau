import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { MenuItem } from '../api/vision';

/**
 * OrderCard —— 内嵌在聊天气泡里的「点餐小列表」
 *
 * 将菜单识别结果（结构化菜品字段）渲染为紧凑列表，贴合在 AI 消息气泡内。
 * 用「加 / 减」按钮调节每道菜的点餐数量（0 表示未点），
 * 点击底部「全屏展示」将所选菜品按数量全屏大字展示给他人看。
 *
 * 无障碍约束：
 *  - 加减按钮均为独立可聚焦按钮，带 aria-label 与 44px 触控区
 *  - 数量变化用 aria-live 播报，不依赖颜色
 *  - 全屏模态 role="dialog" aria-modal + Esc 关闭 + 焦点管理
 */
interface OrderCardProps {
  menu: MenuItem[];
  summary?: string;
}

export default function OrderCard({ menu, summary }: OrderCardProps) {
  /** 每道菜的数量，0 表示未点 */
  const [qty, setQty] = useState<Record<number, number>>({});
  const [fullscreen, setFullscreen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /** 增加数量 */
  const inc = (idx: number) => setQty((p) => ({ ...p, [idx]: (p[idx] ?? 0) + 1 }));
  /** 减少数量（最低 0） */
  const dec = (idx: number) => setQty((p) => ({ ...p, [idx]: Math.max(0, (p[idx] ?? 0) - 1) }));

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

  /** 选了数量 > 0 的菜品（按原顺序） */
  const selectedItems = menu.map((item, i) => ({ item, qty: qty[i] ?? 0 })).filter((x) => x.qty > 0);
  const totalCount = selectedItems.reduce((s, x) => s + x.qty, 0);

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

        {/* 菜品列表（加减数量） */}
        <ul className="divide-y divide-gray-100">
          {menu.map((item, idx) => {
            const n = qty[idx] ?? 0;
            return (
              <li key={idx} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">
                    {item.name}
                  </span>
                  {item.detail && (
                    <span className="block truncate text-xs text-gray-500">{item.detail}</span>
                  )}
                  {item.price && (
                    <span className="mt-0.5 block text-xs font-bold text-brand-700">{item.price}</span>
                  )}
                </span>

                {/* 加减数量控制 */}
                <span className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label={`减少${item.name}数量`}
                    onClick={() => dec(idx)}
                    disabled={n === 0}
                    className="focus-ring flex h-11 w-11 items-center justify-center rounded-lg border-2 border-gray-200 bg-white text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus aria-hidden="true" className="h-5 w-5" />
                  </button>
                  <span
                    className="min-w-[24px] text-center text-base font-bold text-gray-900"
                    aria-live="polite"
                  >
                    {n}
                  </span>
                  <button
                    type="button"
                    aria-label={`增加${item.name}数量`}
                    onClick={() => inc(idx)}
                    className="focus-ring flex h-11 w-11 items-center justify-center rounded-lg border-2 border-brand-300 bg-brand-50 text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-100"
                  >
                    <Plus aria-hidden="true" className="h-5 w-5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>

        {/* 底部：提示 + 全屏展示按钮 */}
        <div className="border-t border-gray-100 px-3 py-2.5">
          {summary && <p className="mb-2 text-xs leading-relaxed text-gray-500">{summary}</p>}
          <button
            type="button"
            disabled={totalCount === 0}
            onClick={() => setFullscreen(true)}
            className="focus-ring inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 px-3 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-colors hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Maximize2 aria-hidden="true" className="h-4 w-4" />
            全屏展示（{totalCount} 份）
          </button>
        </div>
      </div>

      {/* 全屏大字展示所选菜品 */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="全屏展示点餐"
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between bg-gray-900 p-3">
            <span className="text-base font-semibold text-white">我的点餐（{totalCount} 份）</span>
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
              {selectedItems.map(({ item, qty }) => (
                <li key={`${item.name}-${item.price}`}>
                  <p className="text-a11y-3xl font-bold leading-snug text-white">
                    {item.name} × {qty}
                  </p>
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
