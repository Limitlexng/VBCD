import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { IUser, UserRole } from '@berry-x/types';

@ApiTags('Analytics')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('transactions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.OPERATIONS)
  @ApiOperation({ summary: 'Transaction metrics over time' })
  getTransactionMetrics(@Query('days') days = 30) {
    return this.analyticsService.getTransactionMetrics(Number(days));
  }

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'User growth metrics' })
  getUserMetrics(@Query('days') days = 30) {
    return this.analyticsService.getUserMetrics(Number(days));
  }

  @Get('transactions/by-type')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Transaction breakdown by type' })
  getByType() {
    return this.analyticsService.getTransactionsByType();
  }

  @Get('users/top')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Top users by volume' })
  getTopUsers(@Query('limit') limit = 10) {
    return this.analyticsService.getTopUsers(Number(limit));
  }

  @Get('me/summary')
  @ApiOperation({ summary: 'Current user transaction summary' })
  getMyStats(@CurrentUser() user: IUser) {
    return this.analyticsService.getUserTransactionSummary(user.id);
  }
}
