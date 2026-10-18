import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './nest/database.module.js';
import { AuthModule } from './nest/auth.module.js';
import { AccountsModule } from './nest/accounts.module.js';
import { CategoriesModule } from './nest/categories.module.js';
import { TransactionsModule } from './nest/transactions.module.js';
import { HealthController } from './nest/health.controller.js';
import { WebsocketModule } from './nest/websocket.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    DatabaseModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    WebsocketModule,
  ],
  controllers: [HealthController],
})
export class NestAppModule {}