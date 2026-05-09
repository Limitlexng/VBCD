import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { IUser, UserRole, UserStatus, TransactionStatus, TransactionType } from '@berry-x/types';

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard summary' })
  getDashboard() {
    return this.adminService.getDashboardSummary();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
  ) {
    return this.adminService.getUsers(Number(page), Number(limit), search, status);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user account' })
  suspendUser(@CurrentUser() user: IUser, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.adminService.suspendUser(id, user.id, body.reason);
  }

  @Patch('users/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a user account' })
  unsuspendUser(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.adminService.unsuspendUser(id, user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List all transactions' })
  getTransactions(
    @Query('page') page = 1,
    @Query('status') status?: TransactionStatus,
    @Query('type') type?: TransactionType,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getTransactions(Number(page), 20, { status, type, userId });
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Revenue analytics' })
  getRevenue(@Query('days') days = 30) {
    return this.adminService.getRevenueAnalytics(Number(days));
  }

  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get audit logs (super admin only)' })
  getAuditLogs(@Query('page') page = 1) {
    return this.adminService.getAuditLogs(Number(page));
  }
}
