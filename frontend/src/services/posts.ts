import type { PostDetail, PostItem } from '../types';
import { fetchApi } from './client';

export async function fetchAllPosts(): Promise<PostItem[]> {
  const data = await fetchApi<PostItem[]>('/api/posts');
  return data ?? [];
}

export async function fetchPostBySlug(slug: string): Promise<PostDetail | null> {
  return fetchApi<PostDetail>(`/api/posts/${slug}`);
}
