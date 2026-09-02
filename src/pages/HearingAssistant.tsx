import { Maximize2, MessageSquareText, Mic, MicOff, Send, Trash2, Utensils } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '../api/asr';
import { encodeWav } from '../utils/wav';
import { recognizeMenu } from '../api/vision';
import type { MenuItem } from '../api/vision';
import ConfirmDialog from '../components/ConfirmDialog';
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

/** 默认欢迎语（清空后重置回该条） */
const WELCOME_TEXT =
  '您好！我可以帮您拍照识别菜单、打字沟通、听取对方语音，识别结果可一键全屏大字展示，方便直接出示给他人。';

export default function HearingAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 'welcome', role: 'assistant', kind: 'text', text: WELCOME_TEXT },
  ]);
  const [input, setInput] = useState('');
  const [fullscreenText, setFullscreenText] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false); // 听取语音大字模态
  const [listening, setListening] = useState(false); // 是否正在模拟听取对方说话
  const [uploading, setUploading] = useState(false); // 是否正在上传/识别菜单
  const [voiceError, setVoiceError] = useState<string | null>(null); // 听取语音错误提示
  const [voiceBusy, setVoiceBusy] = useState(false); // 正在请求麦克风权限
  const [confirmClear, setConfirmClear] = useState(false); // 是否确认清空消息
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const voiceCloseBtnRef = useRef<HTMLButtonElement>(null);
  const voiceTimer = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Float32Array[]>([]); // 采集到的 PCM 分片
  const sampleRateRef = useRef(0);
  const recordingRef = useRef(false);
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

  /** 清空全部消息（重置回欢迎语） */
  const confirmClearAll = () => {
    setMessages([{ id: 'welcome', role: 'assistant', kind: 'text', text: WELCOME_TEXT }]);
    setConfirmClear(false);
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

  /** 停止录音：合并 PCM → 编码 WAV → 上传 /api/audio/asr 转写 */
  const stopRecording = async () => {
    if (!recordingRef.current) {
      setVoiceOpen(false);
      return;
    }
    recordingRef.current = false;
    processorRef.current?.disconnect();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    processorRef.current = null;
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    const sampleRate = sampleRateRef.current || 44100;
    if (ctx) void ctx.close().catch(() => {});
    setListening(false);

    // 合并 PCM 分片
    const chunks = chunksRef.current;
    chunksRef.current = [];
    let total = 0;
    for (const c of chunks) total += c.length;
    if (total === 0) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', kind: 'text', text: '未录到有效音频，请重试。' },
      ]);
      setVoiceOpen(false);
      return;
    }
    const pcm = new Float32Array(total);
    let off = 0;
    for (const c of chunks) {
      pcm.set(c, off);
      off += c.length;
    }
    const wavBlob = encodeWav(pcm, sampleRate);
    try {
      const { text } = await transcribeAudio(wavBlob);
      const content = (text || '').trim();
      // 后端对「无有效语音」也会以 success + 提示文案返回，这里识别后给出更友好的提示
      if (!content || /空文本|静音|过短|没有可识别|未检测到|转写失败/.test(content)) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'assistant', kind: 'text', text: '没听清对方的话，请让对方靠近麦克风、说得清楚一点，再试一次。' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'assistant', kind: 'text', text: `听到对方说：${content}` },
        ]);
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message || '';
      const friendly =
        msg.includes('Failed to fetch') || msg.includes('fetch')
          ? '语音转写服务暂时不可用，请稍后重试。'
          : `语音识别失败：${msg}`;
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', kind: 'text', text: friendly },
      ]);
    }
    setVoiceOpen(false);
  };

  /** 打开「听取语音」大字展示（请对方对着手机说话） */
  const openVoice = () => {
    setVoiceOpen(true);
    setListening(false);
    setVoiceError(null);
  };

  /** 关闭「听取语音」模态 */
  const closeVoice = () => {
    if (voiceTimer.current) clearTimeout(voiceTimer.current);
    stopRecording();
    setVoiceOpen(false);
    setListening(false);
  };

  /** 开始听取：录制对方语音（PCM），停止时编码为 WAV 上传转写 */
  const startListening = async () => {
    if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError('当前环境无法访问麦克风。请确认：① 已信任 HTTPS 证书；② 在地址栏允许麦克风权限。');
      return;
    }
    setVoiceBusy(true);
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      void ctx.resume();
      sampleRateRef.current = ctx.sampleRate;

      const src = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      chunksRef.current = [];
      recordingRef.current = true;
      processor.onaudioprocess = (e) => {
        if (!recordingRef.current) return;
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      // 连接顺序：src → processor（采集真实音频）→ gain(0) → destination（隔离回音、保证调度）
      const mute = ctx.createGain();
      mute.gain.value = 0;
      src.connect(processor);
      processor.connect(mute);
      mute.connect(ctx.destination);

      setListening(true);
    } catch (err) {
      const name = (err as { name?: string })?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setVoiceError('麦克风权限被拒绝。请在浏览器地址栏/设置中允许麦克风，然后重试。');
      } else if (name === 'NotFoundError') {
        setVoiceError('未找到可用的麦克风设备，请检查设备或连接。');
      } else if (name === 'NotReadableError') {
        setVoiceError('麦克风可能被其他应用占用，请关闭占用程序后重试。');
      } else {
        setVoiceError('无法访问麦克风，请检查浏览器权限（手机需信任 HTTPS 证书并允许麦克风）。');
      }
    } finally {
      setVoiceBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        icon={<MessageSquareText className="h-6 w-6" />}
        title="沟通助手"
        subtitle="像聊天一样交流，识别结果可全屏大字出示。"
      />

      {/* 聊天记录（可滚动，新消息自动到底） */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
          <span className="text-sm font-semibold text-gray-500">聊天记录</span>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={messages.length === 0}
            className="focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border-2 border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 transition-colors hover:border-alert-400 hover:text-alert-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            清空消息
          </button>
        </div>
        <div
          ref={listRef}
          role="log"
          aria-live="polite"
          className="h-[46vh] space-y-3 overflow-y-auto p-4"
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

            {voiceError && (
              <p
                role="alert"
                className="max-w-md rounded-xl bg-amber-500/20 px-4 py-3 text-a11y-xl leading-relaxed text-amber-300"
              >
                {voiceError}
              </p>
            )}

            {listening ? (
              <div className="flex flex-col items-center gap-4">
                <p
                  className="flex items-center gap-2 text-a11y-xl font-semibold text-brand-300"
                  aria-live="polite"
                >
                  <Mic aria-hidden="true" className="h-8 w-8 animate-pulse" />
                  正在听取…（请对方说话）
                </p>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="focus-ring inline-flex min-h-[64px] items-center gap-2 rounded-2xl bg-white px-8 text-xl font-bold text-gray-900 transition-colors hover:bg-gray-100"
                >
                  <MicOff aria-hidden="true" className="h-6 w-6" />
                  结束并识别
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startListening}
                disabled={voiceBusy}
                className="focus-ring inline-flex min-h-[64px] items-center gap-2 rounded-2xl bg-white px-8 text-xl font-bold text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-wait disabled:opacity-70"
              >
                {voiceBusy ? (
                  <>
                    <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                    正在请求麦克风…
                  </>
                ) : (
                  <>
                    <Mic aria-hidden="true" className="h-6 w-6" />
                    开始听取
                  </>
                )}
              </button>
            )}

            <p className="max-w-md text-a11y-xl leading-relaxed text-gray-300">
              对方说完后，语音将转为文字并显示在聊天记录中。
            </p>
          </div>
        </div>
      )}

      {/* 清空消息二次确认 */}
      <ConfirmDialog
        open={confirmClear}
        title="清空聊天记录"
        description="确定要清空全部聊天记录吗？此操作无法撤销。"
        confirmText="确定清空"
        cancelText="取消"
        onConfirm={confirmClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
