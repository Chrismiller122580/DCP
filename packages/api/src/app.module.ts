import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InvoicesModule } from './invoices/invoices.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PrismaModule } from './prisma/prisma.module';
import { DevModule } from './dev/dev.module';
import { RatesModule } from './rates/rates.module';
import { PayoutsModule } from './payouts/payouts.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { BalancesModule } from './balances/balances.module';
import { BullModule } from '@nestjs/bullmq';
import { SolanaModule } from './solana/solana.module';
import { EvmModule } from './evm/evm.module';
import { AuthModule } from './auth/auth.module';
import { MerchantsModule } from './merchants/merchants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 100, // 100 req/min per IP for reliability against abuse
    }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_PRIVATE_URL') ||
          configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return {
            connection: {
              url: redisUrl,
              connectTimeout: 5000,
              maxRetriesPerRequest: null,
            },
          };
        }
        return {
          connection: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            connectTimeout: 5000,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    MerchantsModule,
    InvoicesModule,
    WebhooksModule,
    DevModule,
    RatesModule,
    PayoutsModule,
    ReconciliationModule,
    BalancesModule,
    SolanaModule,
    EvmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
