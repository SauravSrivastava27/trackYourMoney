import { Router, type Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();
const categoryType = ["INCOME", "EXPENSE"] as const;
const schema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(categoryType),
});

function validationError(res: Response, error: z.ZodError) {
  res.status(400).json({
    message: "Invalid category details.",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    const categories = await prisma.category.findMany({
      where: { userId, type: { in: [...categoryType] } },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    res.status(200).json({ data: categories });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, parsed.error);
      return;
    }
    const userId = res.locals.userId as string;
    const category = await prisma.category.create({
      data: { ...parsed.data, userId },
    });
    res.status(201).json({
      message: "Category created successfully.",
      data: category,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        message: "A category with this name and type already exists.",
      });
      return;
    }
    next(error);
  }
});

export default router;
