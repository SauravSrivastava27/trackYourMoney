import type { RequestHandler } from "express";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  authCookieOptions,
  verifyAccessToken,
} from "../lib/authTokens.js";
import { createHash } from "node:crypto";
import prisma from "../lib/prisma.js";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
    if (!accessToken) {
      res.status(401).json({ message: "Access token missing or expired." });
      return;
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      res.status(401).json({ message: "Access token invalid or expired." });
      return;
    }

    // Verify that the server-side refresh session still exists so logout/revocation
    // takes effect immediately, even while an access token has not expired yet.
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ message: "Session missing. Please sign in again." });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      select: { userId: true, expiresAt: true },
    });

    if (!session || session.expiresAt <= new Date() || session.userId !== payload.sub) {
      res.clearCookie(ACCESS_COOKIE_NAME, authCookieOptions);
      res.clearCookie(REFRESH_COOKIE_NAME, authCookieOptions);
      res.status(401).json({ message: "Session expired or revoked." });
      return;
    }

    res.locals.userId = payload.sub;
    next();
  } catch (error) {
    next(error);
  }
};

export default requireAuth;
