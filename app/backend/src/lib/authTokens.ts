import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "fintrack_access";
export const REFRESH_COOKIE_NAME = "fintrack_session";
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function getAccessTokenSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ACCESS_TOKEN_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

type AccessPayload = {
  sub: string;
  exp: number;
  iat: number;
};

function sign(value: string) {
  return createHmac("sha256", getAccessTokenSecret())
    .update(value)
    .digest("base64url");
}

export function createAccessToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64url");
  const payload: AccessPayload = {
    sub: userId,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const unsigned = `${header}.${encodedPayload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyAccessToken(token: string): AccessPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(unsigned));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString()) as {
      alg?: string;
      typ?: string;
    };
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    ) as Partial<AccessPayload>;

    if (
      header.alg !== "HS256" ||
      header.typ !== "JWT" ||
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload as AccessPayload;
  } catch {
    return null;
  }
}
