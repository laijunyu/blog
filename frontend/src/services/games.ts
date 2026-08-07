import type { GameItem } from '../types';
import { fetchApi } from './client';

export async function fetchAllGames(): Promise<GameItem[]> {
  const data = await fetchApi<GameItem[]>('/api/games');
  return data ?? [];
}
