import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (environment: Record<string, unknown>) => {
        if (typeof environment.DATABASE_URL !== 'string' || !environment.DATABASE_URL) {
          throw new Error('DATABASE_URL is required.');
        }
        return environment;
      },
    }),
    DatabaseModule,
    HealthModule,
    CategoriesModule,
    AuthModule,
  ],
})
export class AppModule {}