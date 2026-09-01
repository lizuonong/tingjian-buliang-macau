/**
 * 实时视频/语音 WebSocket 客户端（对齐 WEBSOCKET_API.md）
 *
 * 帧格式（二进制，网络序）：
 *   [1字节 type][4字节 长度(大端)][payload]
 *
 * 前端 → 服务端：
 *   0x01 视频帧 JPEG（建议 640x480 q60，≤1fps）
 *   0x02 麦克风音频 PCM 16kHz 16bit mono（必须 16kHz）
 *   0x03 停止/结束（空 payload）
 *
 * 服务端 → 前端：
 *   0x10 语音回复 PCM 24kHz 16bit mono
 *   0x11 文本 UTF-8（transcription / 回复流式）
 *   0x12 状态 UTF-8（AGENT_DECIDING / AGENT_DECIDED / READY / ASSISTANT_REPLY / REPLY_DONE / INTERRUPT）
 *
 * 连接：ws://<host>:8000/ws/video?task=<urlencode>
 */

export type RealtimeStatus =
  | 'AGENT_DECIDING'
  | 'AGENT_DECIDED'
  | 'READY'
  | 'ASSISTANT_REPLY'
  | 'REPLY_DONE'
  | 'INTERRUPT';

export interface RealtimeHandlers {
  onStatus?: (status: RealtimeStatus) => void;
  onText?: (text: string) => void;
  onAudio?: (pcm: Int16Array) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: unknown) => void;
}

const REALTIME_WS =
  import.meta.env.VITE_REALTIME_WS || 'ws://118.31.170.211:8000/ws/video';

/** 构造 WebSocket 地址，task 会 URL 编码后作为 query 参数传递 */
export function realtimeUrl(task: string): string {
  const q = task ? `?task=${encodeURIComponent(task)}` : '';
  return `${REALTIME_WS}${q}`;
}

export class RealtimeSession {
  private ws: WebSocket | null = null;
  private handlers: RealtimeHandlers;

  constructor(handlers: RealtimeHandlers = {}) {
    this.handlers = handlers;
  }

  /** 建立连接，服务端会依次推送 AGENT_DECIDING → AGENT_DECIDED → READY */
  connect(task: string) {
    this.close();
    let ws: WebSocket;
    try {
      ws = new WebSocket(realtimeUrl(task));
    } catch (err) {
      this.handlers.onError?.(err);
      return;
    }
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => this.handlers.onOpen?.();
    ws.onmessage = (ev: MessageEvent) => this.onMessage(ev);
    ws.onerror = (ev) => this.handlers.onError?.(ev);
    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      this.handlers.onClose?.();
    };
  }

  /** 发送视频帧（JPEG 字节） */
  sendVideo(jpeg: ArrayBuffer) {
    this.send(0x01, new Uint8Array(jpeg));
  }

  /** 发送麦克风音频（PCM 16kHz 16bit mono） */
  sendAudio(pcm: Int16Array) {
    this.send(0x02, new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
  }

  /** 主动结束当前对话（发 0x03），连接保持 */
  stop() {
    this.send(0x03, new Uint8Array(0));
  }

  /** 关闭连接 */
  close() {
    this.ws?.close();
    this.ws = null;
  }

  private send(type: number, payload: Uint8Array) {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const buf = new ArrayBuffer(5 + payload.byteLength);
    const view = new Uint8Array(buf);
    const dv = new DataView(buf);
    dv.setUint8(0, type);
    dv.setUint32(1, payload.byteLength, false); // 大端
    view.set(payload, 5);
    ws.send(buf);
  }

  private onMessage(ev: MessageEvent) {
    const data: ArrayBuffer = ev.data;
    if (!(data instanceof ArrayBuffer) || data.byteLength < 5) return;
    const dv = new DataView(data);
    const type = dv.getUint8(0);
    const len = dv.getUint32(1, false);
    const payload = new Uint8Array(data, 5, len);

    switch (type) {
      case 0x10: {
        // PCM 24kHz 16bit mono -> Int16Array
        const pcm = new Int16Array(data, 5, len >> 1);
        this.handlers.onAudio?.(pcm);
        break;
      }
      case 0x11: {
        const text = new TextDecoder('utf-8').decode(payload);
        this.handlers.onText?.(text);
        break;
      }
      case 0x12: {
        const status = new TextDecoder('utf-8').decode(payload) as RealtimeStatus;
        this.handlers.onStatus?.(status);
        break;
      }
    }
  }
}
