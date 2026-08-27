import { Camera, Eye, Mic, MicOff, PhoneOff, ScanLine, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import IconButton from '../components/IconButton';
import PageHeader from '../components/PageHeader';

/**
 * 05 AI 视觉导览 (AI Vision Guide) —— 语音通话式界面
 *
 * 设计形态参考「豆包打电话」：上方为摄像头实时识别画面，
 * 下方为 AI 语音对话主体（圆形 AI 语音球 + 说话波形 + 流式文字气泡），
 * 底部为通话控制条（说话 / 静音 / 结束）。
 *
 * 说明：当前用「模拟流式 + Web Speech 朗读」占位。
 * 接入千问大模型后，将 `emitStream` 替换为真实 SSE/WebSocket 流式接口即可，
 * 界面结构无需改动。
 */

/** 模拟视觉识别聚焦框（示意 UI） */
const VISION_FOCUS = [
  { label: '无障碍坡道', top: '20%', left: '12%', width: '34%', height: '26%' },
  { label: '盲道导向', top: '52%', left: '46%', width: '40%', height: '22%' },
];

/** 模拟 AI 台词（接入千问后由模型实时生成） */
const SCRIPT = [
  '您好，我是澳门无障碍导览助手。已识别到前方是无障碍坡道，坡度平缓，可以放心通行。',
  '沿盲道直行约 20 米即到达服务台，那里提供语音导览设备租借，支持普通话和粤语。',
].join('');

export default function AIVisionGuide() {
  const [supported, setSupported] = useState(true);
  const [sessionActive, setSessionActive] = useState(true); // 通话是否进行中
  const [speaking, setSpeaking] = useState(false); // AI 是否正在说话
  const [micOn, setMicOn] = useState(true); // 麦克风开关
  const [streamText, setStreamText] = useState(''); // 流式输出的 AI 文字
  const streamTimer = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * 流式输出：逐字追加文字（模拟千问流式 token）
   * 接入千问后，替换为：onMessage => setStreamText(prev => prev + chunk)
   */
  const emitStream = useCallback((text: string) => {
    if (streamTimer.current) cancelAnimationFrame(streamTimer.current);
    setStreamText('');
    let i = 0;
    const tick = () => {
      i += 1;
      setStreamText(text.slice(0, i));
      if (i < text.length) {
        streamTimer.current = requestAnimationFrame(tick);
      }
    };
    streamTimer.current = requestAnimationFrame(tick);
  }, []);

  /** 用 Web Speech 朗读指定文本（TTS） */
  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) {
        setSupported(false);
        setSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.95;
      u.pitch = 1;
      utteranceRef.current = u;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [],
  );

  /** 开始一次导览播报（AI 说话 + 流式文字） */
  const startGuidance = useCallback(() => {
    setSessionActive(true);
    emitStream(SCRIPT);
    speak(SCRIPT);
  }, [emitStream, speak]);

  /** 结束通话 */
  const endCall = useCallback(() => {
    if (streamTimer.current) cancelAnimationFrame(streamTimer.current);
    window.speechSynthesis?.cancel();
    setSessionActive(false);
    setSpeaking(false);
    setStreamText('');
  }, []);

  /** 重新识别（复位并重启通话） */
  const restart = useCallback(() => {
    endCall();
    // 小延时后重新开始，避免与前一次朗读冲突
    window.setTimeout(startGuidance, 150);
  }, [endCall, startGuidance]);

  /** 组件卸载时清理 */
  useEffect(() => {
    return () => {
      if (streamTimer.current) cancelAnimationFrame(streamTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // 初始进入即开启一次导览播报
  useEffect(() => {
    startGuidance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 未开启语音合成时的降级提示
  if (!supported) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <PageHeader
          icon={<Eye className="h-6 w-6" />}
          title="AI 视觉导览"
          subtitle="摄像头识别 + 语音对话导览"
        />
        <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          当前浏览器不支持语音合成，无法进行语音播报。请使用 Chrome / Edge 浏览器。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        icon={<Eye className="h-6 w-6" />}
        title="AI 视觉导览"
        subtitle="摄像头识别 + 语音对话导览"
      />

      {/* 摄像头实时识别画面 */}
      <section
        aria-label="摄像头实时识别画面"
        className="card-surface relative h-72 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400"
      >
        {/* 地标示意背景（本地 SVG，不依赖网络） */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 400 288"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="400" height="288" fill="transparent" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={40 + i * 18}
              y={180 - i * 18}
              width={320}
              height={18}
              fill="#ffffff"
              opacity={0.9 - i * 0.15}
            />
          ))}
          <rect x="120" y="40" width="160" height="90" fill="#f8fafc" rx="6" />
          <rect x="150" y="70" width="100" height="60" fill="#1e5451" rx="4" />
          <circle cx="200" cy="45" r="22" fill="#fde68a" />
          <polygon points="40,240 200,240 200,205 40,240" fill="#e2e8f0" />
          <polygon points="160,240 210,212 210,240" fill="#cbd5e1" />
        </svg>

        {/* AI 识别框 */}
        {VISION_FOCUS.map((f) => (
          <div
            key={f.label}
            className="absolute rounded-lg border-2 border-yellow-300 bg-yellow-300/15"
            style={{ top: f.top, left: f.left, width: f.width, height: f.height }}
          >
            <span className="absolute -top-7 left-0 rounded bg-yellow-300 px-2 py-0.5 text-xs font-bold text-gray-900">
              {f.label}
            </span>
          </div>
        ))}

        {/* 识别状态角标 */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white">
          <ScanLine aria-hidden="true" className="h-4 w-4" />
          实时识别中…
        </span>
      </section>

      {/* AI 语音对话主体（豆包打电话式） */}
      <section
        aria-label="AI 语音对话"
        className="card-surface flex flex-col items-center gap-5 p-6 sm:p-8"
      >
        {/* 圆形 AI 语音球 + 说话波形 */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span
            aria-hidden="true"
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30 transition-transform ${
              speaking ? 'scale-110' : 'scale-100'
            }`}
          />
          <span aria-hidden="true" className="relative text-white">
            <Volume2 className="h-14 w-14" />
          </span>

          {/* 说话波形：speaking 时波动 */}
          <span aria-hidden="true" className="absolute flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`block w-1.5 rounded-full bg-white transition-all duration-200 ${
                  speaking ? 'animate-pulse' : 'h-2'
                }`}
                style={{
                  height: speaking ? 16 + (i % 3) * 8 : 8,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </span>
        </div>

        {/* 会话状态 */}
        <p className="text-base font-semibold text-gray-800" aria-live="polite">
          {sessionActive
            ? speaking
              ? 'AI 正在说话…'
              : 'AI 聆听中，点击下方麦克风说话'
            : '会话已结束'}
        </p>

        {/* 流式文字气泡（接入千问后在这里流式渲染模型输出） */}
        <div
          aria-live="polite"
          className="w-full rounded-2xl bg-brand-50 p-4 text-base leading-relaxed text-gray-800"
        >
          {streamText ? streamText : '通话已建立，识别到的无障碍信息将实时显示在这里。'}
        </div>

        {/* 通话控制条 */}
        <div className="flex w-full items-center justify-center gap-5">
          {/* 说话 / 触发播报 */}
          <div className="flex flex-col items-center gap-1.5">
            <IconButton
              size="lg"
              variant="primary"
              label={sessionActive ? '开始说话' : '开始导览'}
              onClick={startGuidance}
              disabled={!sessionActive}
            >
              <Mic aria-hidden="true" className="h-9 w-9" />
            </IconButton>
            <span className="text-sm font-medium text-gray-700">说话</span>
          </div>

          {/* 麦克风静音开关 */}
          <div className="flex flex-col items-center gap-1.5">
            <IconButton
              size="lg"
              variant="secondary"
              label={micOn ? '静音麦克风' : '开启麦克风'}
              aria-pressed={!micOn}
              onClick={() => setMicOn((v) => !v)}
            >
              {micOn ? (
                <Mic aria-hidden="true" className="h-9 w-9" />
              ) : (
                <MicOff aria-hidden="true" className="h-9 w-9" />
              )}
            </IconButton>
            <span className="text-sm font-medium text-gray-700">
              {micOn ? '麦克风开' : '麦克风关'}
            </span>
          </div>

          {/* 结束通话 */}
          <div className="flex flex-col items-center gap-1.5">
            <IconButton
              size="lg"
              variant="danger"
              label="结束通话"
              onClick={endCall}
            >
              <PhoneOff aria-hidden="true" className="h-9 w-9" />
            </IconButton>
            <span className="text-sm font-medium text-gray-700">结束</span>
          </div>
        </div>
      </section>

      {/* 重新识别 */}
      <button
        type="button"
        onClick={restart}
        className="focus-ring inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-300 bg-white px-6 text-base font-bold text-brand-700 hover:bg-brand-50"
      >
        <Camera aria-hidden="true" className="h-5 w-5" />
        重新识别
      </button>
    </div>
  );
}
