import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../app/backend/src/generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const data = await this.prisma.category.findMany({
      where: { userId, type: { in: ['INCOME', 'EXPENSE'] } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return { data };
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      const data = await this.prisma.category.create({
        data: { userId, name: dto.name.trim(), type: dto.type },
      });
      return { message: 'Category created successfully.', data };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ message: 'A category with this name and type already exists.' });
      }
      throw error;
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException({ message: 'Category not found.' });

    try {
      const data = await this.prisma.category.update({
        where: { id: existing.id },
        data: { name: dto.name.trim() },
      });
      return { message: 'Category updated successfully.', data };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ message: 'A category with this name and type already exists.' });
      }
      throw error;
    }
  }
}