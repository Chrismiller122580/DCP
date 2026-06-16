import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MerchantsService } from '../merchants/merchants.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly merchants: MerchantsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Self-service merchant registration (returns API key once)' })
  register(@Body() dto: RegisterMerchantDto) {
    return this.merchants.createMerchant({
      name: dto.name,
      email: dto.email,
      webhookUrl: dto.webhookUrl,
      kycVerified: false,
    });
  }
}