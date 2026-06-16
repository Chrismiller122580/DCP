import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiHeader({ name: 'X-Admin-Key', required: true })
export class AdminMerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Get('merchants')
  @ApiOperation({ summary: 'List all merchants (admin)' })
  list() {
    return this.merchants.listMerchants();
  }

  @Post('merchants')
  @ApiOperation({ summary: 'Create merchant and issue API key (admin)' })
  create(@Body() dto: CreateMerchantDto) {
    return this.merchants.createMerchant(dto);
  }

  @Get('merchants/:id')
  @ApiOperation({ summary: 'Get merchant by ID (admin)' })
  get(@Param('id') id: string) {
    return this.merchants.getMerchant(id);
  }

  @Patch('merchants/:id')
  @ApiOperation({ summary: 'Update merchant (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateMerchantDto) {
    return this.merchants.updateMerchant(id, dto);
  }

  @Post('merchants/:id/rotate-key')
  @ApiOperation({ summary: 'Rotate merchant API key (admin)' })
  rotateKey(@Param('id') id: string) {
    return this.merchants.rotateApiKey(id);
  }

  @Get('webhook-deliveries')
  @ApiOperation({ summary: 'List recent webhook deliveries across all merchants (admin)' })
  webhookDeliveries(@Query('limit') limit?: string) {
    return this.merchants.listWebhookDeliveries(limit ? Number(limit) : 50);
  }
}