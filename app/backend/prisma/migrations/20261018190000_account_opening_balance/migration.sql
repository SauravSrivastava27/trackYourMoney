ALTER TABLE "Account"
ADD COLUMN "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Preserve each existing account's current balance while separating
-- the opening amount from the net effect of already-recorded transactions.
UPDATE "Account" AS a
SET "openingBalance" = a."balance" - COALESCE(
  (
    SELECT SUM(
      CASE
        WHEN t."type" = 'INCOME' THEN t."amount"
        WHEN t."type" = 'EXPENSE' THEN -t."amount"
        ELSE 0
      END
    )
    FROM "Transaction" AS t
    WHERE t."accountId" = a."id"
  ),
  0
);
