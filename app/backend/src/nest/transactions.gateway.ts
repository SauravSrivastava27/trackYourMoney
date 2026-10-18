import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { createHash } from 'node:crypto';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, verifyAccessToken } from '../lib/authTokens.js';
import { PrismaService } from './database.module.js';

function parseCookies(value = ''): Record<string, string> {
  return Object.fromEntries(value.split(';').map(part => {
    const index = part.indexOf('=');
    if (index < 0) return ['', ''];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => Boolean(key)));
}

@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000', credentials: true },
})
@Injectable()
export class TransactionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TransactionsGateway.name);
  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const cookies = parseCookies(client.handshake.headers.cookie);
      const access = cookies[ACCESS_COOKIE_NAME];
      const refresh = cookies[REFRESH_COOKIE_NAME];
      const payload = access ? verifyAccessToken(access) : null;
      if (!payload || !refresh) { client.disconnect(true); return; }
      const session = await this.prisma.session.findUnique({
        where: { tokenHash: createHash('sha256').update(refresh).digest('hex') },
        select: { userId: true, expiresAt: true },
      });
      if (!session || session.expiresAt <= new Date() || session.userId !== payload.sub) {
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
      await client.join(this.room(payload.sub));
    } catch (error) {
      this.logger.warn('WebSocket authentication failed.');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    delete client.data.userId;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(this.room(userId)).emit(event, payload);
  }

  private room(userId: string) { return 'user:' + userId; }
}