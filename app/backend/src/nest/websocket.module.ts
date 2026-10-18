import { Module } from '@nestjs/common';
import { TransactionsGateway } from './transactions.gateway';

@Module({ providers: [TransactionsGateway], exports: [TransactionsGateway] })
export class WebsocketModule {}