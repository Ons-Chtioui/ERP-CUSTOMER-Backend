import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const userPermissions: string[] = user?.permissions ?? [];

    const hasAll = required.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      const missing = required.filter((p) => !userPermissions.includes(p));
      throw new ForbiddenException(
        `Permissions manquantes : [${missing.join(', ')}]`
      );
    }

    return true;
  }
}