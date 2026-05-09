import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { IUser, UserRole, KycDocumentType } from '@berry-x/types';

@ApiTags('KYC')
@Controller({ path: 'kyc', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get user KYC status' })
  getStatus(@CurrentUser() user: IUser) {
    return this.kycService.getKycStatus(user.id);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC documents' })
  submit(
    @CurrentUser() user: IUser,
    @Body() body: {
      tier: number;
      bvn?: string;
      nin?: string;
      dateOfBirth?: string;
      address?: string;
      documents?: { type: KycDocumentType; fileUrl: string; fileSize: number; mimeType: string }[];
    },
  ) {
    return this.kycService.submitKyc(user.id, body.tier, {
      ...body,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
    });
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Get pending KYC submissions (admin)' })
  getPending(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.kycService.getPendingKyc(Number(page), Number(limit));
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Review and approve/reject KYC' })
  review(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() body: { approved: boolean; notes?: string },
  ) {
    return this.kycService.reviewKyc(id, body.approved, user.id, body.notes);
  }
}
