import { Controller, Get, Patch, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../../common/decorators';
import { FeatureKey, UserRole, IUser } from '@berry-x/types';

@ApiTags('Features')
@Controller({ path: 'features', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagsController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public feature flag states' })
  getPublic() {
    return this.flagsService.getPublicFlags();
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all feature flags (admin)' })
  getAll() {
    return this.flagsService.getAllFlags();
  }

  @Patch(':key')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a feature flag' })
  update(@Param('key') key: FeatureKey, @Body() body: Partial<Record<string, unknown>>, @CurrentUser() user: IUser) {
    return this.flagsService.updateFlag(key, body as never, user.id);
  }

  @Get('config')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all dynamic configs' })
  getConfigs(@Query('category') category?: string) {
    return this.flagsService.getAllConfigs(category);
  }

  @Post('config')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Set a dynamic config value' })
  setConfig(
    @Body() body: { key: string; value: unknown; category?: string; description?: string },
    @CurrentUser() user: IUser,
  ) {
    return this.flagsService.setConfig(body.key, body.value, user.id, body.category, body.description);
  }
}
