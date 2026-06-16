import { Global, Module } from '@nestjs/common';
import { MerchantAuthService } from './merchant-auth.service';
import { AdminGuard } from './admin.guard';

@Global()
@Module({
  providers: [MerchantAuthService, AdminGuard],
  exports: [MerchantAuthService, AdminGuard],
})
export class AuthModule {}