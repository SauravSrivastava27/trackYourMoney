import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.signup(dto, response);
  }

  @Post('signin')
  @HttpCode(200)
  signin(@Body() dto: SigninDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.signin(dto, response);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.refresh(request, response);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.logout(request, response);
  }

  @Get('me')
  me(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.me(request, response);
  }
}