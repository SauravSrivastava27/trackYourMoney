
import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),

  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code.")
    .default("INR"),

  type: z
    .enum([
      "CASH",
      "SAVINGS",
      "CHECKING",
      "CREDIT_CARD",
      "INVESTMENT",
      "OTHER",
    ])
    .default("CHECKING"),

  balance: z.coerce
    .number()
    .finite()
    .min(-999999999999.99)
    .max(999999999999.99)
    .default(0),
});

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ data: accounts });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = createAccountSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid account details.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const userId = res.locals.userId as string;
    const { name, currency, type, balance } = parsed.data;

    const account = await prisma.account.create({
      data: {
        name,
        currency: currency.toUpperCase(),
        type,
        balance: balance.toFixed(2),
        userId,
      },
    });

    res.status(201).json({
      message: "Account created successfully.",
      data: account,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
