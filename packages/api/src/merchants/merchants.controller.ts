import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated merchant profile' })
  @ApiHeader({ name: 'X-API-Key', required: true })
  async me(@Headers('x-api-key') apiKey: string) {
    if (!apiKey) throw new BadRequestException('X-API-Key header required');
    return this.merchants.getMe(apiKey);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update merchant webhook settings' })
  @ApiHeader({ name: 'X-API-Key', required: true })
  async updateMe(
    @Headers('x-api-key') apiKey: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    if (!apiKey) throw new BadRequestException('X-API-Key header required');
    return this.merchants.updateMe(apiKey, dto);
  }

  @Post('me/test-connection')
  @ApiOperation({ summary: 'Test API connectivity for the authenticated merchant' })
  @ApiHeader({ name: 'X-API-Key', required: true })
  async testConnection(
    @Headers('x-api-key') apiKey: string,
    @Query('baseUrl') baseUrl?: string,
  ) {
    if (!apiKey) throw new BadRequestException('X-API-Key header required');
    return this.merchants.testConnection(apiKey, baseUrl);
  }
}