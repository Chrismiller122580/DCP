import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('invoices')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice (XRPL primary for MVP)' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  async create(
    @Body() dto: CreateInvoiceDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<InvoiceResponseDto> {
    if (!apiKey) throw new BadRequestException('X-API-Key header required');
    return this.invoicesService.createInvoice(dto, apiKey);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an invoice by ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async findOne(
    @Param('id') id: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.getInvoice(id, apiKey);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  @Get()
  @ApiOperation({ summary: 'List recent invoices for the authenticated merchant' })
  @ApiResponse({ status: 200, type: [InvoiceResponseDto] })
  async list(@Headers('x-api-key') apiKey: string): Promise<InvoiceResponseDto[]> {
    return this.invoicesService.listInvoices(apiKey);
  }
}
