import { Global, Module } from '@nestjs/common';
import { MerchantsModule } from '../merchants/merchants.module';
import { MerchantAuthService } from './merchant-auth.service';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';

@Global()
@Module({
  imports: [MerchantsModule],
  controllers: [AuthController],
  providers: [MerchantAuthService, AdminGuard],
  exports: [MerchantAuthService, AdminGuard],
})
export class AuthModule {}