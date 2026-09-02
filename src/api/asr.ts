/**
 * 语音转文字 API 封装
 *
 * 后端：HP-Macau Agent（FastAPI），通过 asr_transcribe skill 调用
 *       qwen-audio-3.0-asr-flash-streaming 流式 ASR。
 *
 * 端点：POST /api/audio/asr   （multipart/form-data：audio + language）
 *   base http://118.31.170.211:8000 （已部署的线上公网后端）。
 *   可通过 VITE_ASR_API 环境变量覆盖。
 */

const ASR_API = import.meta.env.VITE_ASR_API || '/agent/api/audio/asr';

export interface AsrResponse {
  status: string;
  text?: string;
  language?: string;
  error?: string;
}

/**
 * 上传音频进行语音转文字
 * @param audio 录音 Blob（wav/mp3/m4a/webm/opus 等）
 * @param language 语种代码（默认 zh）
 */
export async function transcribeAudio(
  audio: Blob,
  language: string = 'zh',
): Promise<{ text: string; language: string }> {
  const form = new FormData();
  // 依据录音类型命名扩展名（后端推荐 wav / mp3 / m4a / aac / flac）
  const ext = audio.type.includes('wav')
    ? 'wav'
    : audio.type.includes('mp3')
      ? 'mp3'
      : audio.type.includes('m4a')
        ? 'm4a'
        : 'webm';
  form.append('audio', audio, `recording.${ext}`);
  form.append('language', language);

  const resp = await fetch(ASR_API, {
    method: 'POST',
    body: form,
  });

  if (!resp.ok) {
    throw new Error(`语音转写服务响应异常：HTTP ${resp.status}`);
  }

  const data: AsrResponse = await resp.json();
  if (data.status !== 'success' || !data.text) {
    throw new Error(data.error || '语音转写失败');
  }

  return { text: data.text, language: data.language || language };
}
