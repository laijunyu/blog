import type { ToolItem } from '../types';
import { fetchApi } from './client';

export async function fetchAllTools(): Promise<ToolItem[]> {
  const data = await fetchApi<ToolItem[]>('/api/tools');
  return data ?? [];
}
