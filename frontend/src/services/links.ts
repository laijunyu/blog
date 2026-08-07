import type { LinkItem } from '../types';
import { fetchApi } from './client';

export async function fetchAllLinks(): Promise<LinkItem[]> {
  const data = await fetchApi<LinkItem[]>('/api/links');
  return data ?? [];
}
