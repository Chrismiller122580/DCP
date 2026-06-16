import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payouts')
@Controller('payouts')
export class PayoutsController {
  @Post()
  createPayout(@Body() body: any) {
    return {
      id: 'payout_' + Date.now(),
      status: 'pending',
      ...body,
      note: 'Stub — real on-chain payouts in future',
      createdAt: new Date().toISOString(),
    };
  }
}