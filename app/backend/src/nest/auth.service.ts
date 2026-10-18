import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS, authCookieOptions, createAccessToken, verifyAccessToken } from '../lib/authTokens.js';
import { PrismaService } from './database.module.js';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  private setCookies(res: Response, userId: string, token: string, expiresAt: Date) {
    res.cookie(ACCESS_COOKIE_NAME, createAccessToken(userId), { ...authCookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE_NAME, token, { ...authCookieOptions, expires: expiresAt });
  }
  private clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE_NAME, authCookieOptions);
    res.clearCookie(REFRESH_COOKIE_NAME, authCookieOptions);
  }
  private async createSession(userId: string, res: Response) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
    this.setCookies(res, userId, token, expiresAt);
  }
  async signup(input: any, res: Response) {
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = input?.password;
    if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length < 8 || password.length > 128 || input?.acceptedTerms !== true) {
      throw new BadRequestException({ message: 'Please check your signup details.' });
    }
    try {
      const user = await this.prisma.user.create({
        data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      await this.createSession(user.id, res);
      return { message: 'Account created successfully.', user };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException({ message: 'An account with this email already exists.' });
      throw error;
    }
  }
  async signin(input: any, res: Response) {
    const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input?.password === 'string' ? input.password : '';
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException({ message: 'Invalid email or password.' });
    await this.createSession(user.id, res);
    return { message: 'Signed in successfully.', user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } };
  }
  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) { this.clearCookies(res); throw new UnauthorizedException({ message: 'Refresh token missing. Please sign in again.' }); }
    const tokenHash = hashToken(token);
    const session = await this.prisma.session.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true } });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await this.prisma.session.deleteMany({ where: { id: session.id } });
      this.clearCookies(res);
      throw new UnauthorizedException({ message: 'Session expired. Please sign in again.' });
    }
    const nextToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const updated = await this.prisma.session.updateMany({ where: { id: session.id, tokenHash, expiresAt: { gt: new Date() } }, data: { tokenHash: hashToken(nextToken), expiresAt } });
    if (updated.count !== 1) { this.clearCookies(res); throw new UnauthorizedException({ message: 'Refresh token already used. Please sign in again.' }); }
    this.setCookies(res, session.userId, nextToken, expiresAt);
    return { message: 'Session refreshed successfully.' };
  }
  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    this.clearCookies(res);
    return { message: 'Signed out successfully.' };
  }
  async me(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const access = req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
    const payload = access ? verifyAccessToken(access) : null;
    if (!token || !payload) throw new UnauthorizedException({ message: 'Access token missing or expired.' });
    const session = await this.prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { select: { id: true, name: true, email: true, createdAt: true } } } });
    if (!session || session.expiresAt <= new Date() || session.userId !== payload.sub) {
      this.clearCookies(res);
      throw new UnauthorizedException({ message: 'Session expired or invalid.' });
    }
    return { user: session.user };
  }
}