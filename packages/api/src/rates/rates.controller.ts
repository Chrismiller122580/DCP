import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('rates')
@Controller('rates')
export class RatesController {
  // Simple stub rates for demo (in production use real oracle / coingecko etc.)
  @Get()
  getRates(@Query('base') base = 'USD') {
    const rates = {
      XRP: 0.52, // example
      BTC: 65000,
      ETH: 3400,
      SOL: 145,
      USDC: 1.0,
      DOGE: 0.12,
    };

    return {
      base,
      rates,
      timestamp: new Date().toISOString(),
      note: 'Demo rates — not live',
    };
  }
}