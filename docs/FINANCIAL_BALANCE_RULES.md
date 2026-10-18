# Financial balance rules

## Balance model

For each account:

```
current balance = opening balance + income transactions - expense transactions
```

Only INCOME and EXPENSE transactions affect the account balance. The transaction API currently accepts those two types.

- Creating an account sets both its current and opening balance to the supplied opening amount.
- Creating an income transaction adds its amount to the current balance.
- Creating an expense transaction subtracts its amount from the current balance.
- Editing or deleting a transaction reverses the old effect and applies the new effect in a database transaction.
- Editing the account's current balance preserves the transaction history and adjusts the opening balance so the equation remains true.
- The migration derives opening balance from each existing current balance and its existing transaction ledger, preserving the pre-migration current balance.

## Example

Opening balance: ₹0
Income (salary): ₹1,00,000
Expenses: ₹29,300
Expected current balance: ₹70,700

Monthly savings on the dashboard is a separate metric: selected-period income minus expenses. It is not the same as the account's total balance.

## Apply the migration locally

From `app/backend`, make sure your local `.env` points to the intended development database, then run:

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

If the project is configured to use Prisma's development migration command instead, follow the existing local workflow; do not run a schema reset against a database containing data.

## Regression checks

1. Create account with opening balance 0.
2. Add income 100000; current balance should become 100000.
3. Add expense 29300; current balance should become 70700.
4. Edit the expense to 30000; balance should become 70000.
5. Delete that expense; balance should become 100000.
6. Edit current account balance to 90000; opening balance should be recalculated while transactions remain unchanged.
7. Add another income 5000; balance should become 95000.
8. Confirm another user's account cannot be modified by this user.

Run these checks on a development database first. Do not apply migrations to production until reviewed and backed up.
