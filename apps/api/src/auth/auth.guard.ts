import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, authCookieOptions, verifyAccessToken } from '../../../app/backend/src/lib/authTokens.js';
import { PrismaService } from '../database/prisma.service';

type AuthenticatedRequest = Request & { userId?: string };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();
    const accessToken = request.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
    const payload = accessToken ? verifyAccessToken(accessToken) : null;
    if (!payload) throw new UnauthorizedException({ message: 'Access token missing or expired.' });

    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException({ message: 'Session missing. Please sign in again.' });

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt <= new Date() || session.userId !== payload.sub) {
      response.clearCookie(ACCESS_COOKIE_NAME, authCookieOptions);
      response.clearCookie(REFRESH_COOKIE_NAME, authCookieOptions);
      throw new UnauthorizedException({ message: 'Session expired or revoked.' });
    }

    request.userId = payload.sub;
    return true;
  }
}