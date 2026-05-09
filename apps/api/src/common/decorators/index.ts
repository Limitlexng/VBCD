import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { IUser } from '@berry-x/types';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { user: IUser }>();
  return request.user;
});

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const Public = () => SetMetadata('isPublic', true);

export const SkipThrottle = () => SetMetadata('skipThrottle', true);

export const RequirePin = () => SetMetadata('requirePin', true);

export const RequireKyc = (tier: number) => SetMetadata('requiredKycTier', tier);

export const ApiVersion = (version: string) => SetMetadata('version', version);
