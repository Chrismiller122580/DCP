import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('balances')
@Controller('balances')
export class BalancesController {
  @Get()
  getBalances(@Query('address') address?: string, @Query('chain') chain = 'xrpl') {
    // Stub - in prod query real chain nodes / providers
    return {
      address: address || 'demo-address',
      chain,
      balance: chain === 'xrpl' ? '125.5' : '0.0',
      currency: chain === 'xrpl' ? 'XRP' : 'NATIVE',
      note: 'Demo stub. Real multi-chain balance queries via blockchain package.',
      timestamp: new Date().toISOString(),
    };
  }
}