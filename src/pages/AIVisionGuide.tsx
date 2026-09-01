import { Camera, Eye, Mic, MicOff, PhoneOff, ScanLine, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import IconButton from '../components/IconButton';
import PageHeader from '../components/PageHeader';
import { RealtimeSession } from '../api/realtime';
import type { RealtimeStatus } from '../api/realtime';

/**
 * 05 AI 视觉导览 (AI Vision Guide) —— 语音通话式界面
 *
 * 设计形态参考「豆包打电话」：上方为摄像头实时识别画面，
 * 下方为 AI 语音对话主体（圆形 AI 语音球 + 说话波形 + 流式文字气泡），
 * 底部为通话控制条（说话 / 静音 / 结束）。
 *
 * 后端：实时视频/语音 WebSocket（公网 ws://118.31.170.211:8000/ws/video），
 *       协议见 WEBSOCKET_API.md。前端采集摄像头 JPEG 帧 + 麦克风 PCM 16k，
 *       服务端返回 PCM 24k 语音 + 文本 + 状态。
 */

/** 传给 HP-Macau Agent 的人设/任务指令 */
const TASK = '请帮我实时识别前方路况和无障碍设施，并给出语音导览建议。';

/** 识别聚焦框（示意 UI，叠在实时视频上） */
const VISION_FOCUS = [
  { label: '无障碍坡道', top: '20%', left: '12%', width: '34%', height: '26%' },
  { label: '盲道导向', top: '52%', left: '46%', width: '40%', height: '22%' },
];

/** Float32 [-1,1] → Int16 PCM */
function floatTo16PCM(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export default function AIVisionGuide() {
  const [sessionActive, setSessionActive] = useState(false); // 会话是否进行中
  const [micOn, setMicOn] = useState(true); // 麦克风开关
  const [speaking, setSpeaking] = useState(false); // AI 是否正在说话（0x12 状态）
  const [status, setStatus] = useState<RealtimeStatus | 'IDLE' | 'CONNECTING'>('IDLE');
  const [streamText, setStreamText] = useState(''); // 流式输出的 AI 文字
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<Int16Array[]>([]); // 待播音频队列
  const playingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const micOnRef = useRef(true);

  // 同步 micOn 到 ref（onaudioprocess 闭包读取最新值）
  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  /** 断开会话时清理所有资源 */
  const teardown = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    try {
      micProcessorRef.current?.disconnect();
      micGainRef.current?.disconnect();
      micCtxRef.current?.close();
    } catch {
      /* noop */
    }
    micProcessorRef.current = null;
    micGainRef.current = null;
    micCtxRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    // 停止并清空播放
    try {
      currentSourceRef.current?.stop();
    } catch {
      /* noop */
    }
    currentSourceRef.current = null;
    queueRef.current = [];
    playingRef.current = false;
    sessionRef.current?.close();
    sessionRef.current = null;
  }, []);

  /** 播放 24kHz PCM：分片排队、串行播放，避免重叠 */
  const playPcm = useCallback((pcm: Int16Array) => {
    if (!playCtxRef.current) playCtxRef.current = new AudioContext();
    const ctx = playCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();
    queueRef.current.push(pcm);

    if (playingRef.current) return;
    playingRef.current = true;
    const drain = () => {
      const next = queueRef.current.shift();
      if (!next) {
        playingRef.current = false;
        return;
      }
      const buffer = ctx.createBuffer(1, next.length, 24000);
      const ch = buffer.getChannelData(0);
      for (let i = 0; i < next.length; i++) ch[i] = next[i] / 32768;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;
      source.onended = () => drain();
      source.start();
    };
    drain();
  }, []);

  /** 服务端状态回调 */
  const handleStatus = useCallback((s: RealtimeStatus) => {
    setStatus(s);
    if (s === 'READY') setStreamText('');
    if (s === 'ASSISTANT_REPLY') {
      setSpeaking(true);
      setStreamText('');
    }
    if (s === 'REPLY_DONE') setSpeaking(false);
    if (s === 'INTERRUPT') {
      // 用户插话：停止当前播放并清空队列
      setSpeaking(false);
      try {
        currentSourceRef.current?.stop();
      } catch {
        /* noop */
      }
      currentSourceRef.current = null;
      queueRef.current = [];
      playingRef.current = false;
    }
  }, []);

  const handleText = useCallback((text: string) => {
    setStreamText((prev) => prev + text);
  }, []);

  const handleAudio = useCallback(
    (pcm: Int16Array) => playPcm(pcm),
    [playPcm],
  );

  /** 开始会话：请求摄像头+麦克风，建立 WebSocket，持续推流 */
  const startSession = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('当前浏览器不支持摄像头/麦克风。请使用 Chrome / Edge（需 HTTPS 或 localhost）。');
      return;
    }
    setErrorMsg(null);
    setSessionActive(true);
    setStatus('CONNECTING');

    try {
      // 摄像头：环境后置摄像头，640x480
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      camStreamRef.current = camStream;
      if (videoRef.current) {
        videoRef.current.srcObject = camStream;
        await videoRef.current.play().catch(() => undefined);
      }

      // 建立 WebSocket 会话
      const session = new RealtimeSession({
        onStatus: handleStatus,
        onText: handleText,
        onAudio: handleAudio,
        onClose: () => {
          setSessionActive(false);
          setSpeaking(false);
        },
        onError: () => setErrorMsg('无法连接实时导览服务，请确认公网后端已启动。'),
      });
      sessionRef.current = session;
      session.connect(TASK);

      // 视频帧采集：640x480 JPEG q60 ≈ 1fps
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const cctx = canvas.getContext('2d');
      frameTimerRef.current = window.setInterval(() => {
        if (!videoRef.current || !cctx) return;
        cctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const buf = await blob.arrayBuffer();
          sessionRef.current?.sendVideo(buf);
        }, 'image/jpeg', 0.6);
      }, 1000);

      // 麦克风采集：AudioContext 必须 16kHz，ScriptProcessor 必须 connect 才触发
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;
      const micCtx = new AudioContext({ sampleRate: 16000 });
      micCtxRef.current = micCtx;
      const src = micCtx.createMediaStreamSource(micStream);
      const gain = micCtx.createGain();
      gain.gain.value = 0; // 隔离回音
      const processor = micCtx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!micOnRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        sessionRef.current?.sendAudio(floatTo16PCM(input));
      };
      src.connect(gain);
      gain.connect(processor);
      processor.connect(micCtx.destination);
      micGainRef.current = gain;
      micProcessorRef.current = processor;
    } catch (err) {
      setErrorMsg('无法访问摄像头或麦克风，请检查浏览器权限设置。');
      setSessionActive(false);
      teardown();
    }
  }, [handleStatus, handleText, handleAudio, teardown]);

  /** 结束通话 */
  const endCall = useCallback(() => {
    sessionRef.current?.stop();
    teardown();
    setSessionActive(false);
    setSpeaking(false);
    setStreamText('');
    setStatus('IDLE');
  }, [teardown]);

  /** 重新识别（复位并重启会话） */
  const restart = useCallback(() => {
    endCall();
    void startSession();
  }, [endCall, startSession]);

  /** 组件卸载时清理 */
  useEffect(() => {
    return () => teardown();
  }, [teardown]);

  const statusText = sessionActive
    ? speaking
      ? 'AI 正在说话…'
      : status === 'CONNECTING'
        ? '正在连接实时导览服务…'
        : status === 'READY'
          ? 'AI 聆听中，点击下方麦克风说话'
          : '正在识别，请对准前方…'
    : '会话已结束，点击下方「重新识别」开始';

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
        {/* 实时摄像头画面 */}
        {sessionActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="实时摄像头画面"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* 地标示意背景（本地 SVG，会话未开启时展示） */}
        {!sessionActive && (
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
        )}

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
          {sessionActive ? '实时识别中…' : '摄像头未开启'}
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
          {statusText}
        </p>

        {/* 流式文字气泡（实时渲染模型输出） */}
        <div
          aria-live="polite"
          className="w-full rounded-2xl bg-brand-50 p-4 text-base leading-relaxed text-gray-800"
        >
          {streamText || '通话建立后，AI 识别和回复内容将实时显示在这里。'}
        </div>

        {/* 通话控制条 */}
        <div className="flex w-full items-center justify-center gap-5">
          {/* 说话 / 触发播报 */}
          <div className="flex flex-col items-center gap-1.5">
            <IconButton
              size="lg"
              variant="primary"
              label={sessionActive ? '开始说话' : '开始导览'}
              onClick={sessionActive ? endCall : startSession}
              disabled={false}
            >
              <Mic aria-hidden="true" className="h-9 w-9" />
            </IconButton>
            <span className="text-sm font-medium text-gray-700">
              {sessionActive ? '开始说话' : '开始导览'}
            </span>
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

      {/* 连接错误提示 */}
      {errorMsg && (
        <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          {errorMsg}
        </p>
      )}

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
