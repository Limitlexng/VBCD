import { IsString, IsNotEmpty, IsEnum, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '@berry-x/types';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ enum: OtpType })
  @IsEnum(OtpType)
  type: OtpType;
}
