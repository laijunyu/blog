export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface PostItem {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
}

export interface PostDetail extends PostItem {
  body: string;
}

export interface GameItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  src: string;
  tags: string[];
}

export interface ToolItem {
  title: string;
  icon: string;
  description: string;
  url: string;
  tags: string[];
}

export interface LinkItem {
  name: string;
  url: string;
  avatar: string;
  description: string;
}

export interface SiteMeta {
  siteName: string;
  slogan: string;
  counts: {
    posts: number;
    games: number;
    tools: number;
    links: number;
  };
}
