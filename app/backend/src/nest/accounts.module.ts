import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Req, UseGuards, BadRequestException, ConflictException } from '@nestjs/common';
import type { Request } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from './database.module.js';
import { AuthGuard } from './auth.guard.js';

const types = ['CASH','SAVINGS','CHECKING','CREDIT_CARD','INVESTMENT','OTHER'] as const;
@Injectable()
class AccountsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string) { return { data: await this.prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }) }; }
  async create(userId: string, body: any) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const currency = typeof body?.currency === 'string' ? body.currency.trim().toUpperCase() : 'INR';
    const type = body?.type ?? 'CHECKING';
    const balance = body?.balance === undefined ? 0 : Number(body.balance);
    if (!name || name.length > 100 || !/^[A-Z]{3}$/.test(currency) || !types.includes(type) || !Number.isFinite(balance) || Math.abs(balance) > 999999999999.99) throw new BadRequestException({ message: 'Invalid account details.' });
    const data = await this.prisma.account.create({ data: { userId, name, currency, type, balance: balance.toFixed(2), openingBalance: balance.toFixed(2) } });
    return { message: 'Account created successfully.', data };
  }
  async update(userId: string, id: string, body: any) {
    const existing = await this.prisma.account.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) throw new NotFoundException({ message: 'Account not found.' });
    const data: any = {};
    if (body?.name !== undefined) { if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100) throw new BadRequestException({ message: 'Invalid account details.' }); data.name = body.name.trim(); }
    if (body?.currency !== undefined) { const currency = String(body.currency).trim().toUpperCase(); if (!/^[A-Z]{3}$/.test(currency)) throw new BadRequestException({ message: 'Currency must be a 3-letter code.' }); data.currency = currency; }
    if (body?.type !== undefined) { if (!types.includes(body.type)) throw new BadRequestException({ message: 'Invalid account type.' }); data.type = body.type; }
    if (body?.balance !== undefined) {
      const balance = Number(body.balance);
      if (!Number.isFinite(balance) || Math.abs(balance) > 999999999999.99) throw new BadRequestException({ message: 'Invalid account balance.' });
      await this.prisma.$transaction(async tx => {
        const ledger = await tx.transaction.findMany({ where: { accountId: id, userId }, select: { amount: true, type: true } });
        const net = ledger.reduce((sum, item) => sum + (item.type === 'INCOME' ? Number(item.amount) : item.type === 'EXPENSE' ? -Number(item.amount) : 0), 0);
        await tx.account.update({ where: { id }, data: { ...data, balance: balance.toFixed(2), openingBalance: (balance - net).toFixed(2) } });
      });
      return { message: 'Account updated successfully.', data: await this.prisma.account.findUnique({ where: { id } }) };
    }
    if (!Object.keys(data).length) throw new BadRequestException({ message: 'Provide at least one field to update.' });
    return { message: 'Account updated successfully.', data: await this.prisma.account.update({ where: { id }, data }) };
  }
  async remove(userId: string, id: string) {
    const existing = await this.prisma.account.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) throw new NotFoundException({ message: 'Account not found.' });
    try { await this.prisma.account.delete({ where: { id } }); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2003','P2014'].includes(error.code)) throw new ConflictException({ message: 'This account has linked records. Remove or reassign those records before deleting it.' }); throw error; }
    return { message: 'Account deleted successfully.', data: { id } };
  }
}
@Controller('accounts')
@UseGuards(AuthGuard)
class AccountsController {
  constructor(private readonly service: AccountsService) {}
  private uid(req: Request) { const id = (req as Request & { userId?: string }).userId; if (!id) throw new BadRequestException('Authenticated user missing.'); return id; }
  @Get() list(@Req() req: Request) { return this.service.list(this.uid(req)); }
  @Post() create(@Req() req: Request, @Body() body: any) { return this.service.create(this.uid(req), body); }
  @Patch(':id') update(@Req() req: Request, @Param('id') id: string, @Body() body: any) { return this.service.update(this.uid(req), id, body); }
  @Delete(':id') remove(@Req() req: Request, @Param('id') id: string) { return this.service.remove(this.uid(req), id); }
}
@Module({ controllers: [AccountsController], providers: [AccountsService] })
export class AccountsModule {}