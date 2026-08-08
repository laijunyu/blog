import { Context, Next } from 'hono';
import { verifyToken } from '../utils/token';
import { error, ErrorCode } from '../utils/response';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(ErrorCode.UNAUTHORIZED, '缺少认证信息', 401);
  }

  const token = authHeader.slice(7);
  const valid = await verifyToken(token, c.env.TOKEN_SECRET);

  if (!valid) {
    return error(ErrorCode.UNAUTHORIZED, 'Token 无效或已过期', 401);
  }

  await next();
}
