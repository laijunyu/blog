import type { ApiResponse } from '../types';

const TIMEOUT_MS = 5000;

export async function fetchApi<T>(path: string): Promise<T | null> {
  const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    console.warn('[fetchApi] PUBLIC_API_BASE_URL 未配置，跳过请求');
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(baseUrl + path, { signal: controller.signal });

    if (res.status !== 200) {
      console.warn(`[fetchApi] ${path} 请求失败: HTTP ${res.status}`);
      return null;
    }

    const json = (await res.json()) as ApiResponse<T>;
    return json.data ?? null;
  } catch (err) {
    console.warn(`[fetchApi] ${path} 请求异常:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
