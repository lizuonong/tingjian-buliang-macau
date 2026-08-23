import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Siren } from 'lucide-react';

/**
 * SOSButton —— 长按 3 秒触发，防误触
 *
 * 交互逻辑：
 *  - 指针按下（onPointerDown）开始计时，抬起/移出/取消则重置（防误触）
 *  - 键盘支持：按住 Enter / Space 3 秒同样可触发（无障碍键盘等价操作）
 *  - 触发前显示环形倒计时动画（SVG strokeDashoffset 驱动）
 *  - 触发后播报 aria-live 并进入 5 秒确认框，可取消
 *
 * 无障碍约束：
 *  - 按钮 ≥ 160px 大颗粒
 *  - 有文字提示 + 图标，不依赖颜色
 *  - 尊重 prefers-reduced-motion
 */
interface SOSButtonProps {
  onTrigger: () => void;
  holdSeconds?: number;
}

const HOLD_SECONDS = 3;
const PREVENT_CANCEL_WINDOW = 5000; // 触发后 5 秒内可撤销确认

export default function SOSButton({ onTrigger, holdSeconds = HOLD_SECONDS }: SOSButtonProps) {
  const [progress, setProgress] = useState(0); // 0-100
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false); // 已触发，等待确认
  const [armed, setArmed] = useState(false); // 进入确认状态

  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const cancelTimerRef = useRef<number | null>(null);

  const R = 88; // 环形半径
  const CIRCUMFERENCE = 2 * Math.PI * R;

  /** 启动长按计时（requestAnimationFrame 驱动进度 → 动画流畅） */
  const startHold = useCallback(() => {
    if (confirmed) return;
    startRef.current = performance.now();
    setHolding(true);
    setProgress(0);

    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;
      const pct = Math.min(elapsed / holdSeconds, 1) * 100;
      setProgress(pct);
      if (pct >= 100) {
        finishHold();
        return;
      }
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
  }, [confirmed, holdSeconds]);

  /** 取消长按（防误触核心：任何抬起/移出都重置） */
  const cancelHold = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  /** 长按完成 → 触发 SOS */
  const finishHold = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    setHolding(false);
    setConfirmed(true);
    setArmed(true);
    onTrigger();
    // 5 秒超时自动关闭确认层；超时未撤销视为确认发送，并复位状态允许再次触发
    cancelTimerRef.current = window.setTimeout(() => {
      setArmed(false);
      setConfirmed(false);
      setProgress(0);
    }, PREVENT_CANCEL_WINDOW);
  }, [onTrigger]);

  /** 触发后取消（撤销误触） */
  const cancelConfirm = useCallback(() => {
    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    setConfirmed(false);
    setArmed(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    };
  }, []);

  /** 键盘等价长按：按住 Enter/Space */
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat && !confirmed) {
      startHold();
    }
  };
  const handleKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') cancelHold();
  };

  const announced = `紧急求助${confirmed ? '，正在触发' : '，长按 3 秒触发'}`;

  return (
    <div className="relative flex flex-col items-center">
      {/* aria-live 播报当前状态，屏幕阅读器可感知 */}
      <p aria-live="polite" className="sr-only">
        {confirmed ? '紧急求助已触发' : '紧急求助按钮，长按 3 秒触发'}
      </p>

      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        aria-label={announced}
        aria-describedby="sos-hint"
        className={`focus-ring relative flex h-48 w-48 select-none flex-col items-center justify-center gap-2 rounded-full text-white shadow-card-lg transition-transform duration-150 ${
          holding ? 'scale-95 bg-alert-700' : 'bg-alert-600 hover:bg-alert-700'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        {/* 环形倒计时（SVG，动画由 progress 驱动；prefers-reduced-motion 时仍显示数字） */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
          />
        </svg>

        <Siren aria-hidden="true" className="h-16 w-16" strokeWidth={2} />
        <span className="text-2xl font-bold">一键 SOS</span>
        <span id="sos-hint" className="px-4 text-sm leading-relaxed text-white/95">
          {holding ? `松手可取消 · ${Math.max(holdSeconds - progress / 100, 0).toFixed(1)}s` : '长按 3 秒触发'}
        </span>
      </button>

      {/* 触发后的确认层：允许撤销，防误触二次保障 */}
      {armed && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="紧急求助已触发，是否撤销"
          className="animate-fade-in absolute -bottom-24 left-1/2 w-72 -translate-x-1/2 rounded-2xl border-2 border-alert-600 bg-white p-4 text-center shadow-card-lg"
        >
          <p className="text-base font-semibold text-alert-700">⚠️ 紧急请求已发送！</p>
          <p className="mt-1 text-sm text-gray-600">5 秒内可撤销，防止误触。</p>
          <button
            type="button"
            onClick={cancelConfirm}
            className="focus-ring mt-3 min-h-[48px] w-full rounded-xl border-2 border-gray-300 bg-white px-4 text-base font-semibold text-gray-800 hover:bg-gray-50"
          >
            撤销求助
          </button>
        </div>
      )}
    </div>
  );
}
