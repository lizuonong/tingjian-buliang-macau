import { Play, Pause, StepForward, Volume2 } from 'lucide-react';
import IconButton from './IconButton';

/**
 * VoiceControlBar —— AI 视觉导览语音控制条
 * 无障碍约束：
 *  - 大颗粒按钮（≥ 64px），图标 + 文字双编码
 *  - 播放/暂停为切换按钮，使用 aria-pressed 表达状态
 */
interface VoiceControlBarProps {
  playing: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  hasNext: boolean;
}

export default function VoiceControlBar({
  playing,
  onTogglePlay,
  onStepForward,
  hasNext,
}: VoiceControlBarProps) {
  return (
    <div
      role="group"
      aria-label="语音播报控制"
      className="card-surface flex items-center justify-center gap-4 p-4 sm:gap-6 sm:p-6"
    >
      {/* 播放 / 暂停：切换按钮 */}
      <div className="flex flex-col items-center gap-1.5">
        <IconButton
          size="lg"
          variant={playing ? 'primary' : 'secondary'}
          label={playing ? '暂停播报' : '开始播报'}
          aria-pressed={playing}
          onClick={onTogglePlay}
        >
          {playing ? (
            <Pause aria-hidden="true" className="h-9 w-9" />
          ) : (
            <Play aria-hidden="true" className="h-9 w-9" />
          )}
        </IconButton>
        <span className="text-sm font-medium text-gray-700">
          {playing ? '暂停' : '播放'}
        </span>
      </div>

      {/* 按一步朗读 */}
      <div className="flex flex-col items-center gap-1.5">
        <IconButton
          size="lg"
          variant="secondary"
          label="朗读下一句"
          disabled={!hasNext}
          onClick={onStepForward}
        >
          <StepForward aria-hidden="true" className="h-9 w-9" />
        </IconButton>
        <span className="text-sm font-medium text-gray-700">下一句</span>
      </div>

      {/* 音量（示意，可扩展真实音量控制） */}
      <div className="flex flex-col items-center gap-1.5">
        <IconButton size="lg" variant="secondary" label="提高音量">
          <Volume2 aria-hidden="true" className="h-9 w-9" />
        </IconButton>
        <span className="text-sm font-medium text-gray-700">音量</span>
      </div>
    </div>
  );
}
