import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { XrplService } from './xrpl/xrpl.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly xrpl: XrplService) {}

  @Get()
  getRoot() {
    return { name: 'DCP API', status: 'ok', version: '0.1.0', chain: 'xrpl-primary + multi-coin' };
  }

  @Get('health')
  async getHealth() {
    const xrplStatus = await this.getXrplHealth();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      chains: {
        xrpl: xrplStatus,
        // TODO: add real status for bitcoin/ethereum/solana/base/dogecoin via providers
      },
      features: ['reliable-webhooks', 'idempotent-payments', 'listener+polling-fallback', 'bullmq-queues', 'reconciliation'],
    };
  }

  private async getXrplHealth() {
    try {
      // Lightweight balance check on the listen address for connectivity
      await this.xrpl.getBalance?.('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
      return { connected: true, network: 'testnet' };
    } catch {
      return { connected: false, network: 'testnet', degraded: true };
    }
  }
}
