import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const adminKey = request.headers['x-admin-key'] as string | undefined;
    const expected =
      this.config.get<string>('ADMIN_API_KEY') || 'dcp_admin_dev_key_1234567890';

    if (!adminKey || adminKey !== expected) {
      throw new UnauthorizedException('Invalid or missing X-Admin-Key header');
    }

    return true;
  }
}