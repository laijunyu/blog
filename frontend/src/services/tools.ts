import type { ToolDetail, ToolItem } from '../types';
import { fetchApi } from './client';

export async function fetchAllTools(): Promise<ToolItem[]> {
  const data = await fetchApi<ToolItem[]>('/api/tools');
  return data ?? [];
}

export async function fetchToolDetail(id: number): Promise<ToolDetail | null> {
  const data = await fetchApi<ToolDetail>(`/api/tools/${id}`);
  return data ?? null;
}