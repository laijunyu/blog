import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

export const uploadRouter = new Hono<{ Bindings: Env }>();

// POST /api/upload — 上传文件（需认证）
uploadRouter.post('/', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) || 'images';

  if (!file) {
    return error(ErrorCode.BAD_REQUEST, '缺少 file 字段');
  }

  // 限制文件大小（10MB）
  if (file.size > 10 * 1024 * 1024) {
    return error(ErrorCode.BAD_REQUEST, '文件大小不能超过 10MB');
  }

  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'text/html', 'application/zip',
  ];
  if (!allowedTypes.includes(file.type)) {
    return error(ErrorCode.BAD_REQUEST, `不支持的文件类型: ${file.type}`);
  }

  // 生成唯一文件名
  const ext = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 8);
  const key = `${folder}/${timestamp}-${randomStr}.${ext}`;

  // 写入 R2
  await c.env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const publicUrl = `${c.env.PUBLIC_CDN_URL}/${key}`;
  return success({ url: publicUrl, key }, '上传成功');
});

// GET /api/upload/list — 列出文件（需认证）
uploadRouter.get('/list', authMiddleware, async (c) => {
  const prefix = c.req.query('prefix') || '';
  const listed = await c.env.BUCKET.list({ prefix, limit: 100 });

  const files = listed.objects.map(obj => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded,
    url: `${c.env.PUBLIC_CDN_URL}/${obj.key}`,
  }));

  return success(files);
});

// DELETE /api/upload — 删除文件（需认证）
uploadRouter.delete('/', authMiddleware, async (c) => {
  const { key } = await c.req.json<{ key: string }>();
  if (!key) {
    return error(ErrorCode.BAD_REQUEST, '缺少 key 参数');
  }
  await c.env.BUCKET.delete(key);
  return success(null, '删除成功');
});
