import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('signup') signup(@Body() body: any, @Res({ passthrough: true }) res: Response) { return this.auth.signup(body, res); }
  @Post('signin') @HttpCode(200) signin(@Body() body: any, @Res({ passthrough: true }) res: Response) { return this.auth.signin(body, res); }
  @Post('refresh') @HttpCode(200) refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) { return this.auth.refresh(req, res); }
  @Post('logout') @HttpCode(200) logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) { return this.auth.logout(req, res); }
  @Get('me') me(@Req() req: Request, @Res({ passthrough: true }) res: Response) { return this.auth.me(req, res); }
}