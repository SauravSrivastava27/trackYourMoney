import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from './database.module.js';
import { AuthGuard } from './auth.guard.js';
import { WebsocketModule } from './websocket.module.js';
import { TransactionsGateway } from './transactions.gateway.js';

const kinds = ['INCOME','EXPENSE'] as const;
const include = { account: { select: { id: true, name: true, currency: true } }, category: { select: { id: true, name: true, type: true } } } as const;
@Injectable()
class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}
  private validate(body: any, partial = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException({ message: 'Invalid transaction details.' });
    const out: any = {};
    if (!partial || body.title !== undefined) { if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) throw new BadRequestException({ message: 'Invalid transaction details.' }); out.title = body.title.trim(); }
    if (!partial || body.amount !== undefined) { const amount = Number(body.amount); if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99) throw new BadRequestException({ message: 'Invalid transaction details.' }); out.amount = amount; }
    if (!partial || body.type !== undefined) { if (!kinds.includes(body.type)) throw new BadRequestException({ message: 'Invalid transaction details.' }); out.type = body.type; }
    if (body.occurredAt !== undefined) { const date = new Date(body.occurredAt); if (Number.isNaN(date.getTime())) throw new BadRequestException({ message: 'Invalid transaction date.' }); out.occurredAt = date; }
    if (body.note !== undefined) { if (body.note !== null && (typeof body.note !== 'string' || body.note.length > 1000)) throw new BadRequestException({ message: 'Invalid transaction note.' }); out.note = body.note?.trim() ?? null; }
    if (!partial || body.accountId !== undefined) { if (typeof body.accountId !== 'string' || !body.accountId) throw new BadRequestException({ message: 'Select a valid account.' }); out.accountId = body.accountId; }
    if (body.categoryId !== undefined) { if (body.categoryId !== null && (typeof body.categoryId !== 'string' || !body.categoryId)) throw new BadRequestException({ message: 'Select a valid category.' }); out.categoryId = body.categoryId; }
    if (partial && !Object.keys(out).length) throw new BadRequestException({ message: 'Provide at least one field to update.' });
    return out;
  }
  async list(userId: string, query: any) {
    const raw = Number.parseInt(String(query.limit ?? '50'), 10);
    const take = Math.min(Math.max(Number.isFinite(raw) && raw ? raw : 50, 1), 100);
    const search = typeof query.search === 'string' ? query.search.trim().slice(0, 120) : '';
    const type = kinds.includes(query.type) ? query.type : undefined;
    return { data: await this.prisma.transaction.findMany({ where: { userId, ...(type ? { type } : {}), ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}) }, include, orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }], take }) };
  }
  private async assertRefs(userId: string, input: any, fallbackType?: 'INCOME'|'EXPENSE') {
    const accountId = input.accountId;
    if (accountId && !await this.prisma.account.findFirst({ where: { id: accountId, userId }, select: { id: true } })) throw new BadRequestException({ message: 'Select a valid account.' });
    const type = input.type ?? fallbackType;
    if (input.categoryId && (!type || !await this.prisma.category.findFirst({ where: { id: input.categoryId, userId, type }, select: { id: true } }))) throw new BadRequestException({ message: 'Select a valid category.' });
  }
  async create(userId: string, body: any) {
    const input = this.validate(body);
    await this.assertRefs(userId, input);
    const data = await this.prisma.$transaction(async tx => {
      const created = await tx.transaction.create({ data: { ...input, amount: input.amount.toFixed(2), occurredAt: input.occurredAt ?? new Date(), accountId: input.accountId, categoryId: input.categoryId ?? null, userId }, include });
      const delta = input.type === 'INCOME' ? input.amount : -input.amount;
      await tx.account.update({ where: { id: input.accountId }, data: { balance: { increment: delta } } });
      return created;
    });
    return { message: 'Transaction created successfully.', data };
  }
  async update(userId: string, id: string, body: any) {
    const input = this.validate(body, true);
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId }, select: { id: true, amount: true, type: true, accountId: true } });
    if (!existing) throw new NotFoundException({ message: 'Transaction not found.' });
    await this.assertRefs(userId, input, existing.type as 'INCOME'|'EXPENSE');
    const nextType = input.type ?? existing.type;
    const nextAmount = input.amount ?? Number(existing.amount);
    const nextAccount = input.accountId ?? existing.accountId;
    const oldDelta = existing.type === 'INCOME' ? -Number(existing.amount) : Number(existing.amount);
    const nextDelta = nextType === 'INCOME' ? nextAmount : -nextAmount;
    const data = await this.prisma.$transaction(async tx => {
      await tx.account.update({ where: { id: existing.accountId }, data: { balance: { increment: oldDelta } } });
      await tx.account.update({ where: { id: nextAccount }, data: { balance: { increment: nextDelta } } });
      return tx.transaction.update({ where: { id }, data: { ...input, ...(input.amount !== undefined ? { amount: input.amount.toFixed(2) } : {}), accountId: nextAccount, type: nextType }, include });
    });
    return { message: 'Transaction updated successfully.', data };
  }
  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId }, select: { id: true, amount: true, type: true, accountId: true } });
    if (!existing) throw new NotFoundException({ message: 'Transaction not found.' });
    const delta = existing.type === 'INCOME' ? -Number(existing.amount) : Number(existing.amount);
    await this.prisma.$transaction(async tx => {
      await tx.account.update({ where: { id: existing.accountId }, data: { balance: { increment: delta } } });
      await tx.transaction.delete({ where: { id } });
    });
    return { message: 'Transaction deleted successfully.', data: { id } };
  }
}
@Controller('transactions')
@UseGuards(AuthGuard)
class TransactionsController {
  constructor(private readonly service: TransactionsService, private readonly gateway: TransactionsGateway) {}
  private uid(req: Request) { const id = (req as Request & { userId?: string }).userId; if (!id) throw new BadRequestException('Authenticated user missing.'); return id; }
  @Get() list(@Req() req: Request, @Query() query: any) { return this.service.list(this.uid(req), query); }
  @Post() async create(@Req() req: Request, @Body() body: any) { const userId = this.uid(req); const result = await this.service.create(userId, body); this.gateway.emitToUser(userId, 'transaction:created', result.data); return result; }
  @Patch(':id') async update(@Req() req: Request, @Param('id') id: string, @Body() body: any) { const userId = this.uid(req); const result = await this.service.update(userId, id, body); this.gateway.emitToUser(userId, 'transaction:updated', result.data); return result; }
  @Delete(':id') async remove(@Req() req: Request, @Param('id') id: string) { const userId = this.uid(req); const result = await this.service.remove(userId, id); this.gateway.emitToUser(userId, 'transaction:deleted', result.data); return result; }
}
@Module({ imports: [WebsocketModule], controllers: [TransactionsController], providers: [TransactionsService] })
export class TransactionsModule {}