/**
 * WAV 编码工具
 *
 * 将 Float32 音频样本（[-1,1]）编码为 16-bit 单声道 WAV 文件。
 * 用于把麦克风录制的 PCM 转成后端 ASR 推荐的 wav 格式。
 */

export function encodeWav(pcm: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  // RIFF / WAVE 头
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  // fmt 块
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt 块大小
  view.setUint16(20, 1, true); // PCM 编码
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // data 块
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM 样本（Float32 → Int16）
  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
