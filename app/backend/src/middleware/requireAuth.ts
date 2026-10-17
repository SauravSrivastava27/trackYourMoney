import {
  createHash,
} from "node:crypto";
import type {
  RequestHandler,
} from "express";
import prisma from "../lib/prisma.js";

const COOKIE_NAME = "fintrack_session";

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

const requireAuth: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] as
      | string
      | undefined;

    if (!token) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const session = await prisma.session.findUnique({
      where: {
        tokenHash: hashToken(token),
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) {
        await prisma.session.deleteMany({
          where: { id: session.id },
        });
      }

      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.status(401).json({
        message: "Session expired or invalid.",
      });
      return;
    }

    res.locals.userId = session.userId;
    next();
  } catch (error) {
    next(error);
  }
};

export default requireAuth;