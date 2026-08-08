import { Hono } from 'hono';
import { generateToken } from '../utils/token';
import { success, error, ErrorCode } from '../utils/response';

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json<{
      username: string;
      password: string;
    }>();

    if (!username || !password) {
      return error(ErrorCode.BAD_REQUEST, '用户名和密码不能为空');
    }

    if (username !== c.env.ADMIN_USERNAME || password !== c.env.ADMIN_PASSWORD) {
      return error(ErrorCode.UNAUTHORIZED, '用户名或密码错误', 401);
    }

    const token = await generateToken(c.env.TOKEN_SECRET);
    return success({ token, expiresIn: 86400 });
  } catch {
    return error(ErrorCode.BAD_REQUEST, '请求格式错误');
  }
});
