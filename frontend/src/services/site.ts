import type { SiteMeta } from '../types';
import { fetchApi } from './client';

export async function fetchSiteMeta(): Promise<SiteMeta | null> {
  return fetchApi<SiteMeta>('/api/site-meta');
}
