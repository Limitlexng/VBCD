import { Controller, Get, Patch, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { IUser } from '@berry-x/types';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: IUser) {
    return this.usersService.getUserStats(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@CurrentUser() user: IUser, @Body() body: { firstName?: string; lastName?: string; username?: string }) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Patch('avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  uploadAvatar(@CurrentUser() user: IUser, @UploadedFile() file: Express.Multer.File) {
    const avatarUrl = `/uploads/${file.filename}`;
    return this.usersService.uploadAvatar(user.id, avatarUrl);
  }
}
