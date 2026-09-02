import { BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCasinoProximity } from '../hooks/useCasinoProximity';

/**
 * 賭場熔斷 → 溫馨提醒
 *
 * 原《項目策劃書 8.2 主動熔斷機制》會在偵測到用戶進入博彩區時，
 * 「以最高系統權限強制關閉相機權限、凍結 AI 視覺模塊」。
 * 現改為溫馨提醒：僅在用戶進入任一娛樂場中心約 50 米範圍時，
 * 彈出友善提示「請勿跟隨人流進入博彩區」，**不再強制關閉任何功能**。
 *
 * 提醒以多通道感知（視覺 + 屏幕閱讀器 + 語音 + 震動）照顧不同障礙群體，
 * 可手動關閉；離開範圍後會自動復位，允許下次再次提醒。
 */

/** 溫馨提醒文案（繁中，依用戶指定） */
const REMINDER_TEXT = '請勿跟隨人流進入博彩區';
/** 用戶手動關閉後的最低冷卻時間（毫秒） */
const COOLDOWN_MS = 60_000;

export default function CasinoReminder() {
  const { inZone, casino, distance } = useCasinoProximity();
  const [visible, setVisible] = useState(false);
  const [dismissedCasinoId, setDismissedCasinoId] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  // 離開提醒範圍：清空「已忽略」記錄，允許下次再次提醒
  useEffect(() => {
    if (!inZone) setDismissedCasinoId(null);
  }, [inZone]);

  // 顯示邏輯
  useEffect(() => {
    const shouldShow =
      inZone &&
      !!casino &&
      casino.id !== dismissedCasinoId &&
      Date.now() > cooldownUntil;
    setVisible(shouldShow);
  }, [inZone, casino, dismissedCasinoId, cooldownUntil]);

  // 觸發時：震動 + 語音播報（照顧視障用戶），內容透過 aria-live 通知讀屏
  useEffect(() => {
    if (!visible) return;
    // 輕度震動提示
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {
        /* noop */
      }
    }
    // 語音提醒
    if ('speechSynthesis' in window) {
      try {
        const u = new SpeechSynthesisUtterance(REMINDER_TEXT);
        u.lang = 'zh-HK';
        u.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch {
        /* noop */
      }
    }
  }, [visible]);

  const dismiss = () => {
    if (casino) setDismissedCasinoId(casino.id);
    setCooldownUntil(Date.now() + COOLDOWN_MS);
    setVisible(false);
  };

  if (!visible || !casino) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="casino-reminder mx-auto mt-2 flex max-w-2xl items-start gap-3 rounded-2xl p-4"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600"
      >
        <BellRing className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-snug">{REMINDER_TEXT}</p>
        <p className="mt-1 text-sm leading-relaxed">
          你已接近「{casino.name}」娛樂場周邊約 {Math.round(distance ?? 0)} 米。為保障安全與合規，請勿跟隨人流進入博彩區。
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="focus-ring min-h-[44px] shrink-0 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
      >
        我知道了
      </button>
    </div>
  );
}
