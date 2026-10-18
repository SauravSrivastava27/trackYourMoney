import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '../../../app/backend/src/generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS,
  authCookieOptions, createAccessToken, verifyAccessToken,
} from '../../../app/backend/src/lib/authTokens.js';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private setCookies(response: Response, userId: string, token: string, expiresAt: Date) {
    response.cookie(ACCESS_COOKIE_NAME, createAccessToken(userId), {
      ...authCookieOptions, maxAge: 15 * 60 * 1000,
    });
    response.cookie(REFRESH_COOKIE_NAME, token, { ...authCookieOptions, expires: expiresAt });
  }

  private clearCookies(response: Response) {
    response.clearCookie(ACCESS_COOKIE_NAME, authCookieOptions);
    response.clearCookie(REFRESH_COOKIE_NAME, authCookieOptions);
  }

  private async createSession(userId: string, response: Response) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.prisma.session.create({
      data: { tokenHash: hashToken(token), userId, expiresAt },
    });
    this.setCookies(response, userId, token, expiresAt);
  }

  async signup(dto: SignupDto, response: Response) {
    if (dto.acceptedTerms !== true) {
      throw new BadRequestException({
        message: 'Please check your signup details.',
        errors: [{ field: 'acceptedTerms', message: 'You must accept the Terms and Conditions.' }],
      });
    }
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    try {
      const user = await this.prisma.user.create({
        data: { name, email, passwordHash: await bcrypt.hash(dto.password, 12) },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      await this.createSession(user.id, response);
      return { message: 'Account created successfully.', user };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ message: 'An account with this email already exists.' });
      }
      throw error;
    }
  }

  async signin(dto: SigninDto, response: Response) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({ message: 'Invalid email or password.' });
    }
    await this.createSession(user.id, response);
    return {
      message: 'Signed in successfully.',
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    };
  }

  async refresh(request: Request, response: Response) {
    const token = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      this.clearCookies(response);
      throw new UnauthorizedException({ message: 'Refresh token missing. Please sign in again.' });
    }
    const tokenHash = hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash }, select: { id: true, userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await this.prisma.session.deleteMany({ where: { id: session.id } });
      this.clearCookies(response);
      throw new UnauthorizedException({ message: 'Session expired. Please sign in again.' });
    }

    const nextToken = randomBytes(32).toString('hex');
    const nextExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, tokenHash, expiresAt: { gt: new Date() } },
      data: { tokenHash: hashToken(nextToken), expiresAt: nextExpiresAt },
    });
    if (rotated.count !== 1) {
      this.clearCookies(response);
      throw new UnauthorizedException({ message: 'Refresh token already used. Please sign in again.' });
    }
    this.setCookies(response, session.userId, nextToken, nextExpiresAt);
    return { message: 'Session refreshed successfully.' };
  }

  async logout(request: Request, response: Response) {
    const token = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    this.clearCookies(response);
    return { message: 'Signed out successfully.' };
  }

  async me(request: Request, response: Response) {
    const token = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const accessToken = request.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
    const payload = accessToken ? verifyAccessToken(accessToken) : null;
    if (!token || !payload) {
      throw new UnauthorizedException({ message: 'Access token missing or expired.' });
    }
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await this.prisma.session.deleteMany({ where: { id: session.id } });
      this.clearCookies(response);
      throw new UnauthorizedException({ message: 'Session expired or invalid.' });
    }
    if (session.userId !== payload.sub) {
      throw new UnauthorizedException({ message: 'Session does not match access token.' });
    }
    return { user: session.user };
  }
}