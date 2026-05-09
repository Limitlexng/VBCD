import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VirtualAccountsService } from './virtual-accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { IUser } from '@berry-x/types';

@ApiTags('Virtual Accounts')
@Controller({ path: 'virtual-accounts', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class VirtualAccountsController {
  constructor(private readonly vaService: VirtualAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user virtual accounts' })
  getVirtualAccounts(@CurrentUser() user: IUser) {
    return this.vaService.getUserVirtualAccounts(user.id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create or get virtual account' })
  createVirtualAccount(@CurrentUser() user: IUser) {
    return this.vaService.createVirtualAccount(user.id);
  }
}
