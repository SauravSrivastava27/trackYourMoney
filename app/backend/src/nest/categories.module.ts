import { Body, Controller, Get, Module, Patch, Post, Param, Req, UseGuards, BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from './database.module.js';
import { AuthGuard } from './auth.guard.js';

@Injectable()
class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string) {
    return { data: await this.prisma.category.findMany({ where: { userId, type: { in: ['INCOME', 'EXPENSE'] } }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }) };
  }
  async create(userId: string, body: any) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const type = body?.type;
    if (!name || name.length > 60 || !['INCOME','EXPENSE'].includes(type)) throw new BadRequestException({ message: 'Invalid category details.' });
    try { return { message: 'Category created successfully.', data: await this.prisma.category.create({ data: { userId, name, type } }) }; }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException({ message: 'A category with this name and type already exists.' }); throw error; }
  }
  async update(userId: string, id: string, body: any) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 60) throw new BadRequestException({ message: 'Invalid category details.' });
    const existing = await this.prisma.category.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) throw new (await import('@nestjs/common')).NotFoundException({ message: 'Category not found.' });
    try { return { message: 'Category updated successfully.', data: await this.prisma.category.update({ where: { id }, data: { name } }) }; }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException({ message: 'A category with this name and type already exists.' }); throw error; }
  }
}
@Controller('categories')
@UseGuards(AuthGuard)
class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  private uid(req: Request) { const id = (req as Request & { userId?: string }).userId; if (!id) throw new BadRequestException('Authenticated user missing.'); return id; }
  @Get() list(@Req() req: Request) { return this.service.list(this.uid(req)); }
  @Post() create(@Req() req: Request, @Body() body: any) { return this.service.create(this.uid(req), body); }
  @Patch(':id') update(@Req() req: Request, @Param('id') id: string, @Body() body: any) { return this.service.update(this.uid(req), id, body); }
}
@Module({ controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}