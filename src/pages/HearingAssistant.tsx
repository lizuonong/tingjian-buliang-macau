import { Maximize2, MessageSquareText, Mic, Send, Utensils } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { recognizeMenu } from '../api/vision';
import type { MenuItem } from '../api/vision';
import IconButton from '../components/IconButton';
import OrderCard from '../components/OrderCard';
import PageHeader from '../components/PageHeader';

/**
 * 06 听障沟通助手 (Hearing Assistant) —— 聊天记录式界面
 *
 * 像即时通讯一样交流：上方为聊天消息气泡（可滚动、新消息自动到底），
 * 下方为快捷工具（识别菜单 / 听取语音）与文本输入栏。
 *
 * 保留的必要功能：
 *  1. 拍照识别（菜单）→ 生成点餐卡片（OrderCard，可勾选餐品 + 全屏大字出示）
 *  2. 听取语音 → 全屏大字展示「我是听障人士」，请对方对着手机说话，模拟语音转文字
 *  3. 打字沟通 → 发送文本消息
 *  4. 全屏大字展示 → 识别结果卡片、用户文本消息均可一键全屏大字出示给他人
 */

/** 消息类型：文本 / 点餐卡片 */
type ChatMessage =
  | { id: string; role: 'user' | 'assistant'; kind: 'text'; text: string }
  | { id: string; role: 'assistant'; kind: 'order'; menu: MenuItem[]; summary?: string };

/** 降级示例菜单（后端不可达时使用，保持结构化以便渲染点餐卡片） */
const MOCK_MENU: MenuItem[] = [
  { name: '招牌猪扒包', price: '28 澳门元', intro: '', detail: '配冰柠茶', translation: '' },
  { name: '葡式蛋挞（2 件）', price: '20 澳门元', intro: '', detail: '新鲜出炉', translation: '' },
  { name: '冻柠茶', price: '16 澳门元', intro: '', detail: '少冰', translation: '' },
  { name: '咖喱牛杂', price: '35 澳门元', intro: '今日特价', detail: '微辣', translation: '' },
];

export default function HearingAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      kind: 'text',
      text: '您好！我可以帮您拍照识别菜单、打字沟通、听取对方语音，识别结果可一键全屏大字展示，方便直接出示给他人。',
    },
  ]);
  const [input, setInput] = useState('');
  const [fullscreenText, setFullscreenText] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false); // 听取语音大字模态
  const [listening, setListening] = useState(false); // 是否正在模拟听取对方说话
  const [uploading, setUploading] = useState(false); // 是否正在上传/识别菜单
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const voiceCloseBtnRef = useRef<HTMLButtonElement>(null);
  const voiceTimer = useRef<number | null>(null);
  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return `m${idRef.current}`;
  };

  /** 新消息自动滚动到底部 */
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  /** 全屏大字模态（用户文本出示）：Esc 关闭 + 锁定滚动 + 聚焦关闭按钮 */
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

  /** 听取语音大字模态：Esc 关闭 + 锁定滚动 + 聚焦关闭按钮 */
  useEffect(() => {
    if (!voiceOpen) return;
    voiceCloseBtnRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeVoice();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [voiceOpen]);

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

  /** 拍照识别（菜单）→ 生成识别结果卡片消息 */
  /** 触发选择图片（拍照/相册）用于菜单识别 */
  const capture = () => {
    fileInputRef.current?.click();
  };

  /**
   * 处理用户选择的菜单图片 → 调用千问菜单识别 API → 生成点餐卡片消息
   * 若后端未启动或识别失败，降级展示示例点餐卡片并提示
   */
  const handleMenuImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { menu, summary } = await recognizeMenu(file);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          kind: 'order',
          menu: menu.length ? menu : MOCK_MENU,
          summary,
        },
      ]);
    } catch (err) {
      // 降级：后端不可达时展示示例点餐卡片，并提示
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          kind: 'order',
          menu: MOCK_MENU,
          summary: '示例菜单（后端未连接）',
        },
        {
          id: nextId(),
          role: 'assistant',
          kind: 'text',
          text: '未能连接菜单识别服务，已展示示例菜单。请确认千问识别后端已启动。',
        },
      ]);
    } finally {
      setUploading(false);
    }
  };

  /** 打开「听取语音」大字展示（请对方对着手机说话） */
  const openVoice = () => {
    setVoiceOpen(true);
    setListening(false);
  };

  /** 关闭「听取语音」模态 */
  const closeVoice = () => {
    if (voiceTimer.current) clearTimeout(voiceTimer.current);
    setVoiceOpen(false);
    setListening(false);
  };

  /** 开始听取：模拟对方语音转文字，结束后把文字加入聊天记录 */
  const startListening = () => {
    setListening(true);
    voiceTimer.current = window.setTimeout(() => {
      const transcript = '您好，我想请问无障碍通道怎么走？';
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', kind: 'text', text: `听到对方说：${transcript}` },
      ]);
      setVoiceOpen(false);
      setListening(false);
    }, 3000);
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
            {msg.kind === 'order' ? (
              <OrderCard menu={msg.menu} summary={msg.summary} />
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

      {/* 隐藏相机输入：点击「识别菜单」直接调用手机后置摄像头拍照识别 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          handleMenuImage(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* 快捷工具（拍照识别 / 听取语音） */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={capture}
          disabled={uploading}
          className="focus-ring flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-base font-semibold text-gray-800 hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Utensils aria-hidden="true" className="h-5 w-5 text-brand-600" />
          {uploading ? '识别中…' : '识别菜单'}
        </button>
        <button
          type="button"
          onClick={openVoice}
          className="focus-ring flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 border-brand-300 bg-brand-50 text-base font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-100"
        >
          <Mic aria-hidden="true" className="h-5 w-5 text-brand-600" />
          听取语音
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

      {/* 听取语音大字模态（请对方对着手机说话） */}
      {voiceOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="听取语音"
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between bg-gray-900 p-3">
            <span className="text-base font-semibold text-white">听取语音</span>
            <button
              ref={voiceCloseBtnRef}
              type="button"
              onClick={closeVoice}
              className="focus-ring min-h-[44px] rounded-lg px-4 text-base font-semibold text-white hover:bg-white/10"
            >
              关闭 ✕
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6 text-center">
            <span aria-hidden="true" className="text-6xl">🤝</span>
            <p className="text-a11y-3xl font-bold leading-snug text-white">
              您好，我是听障人士。
              <br />
              请您对着手机说话，
              <br />
              我会看到您的语音文字。谢谢！
            </p>

            {listening ? (
              <p
                className="flex items-center gap-2 text-a11y-xl font-semibold text-brand-300"
                aria-live="polite"
              >
                <Mic aria-hidden="true" className="h-8 w-8 animate-pulse" />
                请说话…（正在听取）
              </p>
            ) : (
              <button
                type="button"
                onClick={startListening}
                className="focus-ring inline-flex min-h-[64px] items-center gap-2 rounded-2xl bg-white px-8 text-xl font-bold text-gray-900 transition-colors hover:bg-gray-100"
              >
                <Mic aria-hidden="true" className="h-6 w-6" />
                开始听取
              </button>
            )}

            <p className="max-w-md text-a11y-xl leading-relaxed text-gray-300">
              对方说完后，语音将转为文字并显示在聊天记录中。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
