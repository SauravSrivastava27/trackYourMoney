import { Router, type Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

const transactionType = ["INCOME", "EXPENSE"] as const;
const moneyAmount = z.coerce.number().finite().positive().max(999999999999.99);

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: moneyAmount,
  type: z.enum(transactionType),
  occurredAt: z.coerce.date().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  accountId: z.string().min(1),
  categoryId: z.string().min(1).nullable().optional(),
});

const updateSchema = createSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Provide at least one field to update."
);

function sendValidationError(res: Response, error: z.ZodError) {
  res.status(400).json({
    message: "Invalid transaction details.",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

async function ownsAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  return Boolean(account);
}

async function ownsCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  return Boolean(category);
}

// GET /api/v1/transactions
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    const limit = Math.min(
      Math.max(Number.parseInt(String(req.query.limit ?? "50"), 10) || 50, 1),
      100
    );
    const search = typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 120)
      : "";
    const type = req.query.type === "INCOME" || req.query.type === "EXPENSE"
      ? req.query.type
      : undefined;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        account: { select: { id: true, name: true, currency: true } },
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    res.status(200).json({ data: transactions });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/transactions
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const userId = res.locals.userId as string;
    const input = parsed.data;

    if (!(await ownsAccount(userId, input.accountId))) {
      res.status(400).json({ message: "Select a valid account." });
      return;
    }

    if (input.categoryId && !(await ownsCategory(userId, input.categoryId))) {
      res.status(400).json({ message: "Select a valid category." });
      return;
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          title: input.title,
          amount: input.amount.toFixed(2),
          type: input.type,
          occurredAt: input.occurredAt ?? new Date(),
          note: input.note ?? null,
          accountId: input.accountId,
          categoryId: input.categoryId ?? null,
          userId,
        },
        include: {
          account: { select: { id: true, name: true, currency: true } },
          category: { select: { id: true, name: true, type: true } },
        },
      });
      const delta = input.type === "INCOME" ? input.amount : -input.amount;
      await tx.account.update({
        where: { id: input.accountId },
        data: { balance: { increment: delta } },
      });
      return created;
    });

    res.status(201).json({
      message: "Transaction created successfully.",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/transactions/:id
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const userId = res.locals.userId as string;
    const id = req.params.id;
    if (typeof id !== "string") {
      res.status(400).json({ message: "Invalid transaction ID." });
      return;
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true, amount: true, type: true, accountId: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Transaction not found." });
      return;
    }

    const input = parsed.data;
    if (input.accountId && !(await ownsAccount(userId, input.accountId))) {
      res.status(400).json({ message: "Select a valid account." });
      return;
    }
    if (input.categoryId && !(await ownsCategory(userId, input.categoryId))) {
      res.status(400).json({ message: "Select a valid category." });
      return;
    }

    const nextType = input.type ?? existing.type;
    const nextAmount = input.amount ?? Number(existing.amount);
    const nextAccountId = input.accountId ?? existing.accountId;
    const oldDelta = existing.type === "INCOME"
      ? -Number(existing.amount)
      : Number(existing.amount);
    const nextDelta = nextType === "INCOME" ? nextAmount : -nextAmount;

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldDelta } },
      });
      await tx.account.update({
        where: { id: nextAccountId },
        data: { balance: { increment: nextDelta } },
      });
      return tx.transaction.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.amount !== undefined && { amount: input.amount.toFixed(2) }),
          ...(input.type !== undefined && { type: input.type }),
          ...(input.occurredAt !== undefined && { occurredAt: input.occurredAt }),
          ...(input.note !== undefined && { note: input.note }),
          ...(input.accountId !== undefined && { accountId: input.accountId }),
          ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        },
        include: {
          account: { select: { id: true, name: true, currency: true } },
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    res.status(200).json({
      message: "Transaction updated successfully.",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/transactions/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    const id = req.params.id;
    if (typeof id !== "string") {
      res.status(400).json({ message: "Invalid transaction ID." });
      return;
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true, amount: true, type: true, accountId: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Transaction not found." });
      return;
    }

    const balanceDelta = existing.type === "INCOME"
      ? -Number(existing.amount)
      : Number(existing.amount);
    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: balanceDelta } },
      });
      await tx.transaction.delete({ where: { id } });
    });
    res.status(200).json({
      message: "Transaction deleted successfully.",
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
