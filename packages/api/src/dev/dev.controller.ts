import { Controller, Post, Body, Headers, BadRequestException, UnauthorizedException, Get } from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';
import { ReconciliationService } from '../reconciliation/reconciliation.service';
import { Client, Wallet, xrpToDrops } from 'xrpl';

@ApiTags('dev')
@ApiSecurity('api-key')
@Controller('dev')
export class DevController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xrpl: XrplService,
    private readonly reconciliation: ReconciliationService,
  ) {}

  @Post('simulate-payment')
  async simulatePayment(
    @Body() body: { invoiceId?: string; destinationTag?: number },
    @Headers('x-api-key') apiKey: string,
  ) {
    if (!apiKey) throw new BadRequestException('X-API-Key required');

    const merchant = await this.prisma.merchant.findFirst({ where: { apiKeyHash: apiKey } });
    if (!merchant) throw new UnauthorizedException('Invalid API key');

    let invoice;
    if (body.invoiceId) {
      invoice = await this.prisma.invoice.findFirst({
        where: { id: body.invoiceId, merchantId: merchant.id, status: 'pending' },
      });
    } else if (body.destinationTag) {
      invoice = await this.prisma.invoice.findFirst({
        where: {
          destinationTag: body.destinationTag,
          merchantId: merchant.id,
          status: 'pending',
          chain: 'xrpl',
        },
      });
    }

    if (!invoice) {
      throw new BadRequestException('No matching pending XRPL invoice found');
    }

    let txHash: string;

    if (invoice.chain === 'xrpl') {
      // Real XRPL testnet payment (listener will auto-confirm)
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const { wallet: sender } = await client.fundWallet();
      const payment = {
        TransactionType: 'Payment' as const,
        Account: sender.classicAddress,
        Destination: invoice.destinationAddress,
        DestinationTag: invoice.destinationTag,
        Amount: xrpToDrops(invoice.amount),
      };

      const prepared = await client.autofill(payment);
      const signed = sender.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      await client.disconnect();
      txHash = result.result.hash as string;
    } else {
      // Stub for other coins (no full chain impl yet)
      txHash = 'sim-' + Date.now().toString(16) + '-' + invoice.chain;
    }

    // For demo: directly mark paid for non-XRPL (or if listener slow). XRPL listener will also handle.
    if (invoice.chain !== 'xrpl') {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
          txHash,
          paidAt: new Date(),
          payerAddress: 'demo-sender-' + invoice.chain,
        },
      });
    }

    return {
      success: true,
      invoiceId: invoice.id,
      simulatedTxHash: txHash,
      message: invoice.chain === 'xrpl'
        ? 'Payment submitted on XRPL testnet. Listener should auto-confirm shortly.'
        : 'Simulated payment for ' + invoice.chain + '. Invoice marked paid.',
    };
  }

  @Post('reconcile')
  async manualReconcile(@Headers('x-api-key') apiKey: string) {
    if (!apiKey || apiKey !== 'dcp_dev_1234567890') {
      throw new UnauthorizedException('Dev key required');
    }
    const result = await this.reconciliation.triggerReconciliation();
    return { ...result, message: 'Reconciliation triggered for pending invoices' };
  }

  @Get('webhook-deliveries')
  async listRecentDeliveries(@Headers('x-api-key') apiKey: string) {
    if (!apiKey || apiKey !== 'dcp_dev_1234567890') {
      throw new UnauthorizedException('Dev key required');
    }
    const deliveries = await this.prisma.webhookDelivery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { deliveries };
  }
}
