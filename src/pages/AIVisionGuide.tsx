import { Camera, Eye, ScanLine } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import BroadcastTextBox from '../components/BroadcastTextBox';
import PageHeader from '../components/PageHeader';
import VoiceControlBar from '../components/VoiceControlBar';
import type { SpeechSentence } from '../types';

/**
 * 05 AI 视觉导览 (AI Vision Guide)
 * - 语音控制条：播放/暂停、逐句朗读大颗粒按钮
 * - 播报文本框：实时高亮当前朗读句
 * - 模拟朗读：使用 Web Speech API（SpeechSynthesis）真实朗读，逐句推进
 */

const SENTENCES: SpeechSentence[] = [
  { id: 1, text: '欢迎来到大三巴牌坊，这里是澳门最具代表性的历史遗迹。' },
  { id: 2, text: '前方 5 米处是正门，台阶旁设有无障碍坡道，坡度平缓，可以放心通行。' },
  { id: 3, text: '正门前方的地面铺有盲道砖，沿盲道直行即可到达服务台。' },
  { id: 4, text: '服务台提供语音导览设备租借，支持粤语、普通话和英语。' },
  { id: 5, text: '如需休息，右手边 20 米处有遮阳座椅，设有扶手，方便起坐。' },
];

/** 模拟视觉识别聚焦框（示意 UI） */
const VISION_FOCUS = [
  { label: '无障碍坡道', top: '20%', left: '12%', width: '34%', height: '26%' },
  { label: '盲道导向', top: '52%', left: '46%', width: '40%', height: '22%' },
];

export default function AIVisionGuide() {
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const hasNext = currentIndex < SENTENCES.length - 1;

  /** 朗读指定句子（Web Speech API） */
  const speakSentence = useCallback(
    (index: number) => {
      if (!('speechSynthesis' in window)) {
        setSupported(false);
        return;
      }
      window.speechSynthesis.cancel(); // 停止前序朗读
      const u = new SpeechSynthesisUtterance(SENTENCES[index].text);
      u.lang = 'zh-CN';
      u.rate = 0.9; // 语速稍慢，适合长者/视障用户
      u.pitch = 1;
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [],
  );

  /** 播放/暂停控制 */
  const togglePlay = useCallback(() => {
    if (playing) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else {
      if (currentIndex >= SENTENCES.length) {
        setCurrentIndex(0);
      }
      window.speechSynthesis.resume();
      speakSentence(currentIndex);
      setPlaying(true);
    }
  }, [playing, currentIndex, speakSentence]);

  /** 逐句朗读（下一句） */
  const stepForward = useCallback(() => {
    if (!hasNext) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    window.speechSynthesis.cancel();
    speakSentence(next);
  }, [currentIndex, hasNext, speakSentence]);

  /** 点击播报文本中的任意句 */
  const selectSentence = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      window.speechSynthesis.cancel();
      speakSentence(index);
      if (!playing) setPlaying(true);
    },
    [speakSentence, playing],
  );

  /** 朗读结束 → 自动推进下一句 */
  useEffect(() => {
    const u = utteranceRef.current;
    if (!u) return;
    u.onend = () => {
      if (hasNext) {
        setCurrentIndex((idx) => {
          const next = idx + 1;
          speakSentence(next);
          return next;
        });
      } else {
        setPlaying(false);
      }
    };
  }, [hasNext, speakSentence]);

  /** 组件卸载时停止朗读 */
  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        icon={<Eye className="h-6 w-6" />}
        title="AI 视觉导览"
        subtitle="对准前方景物，自动播报无障碍路线。"
      />

      {!supported && (
        <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          当前浏览器不支持语音合成，请使用 Chrome / Edge 或切换「逐句文字」模式。
        </p>
      )}

      {/* 视觉识别窗口（示意） */}
      <section
        aria-label="视觉识别预览"
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
          {/* 台阶 */}
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
          {/* 牌坊轮廓 */}
          <rect x="120" y="40" width="160" height="90" fill="#f8fafc" rx="6" />
          <rect x="150" y="70" width="100" height="60" fill="#1e5451" rx="4" />
          <circle cx="200" cy="45" r="22" fill="#fde68a" />
          {/* 坡道 */}
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
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white">
          <ScanLine aria-hidden="true" className="h-4 w-4" />
          实时识别中…
        </span>
      </section>

      {/* 语音控制条 */}
      <VoiceControlBar
        playing={playing}
        onTogglePlay={togglePlay}
        onStepForward={stepForward}
        hasNext={hasNext}
      />

      {/* 播报文本框：实时高亮当前句 */}
      <BroadcastTextBox
        sentences={SENTENCES}
        currentIndex={currentIndex}
        onSelect={selectSentence}
      />

      {/* 重新拍照 */}
      <button
        type="button"
        onClick={() => {
          setCurrentIndex(0);
          setPlaying(false);
          window.speechSynthesis.cancel();
        }}
        className="focus-ring inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-300 bg-white px-6 text-base font-bold text-brand-700 hover:bg-brand-50"
      >
        <Camera aria-hidden="true" className="h-5 w-5" />
        重新扫描
      </button>
    </div>
  );
}
