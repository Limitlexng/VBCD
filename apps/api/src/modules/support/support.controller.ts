import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { IUser, UserRole, TicketCategory, TicketStatus } from '@berry-x/types';

@ApiTags('Support')
@Controller({ path: 'support', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  createTicket(
    @CurrentUser() user: IUser,
    @Body() body: { category: TicketCategory; subject: string; description: string; relatedTransactionId?: string },
  ) {
    return this.supportService.createTicket(user.id, body);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get user tickets' })
  getTickets(@CurrentUser() user: IUser, @Query('page') page = 1) {
    return this.supportService.getUserTickets(user.id, Number(page));
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket with messages' })
  getTicket(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.supportService.getTicketWithMessages(id, user.id);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Reply to a ticket' })
  addMessage(@CurrentUser() user: IUser, @Param('id') id: string, @Body() body: { message: string }) {
    return this.supportService.addMessage(id, user.id, 'user', body.message);
  }

  @Get('admin/tickets')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get all tickets (admin)' })
  getAllTickets(@Query('status') status?: TicketStatus, @Query('category') category?: TicketCategory, @Query('page') page = 1) {
    return this.supportService.getAllTickets(Number(page), 20, status, category);
  }

  @Post('admin/tickets/:id/reply')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Agent reply to ticket' })
  agentReply(@CurrentUser() user: IUser, @Param('id') id: string, @Body() body: { message: string }) {
    return this.supportService.addMessage(id, user.id, 'support', body.message);
  }

  @Patch('admin/tickets/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(@CurrentUser() user: IUser, @Param('id') id: string, @Body() body: { status: TicketStatus }) {
    return this.supportService.updateTicketStatus(id, body.status, user.id);
  }

  @Patch('admin/tickets/:id/assign')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Assign ticket to agent' })
  assign(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.supportService.assignTicket(id, user.id);
  }
}
