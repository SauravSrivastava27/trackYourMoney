
import { Router, type Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

const accountTypes = [
  "CASH",
  "SAVINGS",
  "CHECKING",
  "CREDIT_CARD",
  "INVESTMENT",
  "OTHER",
] as const;

const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),

  currency: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z]{3}$/,
      "Currency must be a 3-letter code."
    )
    .default("INR"),

  type: z.enum(accountTypes).default("CHECKING"),

  balance: z.coerce
    .number()
    .finite()
    .min(-999999999999.99)
    .max(999999999999.99)
    .default(0),
});

const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    currency: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z]{3}$/,
        "Currency must be a 3-letter code."
      ),
    type: z.enum(accountTypes),
    balance: z.coerce
      .number()
      .finite()
      .min(-999999999999.99)
      .max(999999999999.99),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update."
  );

function sendValidationError(
  res: Response,
  error: z.ZodError
) {
  res.status(400).json({
    message: "Invalid account details.",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

function isPrismaErrorCode(
  error: unknown,
  code: string
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

// GET /api/v1/accounts
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/accounts
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = createAccountSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      sendValidationError(res, parsed.error);
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
        openingBalance: balance.toFixed(2),
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

// PATCH /api/v1/accounts/:id
router.patch(
  "/:id",
  requireAuth,
  async (req, res, next) => {
    try {
      const parsed = updateAccountSchema.safeParse(
        req.body
      );

      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }

      const userId = res.locals.userId as string;
      const accountId = req.params.id;
      if (typeof accountId !== "string") {
        res.status(400).json({
          message: "Invalid account ID.",
        });
        return;
      }

      const existing = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
        },
        select: { id: true },
      });

      if (!existing) {
        res.status(404).json({
          message: "Account not found.",
        });
        return;
      }

      const input = parsed.data;

      const account = await prisma.$transaction(async (tx) => {
        const data: {
          name?: string;
          currency?: string;
          type?: (typeof accountTypes)[number];
          balance?: string;
          openingBalance?: string;
        } = {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.currency !== undefined && {
            currency: input.currency.toUpperCase(),
          }),
          ...(input.type !== undefined && { type: input.type }),
        };

        if (input.balance !== undefined) {
          // Treat the edited value as the desired current balance. Keep the
          // recorded ledger intact by adjusting only the opening balance.
          const transactions = await tx.transaction.findMany({
            where: { accountId: existing.id, userId },
            select: { amount: true, type: true },
          });
          const ledgerNet = transactions.reduce((sum, item) => {
            const amount = Number(item.amount);
            return sum + (item.type === "INCOME" ? amount : -amount);
          }, 0);
          data.balance = input.balance.toFixed(2);
          data.openingBalance = (input.balance - ledgerNet).toFixed(2);
        }

        return tx.account.update({
          where: { id: existing.id },
          data,
        });
      });

      res.status(200).json({
        message: "Account updated successfully.",
        data: account,
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2025")) {
        res.status(404).json({
          message: "Account not found.",
        });
        return;
      }

      next(error);
    }
  }
);

// DELETE /api/v1/accounts/:id
router.delete(
  "/:id",
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = res.locals.userId as string;
      const accountId = req.params.id;
      if (typeof accountId !== "string") {
        res.status(400).json({
          message: "Invalid account ID.",
        });
        return;
      }

      const existing = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
        },
        select: { id: true },
      });

      if (!existing) {
        res.status(404).json({
          message: "Account not found.",
        });
        return;
      }

      await prisma.account.delete({
        where: { id: existing.id },
      });

      res.status(200).json({
        message: "Account deleted successfully.",
        data: { id: existing.id },
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2003")) {
        res.status(409).json({
          message:
            "This account has linked records. " +
            "Remove or reassign those records before deleting it.",
        });
        return;
      }

      if (isPrismaErrorCode(error, "P2025")) {
        res.status(404).json({
          message: "Account not found.",
        });
        return;
      }

      next(error);
    }
  }
);

export default router;
