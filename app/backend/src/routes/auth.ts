import { Router, type Response } from "express";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  authCookieOptions,
  createAccessToken,
  verifyAccessToken,
} from "../lib/authTokens.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  acceptedTerms: z.boolean().refine((value) => value, {
    message: "You must accept the Terms and Conditions.",
  }),
});

const signinSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function setAuthCookies(
  res: Response,
  userId: string,
  refreshToken: string,
  refreshExpiresAt: Date
) {
  res.cookie(ACCESS_COOKIE_NAME, createAccessToken(userId), {
    ...authCookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...authCookieOptions,
    expires: refreshExpiresAt,
  });
}

async function createSession(userId: string, res: Response) {
  const refreshToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt,
    },
  });

  setAuthCookies(res, userId, refreshToken, expiresAt);
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, authCookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, authCookieOptions);
}

router.post("/signup", async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Please check your signup details.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    await createSession(user.id, res);
    res.status(201).json({ message: "Account created successfully.", user });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }
    next(error);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Please enter a valid email and password." });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    await createSession(user.id, res);
    res.status(200).json({
      message: "Signed in successfully.",
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    next(error);
  }
});

// Rotate the refresh token on every successful refresh.
router.post("/refresh", async (req, res, next) => {
  try {
    const currentToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!currentToken) {
      clearAuthCookies(res);
      res.status(401).json({ message: "Refresh token missing. Please sign in again." });
      return;
    }

    const currentHash = hashToken(currentToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash: currentHash },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.deleteMany({ where: { id: session.id } });
      clearAuthCookies(res);
      res.status(401).json({ message: "Session expired. Please sign in again." });
      return;
    }

    const nextToken = randomBytes(32).toString("hex");
    const nextExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const rotated = await prisma.session.updateMany({
      where: { id: session.id, tokenHash: currentHash, expiresAt: { gt: new Date() } },
      data: { tokenHash: hashToken(nextToken), expiresAt: nextExpiresAt },
    });

    // A zero count means another refresh already rotated this token.
    if (rotated.count !== 1) {
      clearAuthCookies(res);
      res.status(401).json({ message: "Refresh token already used. Please sign in again." });
      return;
    }

    setAuthCookies(res, session.userId, nextToken, nextExpiresAt);
    res.status(200).json({ message: "Session refreshed successfully." });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (token) {
      await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    }
    clearAuthCookies(res);
    res.status(200).json({ message: "Signed out successfully." });
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const accessToken = req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
    const accessPayload = accessToken ? verifyAccessToken(accessToken) : null;
    if (!token || !accessPayload) {
      res.status(401).json({ message: "Access token missing or expired." });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.deleteMany({ where: { id: session.id } });
      clearAuthCookies(res);
      res.status(401).json({ message: "Session expired or invalid." });
      return;
    }

    if (session.userId !== accessPayload.sub) {
      res.status(401).json({ message: "Session does not match access token." });
      return;
    }

    res.status(200).json({ user: session.user });
  } catch (error) {
    next(error);
  }
});

export default router;
