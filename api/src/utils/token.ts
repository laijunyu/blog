// 使用 Web Crypto API 生成/验证 Token，零依赖
// 参考：https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function generateToken(secret: string): Promise<string> {
  const payload = {
    exp: Date.now() + TOKEN_EXPIRY,
    iat: Date.now(),
  };
  const payloadStr = btoa(JSON.stringify(payload));
  const key = await getKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadStr)
  );
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${payloadStr}.${sigStr}`;
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const [payloadStr, sigStr] = token.split('.');
    if (!payloadStr || !sigStr) return false;

    const payload = JSON.parse(atob(payloadStr));
    if (payload.exp < Date.now()) return false;

    const key = await getKey(secret);
    const encoder = new TextEncoder();
    const sigBytes = Uint8Array.from(atob(sigStr), c => c.charCodeAt(0));

    return crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(payloadStr)
    );
  } catch {
    return false;
  }
}
