import { Camera, MessageSquareText, PenLine, Utensils, Signpost } from 'lucide-react';
import { useState } from 'react';
import FlipCard from '../components/FlipCard';
import PageHeader from '../components/PageHeader';
import type { RecognitionResult } from '../types';

/**
 * 06 听障沟通助手 (Hearing Assistant)
 * - 拍照识别：菜单 / 路牌识别 → 识别结果卡片（可翻转、可全屏大字展示）
 * - 打字沟通：输入文字后一键大字展示，方便直接出示给他人
 */

const MOCK_MENU: RecognitionResult = {
  id: 'menu-1',
  kind: 'menu',
  title: '餐厅菜单识别',
  lines: [
    '招牌猪扒包 —— 28 澳门元',
    '葡式蛋挞（2 件）—— 20 澳门元',
    '冻柠茶 —— 16 澳门元',
    '今日特价：咖喱牛杂 —— 35 澳门元',
  ],
  confidence: 0.96,
  capturedAt: '刚刚',
};

const MOCK_SIGN: RecognitionResult = {
  id: 'sign-1',
  kind: 'sign',
  title: '路牌识别',
  lines: ['议事亭前地', '→ 左侧 100 米', '大三巴牌坊 ↗ 直行 400 米'],
  confidence: 0.98,
  capturedAt: '刚刚',
};

export default function HearingAssistant() {
  const [results, setResults] = useState<RecognitionResult[]>([MOCK_MENU]);
  const [typedText, setTypedText] = useState('');
  const [typingLarge, setTypingLarge] = useState(false);

  /** 模拟拍照识别（真实实现中接入摄像头 + OCR） */
  const capture = (kind: 'menu' | 'sign') => {
    const mock = kind === 'menu' ? MOCK_MENU : MOCK_SIGN;
    setResults((prev) => [
      { ...mock, id: `${mock.id}-${Date.now()}`, capturedAt: '刚刚' },
      ...prev,
    ]);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        icon={<MessageSquareText className="h-6 w-6" />}
        title="听障沟通助手"
        subtitle="拍照识别菜单、路牌，或直接打字沟通；所有结果均可一键全屏大字展示，方便出示给他人。"
      />

      {/* 拍照区 */}
      <section aria-labelledby="capture-heading" className="card-surface p-5">
        <h2 id="capture-heading" className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Camera aria-hidden="true" className="h-5 w-5 text-brand-600" />
          拍照识别
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          点击下方按钮，模拟打开相机拍照并识别对应内容。
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => capture('menu')}
            className="focus-ring flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-gray-800 hover:border-brand-400 hover:bg-brand-50"
          >
            <span className="flex items-center gap-2">
              <Camera aria-hidden="true" className="h-5 w-5 text-alert-600" />
              <Utensils aria-hidden="true" className="h-8 w-8 text-brand-600" />
            </span>
            <span className="text-base font-semibold">拍照识别菜单</span>
          </button>
          <button
            type="button"
            onClick={() => capture('sign')}
            className="focus-ring flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-gray-800 hover:border-brand-400 hover:bg-brand-50"
          >
            <span className="flex items-center gap-2">
              <Camera aria-hidden="true" className="h-5 w-5 text-alert-600" />
              <Signpost aria-hidden="true" className="h-8 w-8 text-brand-600" />
            </span>
            <span className="text-base font-semibold">拍照识别路牌</span>
          </button>
        </div>
      </section>

      {/* 识别结果列表 */}
      <section aria-label="识别结果" className="space-y-4">
        {results.map((r) => (
          <FlipCard key={r.id} result={r} />
        ))}
      </section>

      {/* 打字沟通 */}
      <section aria-labelledby="type-heading" className="card-surface p-5">
        <h2 id="type-heading" className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
          <PenLine aria-hidden="true" className="h-5 w-5 text-brand-600" />
          打字沟通
        </h2>
        <label htmlFor="type-input" className="mb-2 block text-sm font-medium text-gray-700">
          输入想说的话，展示给对方看
        </label>
        <textarea
          id="type-input"
          rows={3}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder="例如：请问洗手间在哪里？"
          className="focus-ring w-full rounded-xl border-2 border-gray-300 bg-white p-3 text-base leading-relaxed text-gray-900 placeholder:text-gray-400"
        />
        <button
          type="button"
          disabled={typedText.trim().length === 0}
          onClick={() => setTypingLarge(true)}
          className="focus-ring mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-base font-bold text-white shadow-md shadow-brand-500/20 hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MessageSquareText aria-hidden="true" className="h-5 w-5" />
          全屏大字展示
        </button>
      </section>

      {/* 打字内容全屏大字模态 */}
      {typingLarge && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="大字展示输入内容"
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between bg-gray-900 p-3">
            <span className="text-base font-semibold text-white">给对方看</span>
            <button
              type="button"
              onClick={() => setTypingLarge(false)}
              className="focus-ring min-h-[44px] rounded-lg px-4 text-base font-semibold text-white hover:bg-white/10"
            >
              关闭 ✕
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 text-center">
            <p className="text-a11y-3xl font-bold leading-snug text-white">
              {typedText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
