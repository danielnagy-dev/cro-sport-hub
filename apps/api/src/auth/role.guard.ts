import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Role } from "@cro-sport-hub/shared-types";
import { readBearer } from "./auth.js";

type RequestWithAuth = { headers: { authorization?: string } };

async function allow(
  authorization: string | undefined,
  allowed: readonly Role[],
  secret: string,
): Promise<void> {
  const user = await readBearer(authorization, secret);
  if (!user) throw new UnauthorizedException("Invalid token");
  if (!allowed.includes(user.role)) throw new ForbiddenException("Forbidden");
}

function authorizationHeader(context: ExecutionContext): string | undefined {
  return context.switchToHttp().getRequest<RequestWithAuth>().headers.authorization;
}

/** Editor routes. An admin may call them too. */
export class EditorGuard implements CanActivate {
  constructor(private readonly secret: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await allow(authorizationHeader(context), ["editor", "admin"], this.secret);
    return true;
  }
}

export class AdminGuard implements CanActivate {
  constructor(private readonly secret: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await allow(authorizationHeader(context), ["admin"], this.secret);
    return true;
  }
}
