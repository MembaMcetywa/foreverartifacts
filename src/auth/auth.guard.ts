import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ACCESS_TOKEN_COOKIE, readCookie } from './auth.cookies';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';
import { IS_PUBLIC_ROUTE } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);

    if (!accessToken) {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.user = await this.authService.getCurrentUser(accessToken);

    return true;
  }
}
