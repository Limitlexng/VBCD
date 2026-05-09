import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { UserRole } from '@berry-x/types';

@ApiTags('Providers')
@Controller({ path: 'providers', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @ApiOperation({ summary: 'List all payment providers' })
  getAll() {
    return this.providersService.getAllProviders();
  }

  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @ApiOperation({ summary: 'Get provider health summary' })
  getHealth() {
    return this.providersService.getHealthSummary();
  }

  @Get('routes')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @ApiOperation({ summary: 'Get payment routes' })
  getRoutes() {
    return this.providersService.getRoutes();
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enable or disable a provider' })
  toggle(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.providersService.toggleProvider(id, body.enabled);
  }

  @Patch(':id/maintenance')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set provider maintenance mode' })
  setMaintenance(@Param('id') id: string, @Body() body: { message: string | null }) {
    return this.providersService.setMaintenance(id, body.message);
  }

  @Post(':id/health-check')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @ApiOperation({ summary: 'Trigger manual health check for provider' })
  healthCheck(@Param('id') id: string) {
    return this.providersService.runHealthCheck(id);
  }
}
