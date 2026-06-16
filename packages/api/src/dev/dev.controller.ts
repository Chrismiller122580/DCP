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
      // Real XRPL testnet payment (listener will auto-confirm) - reliable send with funded wallet
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
      // For real payouts in prod: use merchant's funded wallet, add fee estimation, multi-sig if needed
    } else if (invoice.chain === 'solana') {
      // Real Solana testnet interaction using @solana/web3.js for reliability demo
      // Note: Full send requires a funded keypair + private key. Here we do a live connection + recent blockhash
      // to simulate "broadcast", then generate a plausible tx signature. In prod use real key + sendTransaction.
      const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      const conn = new Connection('https://api.testnet.solana.com', 'confirmed');
      
      // Live call for realism
      const blockhash = await conn.getLatestBlockhash();
      const from = Keypair.generate(); // In real demo: load from env funded key
      const to = new PublicKey(invoice.destinationAddress || '11111111111111111111111111111111');
      
      // Build a simple transfer tx (demo amount in lamports)
      const lamports = Math.floor(parseFloat(invoice.amount || '0.01') * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from.publicKey,
          toPubkey: to,
          lamports: lamports || 1000000,
        })
      );
      tx.recentBlockhash = blockhash.blockhash;
      tx.feePayer = from.publicKey;
      
      // "Sign" and get signature (in real: sign and send)
      const signature = tx.signatures[0]?.signature?.toString('base64') || Keypair.generate().publicKey.toBase58();
      txHash = signature;
      
      console.log(`[SOLANA DEMO] Live blockhash fetched: ${blockhash.blockhash}`);
      console.log(`[SOLANA DEMO] Constructed transfer tx for ~${invoice.amount} SOL to ${invoice.destinationAddress}. Sig: ${txHash}`);
      // For full: await conn.sendTransaction(tx, [from]);
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

  // XRPL Escrow endpoints for reliable conditional payments
  @Post('escrow/create')
  async createEscrow(@Headers('x-api-key') apiKey: string, @Body() body: { destination: string; amount: string; finishAfter: number; cancelAfter?: number }) {
    if (!apiKey || apiKey !== 'dcp_dev_1234567890') throw new UnauthorizedException('Dev key required');
    return this.xrpl.createEscrow(body.destination, body.amount, body.finishAfter, body.cancelAfter);
  }

  @Post('escrow/finish')
  async finishEscrow(@Headers('x-api-key') apiKey: string, @Body() body: { owner: string; escrowSequence: number }) {
    if (!apiKey || apiKey !== 'dcp_dev_1234567890') throw new UnauthorizedException('Dev key required');
    return this.xrpl.finishEscrow(body.owner, body.escrowSequence);
  }
}
