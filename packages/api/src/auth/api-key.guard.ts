import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    // In MVP: we accept any non-empty key here; real validation is done inside services using Prisma lookup.
    // This guard simply enforces that the header is present.
    if (!apiKey) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }
    return true;
  }
}
