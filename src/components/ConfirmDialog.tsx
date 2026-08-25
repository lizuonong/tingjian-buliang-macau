import { useEffect, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * ConfirmDialog —— 通用确认弹窗（发送前二次确认）
 *
 * 使用场景：即将执行重要/危险操作（如发送紧急求助）前，弹出确认框，
 * 由用户明确「确定」后才真正发送，防止误触。
 *
 * 无障碍约束：
 *  - role="alertdialog" + aria-modal，阻塞背景交互
 *  - 打开时自动聚焦「取消」按钮（安全默认，避免误按 Enter 直接确认危险操作）
 *  - Esc 触发取消
 *  - body 滚动锁定，关闭后恢复
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  icon?: ReactNode;
  /** 主确认按钮文案，默认「确定发送」 */
  confirmText?: string;
  /** 取消按钮文案，默认「取消」 */
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  icon,
  confirmText = '确定发送',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  /** 打开时锁滚动并聚焦安全的「取消」按钮 */
  useEffect(() => {
    if (open) {
      cancelBtnRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /** Esc 关闭 */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 半透明遮罩：点击遮罩等同取消 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* 弹窗主体 */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby="confirm-dialog-desc"
        className="animate-fade-in relative w-full max-w-sm rounded-2xl border-2 border-alert-600 bg-white p-6 text-center shadow-card-lg"
      >
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-alert-600"
          >
            {icon ?? <ShieldAlert className="h-9 w-9" />}
          </span>

          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p id="confirm-dialog-desc" className="text-base leading-relaxed text-gray-600">
            {description}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="focus-ring min-h-[52px] flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 text-base font-semibold text-gray-800 transition-colors hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="focus-ring min-h-[52px] flex-1 rounded-xl bg-alert-600 px-4 text-base font-bold text-white shadow-md shadow-alert-500/20 transition-colors hover:bg-alert-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
