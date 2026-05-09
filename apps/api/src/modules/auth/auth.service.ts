import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  IAuthTokens,
  ILoginDto,
  IRegisterDto,
  OtpType,
  NotificationType,
  NotificationChannel,
  UserStatus,
  UserTier,
  UserRole,
} from '@berry-x/types';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { otp: string; expiresAt: Date; type: OtpType }>();

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: IRegisterDto): Promise<{ message: string; userId: string }> {
    const existingEmail = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingPhone = await this.usersRepo.findOne({ where: { phone: dto.phone } });
    if (existingPhone) throw new ConflictException('Phone already registered');

    const user = this.usersRepo.create({
      ...dto,
      status: UserStatus.PENDING_VERIFICATION,
      tier: UserTier.TIER_0,
      role: UserRole.USER,
    });

    if (dto.referralCode) {
      const referrer = await this.usersRepo.findOne({ where: { referralCode: dto.referralCode } });
      if (referrer) user.referredBy = referrer.id;
    }

    const saved = await this.usersRepo.save(user);

    await this.sendOtp(dto.email, OtpType.EMAIL_VERIFICATION);

    return { message: 'Registration successful. Check your email for verification OTP.', userId: saved.id };
  }

  async login(dto: ILoginDto): Promise<IAuthTokens & { user: Partial<UserEntity> }> {
    const user = await this.usersRepo.findOne({
      where: [{ email: dto.identifier }, { phone: dto.identifier }],
      select: ['id', 'email', 'phone', 'firstName', 'lastName', 'password', 'status', 'tier', 'role', 'isTwoFactorEnabled', 'isEmailVerified'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await user.comparePassword(dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.SUSPENDED) throw new UnauthorizedException('Account suspended');
    if (user.status === UserStatus.BANNED) throw new UnauthorizedException('Account banned');

    if (user.isTwoFactorEnabled) {
      await this.sendOtp(user.email, OtpType.TWO_FACTOR);
      return { accessToken: '', refreshToken: '', expiresIn: 0, requiresTwoFactor: true, userId: user.id } as never;
    }

    await this.usersRepo.update(user.id, { lastLoginAt: new Date(), deviceId: dto.deviceId });

    const tokens = await this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword };
  }

  async verifyOtp(identifier: string, otp: string, type: OtpType): Promise<{ verified: boolean; tokens?: IAuthTokens }> {
    const key = `${type}:${identifier}`;
    const stored = this.otpStore.get(key);

    if (!stored) throw new BadRequestException('OTP not found or expired');
    if (stored.expiresAt < new Date()) {
      this.otpStore.delete(key);
      throw new BadRequestException('OTP expired');
    }
    if (stored.otp !== otp) throw new BadRequestException('Invalid OTP');

    this.otpStore.delete(key);

    if (type === OtpType.EMAIL_VERIFICATION) {
      const user = await this.usersRepo.findOne({ where: { email: identifier } });
      if (user) {
        await this.usersRepo.update(user.id, {
          isEmailVerified: true,
          status: UserStatus.ACTIVE,
        });
      }
    }

    if (type === OtpType.TWO_FACTOR || type === OtpType.LOGIN) {
      const user = await this.usersRepo.findOne({ where: { email: identifier } });
      if (!user) throw new NotFoundException('User not found');
      const tokens = await this.generateTokens(user);
      return { verified: true, tokens };
    }

    return { verified: true };
  }

  async refreshTokens(refreshToken: string): Promise<IAuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('app.jwtRefreshSecret'),
      });
      const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async sendOtp(identifier: string, type: OtpType): Promise<void> {
    const length = this.config.get<number>('app.otpLength', 6);
    const otp = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    const expiryMinutes = this.config.get<number>('app.otpExpiry', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    this.otpStore.set(`${type}:${identifier}`, { otp, expiresAt, type });

    await this.notifications.send({
      userId: '',
      type: NotificationType.LOGIN_ALERT,
      channel: identifier.includes('@') ? NotificationChannel.EMAIL : NotificationChannel.SMS,
      title: 'Berry X Verification Code',
      body: `Your verification code is: ${otp}. Valid for ${expiryMinutes} minutes.`,
      data: { otp, type, expiresAt },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId }, select: ['id', 'password'] });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new BadRequestException('Current password incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersRepo.update(userId, { password: hashed });
  }

  async setTransactionPin(userId: string, pin: string): Promise<void> {
    const hashed = await bcrypt.hash(pin, 12);
    await this.usersRepo.update(userId, { transactionPin: hashed });
  }

  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({ name: `BerryX:${userId}`, length: 32 });
    await this.usersRepo.update(userId, { twoFactorSecret: secret.base32 });
    const qrCode = secret.otpauth_url || '';
    return { secret: secret.base32, qrCode };
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({ where: { id: userId }, select: ['id', 'twoFactorSecret'] });
    if (!user?.twoFactorSecret) return false;

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified) {
      await this.usersRepo.update(userId, { isTwoFactorEnabled: true });
    }
    return verified;
  }

  private async generateTokens(user: UserEntity): Promise<IAuthTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role, tier: user.tier };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('app.jwtSecret'),
        expiresIn: this.config.get('app.jwtExpiresIn', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('app.jwtRefreshSecret'),
        expiresIn: this.config.get('app.jwtRefreshExpiresIn', '7d'),
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
