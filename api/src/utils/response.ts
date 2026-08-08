// 统一响应格式
export function success(data: unknown, message = 'ok') {
  return new Response(JSON.stringify({ code: 0, data, message }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(code: number, message: string, status = 400) {
  return new Response(JSON.stringify({ code, data: null, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// 错误码约定
export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40001,
  UNAUTHORIZED: 40101,
  NOT_FOUND: 40401,
  INTERNAL_ERROR: 50001,
  UPLOAD_FAILED: 50002,
} as const;
