import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService, InitiateTransferDto } from './transactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { IUser, TransactionType, TransactionStatus } from '@berry-x/types';

@ApiTags('Transactions')
@Controller({ path: 'transactions', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get transaction history' })
  getTransactions(
    @CurrentUser() user: IUser,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.getTransactions(user.id, {
      type,
      status,
      page: Number(page),
      limit: Number(limit),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  getTransaction(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.transactionsService.getTransactionById(id, user.id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get transaction timeline/status history' })
  getTimeline(@Param('id') id: string) {
    return this.transactionsService.getTransactionTimeline(id);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Initiate bank transfer' })
  initiateTransfer(@CurrentUser() user: IUser, @Body() dto: Omit<InitiateTransferDto, 'userId'>) {
    return this.transactionsService.initiateBankTransfer({ ...dto, userId: user.id });
  }
}
