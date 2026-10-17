
import { Router, type Request, type Response } from "express";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma.js";

const router = Router();

const COOKIE_NAME = "fintrack_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
};

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

async function createSession(userId: string, res: Response) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await prisma.session.create({
        data: {
            tokenHash: hashToken(token),
            userId,
            expiresAt,
        },
    });

    res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        expires: expiresAt,
    });
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
            res.status(409).json({
                message: "An account with this email already exists.",
            });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        await createSession(user.id, res);

        res.status(201).json({
            message: "Account created successfully.",
            user,
        });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            res.status(409).json({
                message: "An account with this email already exists.",
            });
            return;
        }

        next(error);
    }
});

router.post("/signin", async (req, res, next) => {
    try {
        const parsed = signinSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                message: "Please enter a valid email and password.",
            });
            return;
        }

        const email = parsed.data.email.toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (
            !user ||
            !(await bcrypt.compare(parsed.data.password, user.passwordHash))
        ) {
            res.status(401).json({
                message: "Invalid email or password.",
            });
            return;
        }

        await createSession(user.id, res);

        res.status(200).json({
            message: "Signed in successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post("/logout", async (req, res, next) => {
    try {
        const token = req.cookies?.[COOKIE_NAME] as string | undefined;

        if (token) {
            await prisma.session.deleteMany({
                where: { tokenHash: hashToken(token) },
            });
        }

        res.clearCookie(COOKIE_NAME, cookieOptions);
        res.status(200).json({ message: "Signed out successfully." });
    } catch (error) {
        next(error);
    }
});

router.get("/me", async (req, res, next) => {
    try {
        const token = req.cookies?.[COOKIE_NAME] as string | undefined;

        if (!token) {
            res.status(401).json({ message: "Not authenticated." });
            return;
        }

        const session = await prisma.session.findUnique({
            where: { tokenHash: hashToken(token) },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!session || session.expiresAt <= new Date()) {
            if (session) {
                await prisma.session.delete({ where: { id: session.id } });
            }

            res.clearCookie(COOKIE_NAME, cookieOptions);
            res.status(401).json({ message: "Session expired or invalid." });
            return;
        }

        res.status(200).json({ user: session.user });
    } catch (error) {
        next(error);
    }
});

export default router;
