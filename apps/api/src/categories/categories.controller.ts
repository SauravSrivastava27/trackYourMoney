import { Body, Controller, Get, Param, Patch, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  private userId(request: Request): string {
    const userId = (request as Request & { userId?: string }).userId;
    if (!userId) throw new UnauthorizedException({ message: 'Access token missing or expired.' });
    return userId;
  }

  @Get()
  findAll(@Req() request: Request) {
    return this.categories.findAll(this.userId(request));
  }

  @Post()
  create(@Req() request: Request, @Body() dto: CreateCategoryDto) {
    return this.categories.create(this.userId(request), dto);
  }

  @Patch(':id')
  update(@Req() request: Request, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(this.userId(request), id, dto);
  }
}