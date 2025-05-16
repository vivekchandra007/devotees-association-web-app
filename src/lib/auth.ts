import jwt from "jsonwebtoken";
import ms, { StringValue } from 'ms';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const ACCESS_SECRET_EXPIRY = process.env.JWT_ACCESS_SECRET_EXPIRY!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const REFRESH_SECRET_EXPIRY = process.env.JWT_REFRESH_SECRET_EXPIRY!;

export function signAccessToken(devoteeId: number) {
  return jwt.sign({ key: devoteeId }, ACCESS_SECRET, { expiresIn: ms(ACCESS_SECRET_EXPIRY as StringValue) });
}

export function signRefreshToken(devoteeId: number) {
  return jwt.sign({ key: devoteeId }, REFRESH_SECRET, { expiresIn: ms(REFRESH_SECRET_EXPIRY as StringValue) });
}

export function verifyAccessToken(token: string): number {
  const payload = jwt.verify(token, ACCESS_SECRET) as { key: number };
  return payload.key;
}

export function verifyRefreshToken(token: string): number {
  const payload = jwt.verify(token, REFRESH_SECRET) as { key: number };
  return payload.key;
}