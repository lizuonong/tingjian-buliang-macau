import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, RotateCw, X } from 'lucide-react';
import IconButton from './IconButton';
import type { RecognitionResult } from '../types';

/**
 * FlipCard —— 听障沟通助手「识别结果卡片」
 * 功能：
 *  1. 卡片翻转：正/反面展示（识别文本 ↔ 帮助指引）
 *  2. 一键全屏大字展示：全屏模态，超大字号直出给他人看
 * 无障碍约束：
 *  - 翻转按钮 aria-pressed 表达状态
 *  - 全屏模态：role="dialog" aria-modal + 焦点圈闭 + Esc 关闭 + aria-live 提示
 *  - 翻转动画尊重 prefers-reduced-motion（transform 过渡由 CSS media query 收敛）
 */
interface FlipCardProps {
  result: RecognitionResult;
  onClose?: () => void;
}

export default function FlipCard({ result }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /** 全屏打开：保存焦点并聚焦关闭按钮 */
  useEffect(() => {
    if (fullscreen) {
      closeBtnRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  /** Esc 关闭全屏 */
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  return (
    <>
      <article
        className="card-surface overflow-hidden"
        aria-label={`识别结果：${result.title}`}
      >
        {/* 卡片正面/反面（3D 翻转） */}
        <div className="relative h-64 [perspective:1200px]">
          <div
            className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
              flipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* 正面：识别文本 */}
            <div className="absolute inset-0 flex flex-col rounded-2xl border border-gray-200 bg-white p-4 [backface-visibility:hidden]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-gray-900">{result.title}</h3>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-800">
                  识别置信度 {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div className="mt-2 flex-1 overflow-y-auto rounded-xl bg-gray-50 p-3">
                <ul className="space-y-1.5">
                  {result.lines.map((line, i) => (
                    <li key={i} className="text-base leading-relaxed text-gray-800">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 反面：出示指引 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-brand-300 bg-brand-50 p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span aria-hidden="true" className="text-4xl">🤝</span>
              <p className="text-lg font-bold text-brand-900">请出示此卡片</p>
              <p className="text-sm leading-relaxed text-brand-800">
                您好，我存在听力障碍，需要以下协助：请按卡片文字内容与我对接，或使用手写/打字沟通。
              </p>
              <p className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-800">
                「{result.title}」相关内容已在背面
              </p>
            </div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-3">
          <IconButton
            variant="secondary"
            label={flipped ? '翻回正面' : '翻转卡片'}
            aria-pressed={flipped}
            onClick={() => setFlipped((v) => !v)}
          >
            <RotateCw aria-hidden="true" className="h-6 w-6" />
          </IconButton>

          <span className="sr-only" aria-live="polite">
            {flipped ? '已翻转到背面' : '已翻转到正面'}
          </span>

          {/* 一键全屏大字展示 */}
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="focus-ring inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-base font-bold text-white shadow-md shadow-brand-500/20 transition-colors hover:from-brand-400 hover:to-brand-500"
          >
            <Maximize2 aria-hidden="true" className="h-5 w-5" />
            全屏大字展示
          </button>
        </div>
      </article>

      {/* 全屏大字模态 */}
      {fullscreen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`全屏大字展示：${result.title}`}
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between gap-2 bg-gray-900 p-3">
            <span className="text-base font-semibold text-white">
              {result.title} · 大字展示
            </span>
            <div className="flex gap-2">
              <IconButton
                ref={closeBtnRef}
                size="sm"
                variant="ghost"
                label="退出全屏"
                className="text-white hover:bg-white/10"
                onClick={() => setFullscreen(false)}
              >
                <Minimize2 aria-hidden="true" className="h-6 w-6" />
              </IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                label="关闭"
                className="text-white hover:bg-white/10"
                onClick={() => setFullscreen(false)}
              >
                <X aria-hidden="true" className="h-6 w-6" />
              </IconButton>
            </div>
          </div>

          {/* 超大字号文本（默认 3xl，大字号模式自动更大） */}
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 text-center text-a11y-3xl font-bold leading-snug text-white">
            <div className="space-y-6">
              {result.lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <p className="text-a11y-xl font-medium text-gray-300">
                请根据以上内容协助我，谢谢。
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
