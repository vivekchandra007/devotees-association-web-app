import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function signAccessToken(devoteeId: number) {
  return jwt.sign({ key: devoteeId }, ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(devoteeId: number) {
  return jwt.sign({ key: devoteeId }, REFRESH_SECRET, { expiresIn: '1y' });
}

export function verifyAccessToken(token: string): number {
  const payload = jwt.verify(token, ACCESS_SECRET) as { key: number };
  return payload.key;
}

export function verifyRefreshToken(token: string): number {
  const payload = jwt.verify(token, REFRESH_SECRET) as { key: number };
  return payload.key;
}