import { Maximize2, MessageSquareText, Send, Signpost, Utensils } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FlipCard from '../components/FlipCard';
import IconButton from '../components/IconButton';
import PageHeader from '../components/PageHeader';
import type { RecognitionResult } from '../types';
/**
 * 06 听障沟通助手 (Hearing Assistant) —— 聊天记录式界面
 *
 * 像即时通讯一样交流：上方为聊天消息气泡（可滚动、新消息自动到底），
 * 下方为快捷识别工具（菜单 / 路牌）与文本输入栏。
 *
 * 保留的必要功能：
 *  1. 拍照识别（菜单 / 路牌）→ 生成识别结果卡片消息（FlipCard，可翻转 / 全屏大字出示）
 *  2. 打字沟通 → 发送文本消息
 *  3. 全屏大字展示 → 识别结果卡片、用户文本消息均可一键全屏大字出示给他人
 */

/** 消息类型：文本 或 识别结果 */
type ChatMessage =
  | { id: string; role: 'user' | 'assistant'; kind: 'text'; text: string }
  | { id: string; role: 'assistant'; kind: 'recognition'; result: RecognitionResult };

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
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      kind: 'text',
      text: '您好！我可以帮您拍照识别菜单、路牌，也能直接打字沟通。识别结果可一键全屏大字展示，方便直接出示给他人。',
    },
  ]);
  const [input, setInput] = useState('');
  const [fullscreenText, setFullscreenText] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return `m${idRef.current}`;
  };

  /** 新消息自动滚动到底部 */
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  /** 全屏大字模态：Esc 关闭 + 锁定滚动 + 聚焦关闭按钮 */
  useEffect(() => {
    if (!fullscreenText) return;
    closeBtnRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenText(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fullscreenText]);

  /** 发送文本消息（打字沟通） */
  const sendText = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', kind: 'text', text }]);
    setInput('');
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          kind: 'text',
          text: '已收到。您可点击下方「大字展示」把这段话直接出示给对方看。',
        },
      ]);
    }, 400);
  };

  /** 拍照识别（菜单 / 路牌）→ 生成识别结果卡片消息 */
  const capture = (kind: 'menu' | 'sign') => {
    const mock = kind === 'menu' ? MOCK_MENU : MOCK_SIGN;
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: 'assistant',
        kind: 'recognition',
        result: { ...mock, id: `${mock.id}-${Date.now()}`, capturedAt: '刚刚' },
      },
    ]);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        icon={<MessageSquareText className="h-6 w-6" />}
        title="沟通助手"
        subtitle="像聊天一样交流，识别结果可全屏大字出示。"
      />

      {/* 聊天记录（可滚动，新消息自动到底） */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className="card-surface h-[52vh] space-y-3 overflow-y-auto p-4"
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.kind === 'recognition' ? (
              <FlipCard result={msg.result} />
            ) : (
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-base leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white'
                      : 'border border-gray-200 bg-gray-50 text-gray-800'
                  }`}
                >
                  {msg.text}
                  {msg.role === 'user' && (
                    <button
                      type="button"
                      onClick={() => setFullscreenText(msg.text)}
                      aria-label="全屏大字展示这段话"
                      className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/30"
                    >
                      <Maximize2 aria-hidden="true" className="h-4 w-4" />
                      大字展示
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 快捷识别工具（拍照识别） */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => capture('menu')}
          className="focus-ring flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-base font-semibold text-gray-800 hover:border-brand-400 hover:bg-brand-50"
        >
          <Utensils aria-hidden="true" className="h-5 w-5 text-brand-600" />
          识别菜单
        </button>
        <button
          type="button"
          onClick={() => capture('sign')}
          className="focus-ring flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-base font-semibold text-gray-800 hover:border-brand-400 hover:bg-brand-50"
        >
          <Signpost aria-hidden="true" className="h-5 w-5 text-brand-600" />
          识别路牌
        </button>
      </div>

      {/* 文本输入栏 */}
      <div className="flex items-center gap-2">
        <label htmlFor="chat-input" className="sr-only">
          输入想说的话
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendText();
          }}
          placeholder="例如：请问洗手间在哪里？"
          className="focus-ring min-h-[52px] flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400"
        />
        <IconButton
          size="lg"
          variant="primary"
          label="发送"
          onClick={sendText}
          disabled={input.trim().length === 0}
        >
          <Send aria-hidden="true" className="h-6 w-6" />
        </IconButton>
      </div>

      {/* 全屏大字模态（用户文本消息出示用） */}
      {fullscreenText && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="大字展示"
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between bg-gray-900 p-3">
            <span className="text-base font-semibold text-white">给对方看</span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setFullscreenText(null)}
              className="focus-ring min-h-[44px] rounded-lg px-4 text-base font-semibold text-white hover:bg-white/10"
            >
              关闭 ✕
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 text-center">
            <p className="text-a11y-3xl font-bold leading-snug text-white">{fullscreenText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
