interface Env {
  // D1 database binding
  DB: D1Database;
  // R2 storage binding
  BUCKET: R2Bucket;
  // Static assets (后台管理页 admin.html)
  ASSETS: Fetcher;
  // Secrets (Dashboard)
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  TOKEN_SECRET: string;
  // Plain text env vars
  PUBLIC_CDN_URL: string;
  FRONTEND_ORIGIN: string;
}
