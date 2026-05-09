export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ILoginDto {
  identifier: string;
  password: string;
  deviceId?: string;
}

export interface IRegisterDto {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  referralCode?: string;
  deviceId?: string;
}

export interface IVerifyOtpDto {
  identifier: string;
  otp: string;
  type: OtpType;
}

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  TRANSACTION_AUTH = 'transaction_auth',
  TWO_FACTOR = 'two_factor',
  LOGIN = 'login',
}

export interface IRefreshTokenDto {
  refreshToken: string;
}

export interface IResetPasswordDto {
  token: string;
  password: string;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  role: string;
  tier: number;
  iat?: number;
  exp?: number;
}
