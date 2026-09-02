/**
 * 千问多模态菜单识别 API 封装
 *
 * 后端：HP-Macau Agent（FastAPI），通过 menu_reader skill 调用
 *       千问多模态模型 `qwen3.7-flash-2026-07-15` 识别菜单图片。
 *
 * 端点：POST /api/vision/menu   （multipart/form-data：image + target）
 *   base http://118.31.170.211:8000 （已部署的线上公网后端）。
 *   可通过 VITE_VISION_API 环境变量覆盖；默认走公网地址。
 */

const VISION_API = import.meta.env.VITE_VISION_API || '/agent/api/vision';

export interface MenuItem {
  name: string;
  price: string;
  intro: string;
  detail: string;
  translation: string;
}

export interface MenuResponse {
  status: string;
  menu?: MenuItem[];
  summary?: string;
  error?: string;
}

export type TargetLang = 'zh' | 'en' | 'pt';

/**
 * 识别菜单图片，返回结构化菜品列表 + 一句话总结
 * @param image 用户选择的菜单图片文件
 * @param target 目标语言（默认中文）
 */
export async function recognizeMenu(
  image: File,
  target: TargetLang = 'zh',
): Promise<{ menu: MenuItem[]; summary: string }> {
  const form = new FormData();
  form.append('image', image);
  form.append('target', target);

  const resp = await fetch(`${VISION_API}/menu`, {
    method: 'POST',
    body: form,
  });

  if (!resp.ok) {
    throw new Error(`识别服务响应异常：HTTP ${resp.status}`);
  }

  const data: MenuResponse = await resp.json();
  if (data.status !== 'success' || !data.menu) {
    throw new Error(data.error || '菜单识别失败');
  }

  return { menu: data.menu, summary: data.summary || '' };
}
