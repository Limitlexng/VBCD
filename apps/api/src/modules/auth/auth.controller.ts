import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public, CurrentUser } from '../../common/decorators';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { IUser } from '@berry-x/types';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.identifier, dto.otp, dto.type);
  }

  @Post('resend-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP' })
  resendOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.sendOtp(dto.identifier, dto.type);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('change-password')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Change password' })
  changePassword(@CurrentUser() user: IUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('set-pin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Set transaction PIN' })
  setPin(@CurrentUser() user: IUser, @Body() dto: SetPinDto) {
    return this.authService.setTransactionPin(user.id, dto.pin);
  }

  @Post('2fa/enable')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Enable 2FA — returns secret and QR code' })
  enable2FA(@CurrentUser() user: IUser) {
    return this.authService.enable2FA(user.id);
  }

  @Post('2fa/verify')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and activate 2FA' })
  verify2FA(@CurrentUser() user: IUser, @Body() dto: Enable2FADto) {
    return this.authService.verify2FA(user.id, dto.token);
  }

  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user' })
  me(@CurrentUser() user: IUser) {
    return { data: user };
  }
}
