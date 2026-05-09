import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUser } from '@berry-x/types';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user: IUser }>();
    const { user } = request;

    if (!user) throw new ForbiddenException('Access denied');
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(' or ')}`);
    }
    return true;
  }
}
