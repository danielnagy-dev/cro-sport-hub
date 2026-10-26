import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { roleSchema, type Role } from "@cro-sport-hub/shared-types";
import { readBearer, readJwtSecret } from "./auth.js";

type RequestWithAuth = {
  headers: { authorization?: string };
  user?: { id: string; role: Role };
};

/** Optional override for tests. Absent in the app, which reads `JWT_SECRET` per request. */
export const JWT_SECRET = Symbol("JWT_SECRET");

async function allow(
  authorization: string | undefined,
  allowed: readonly Role[],
  secret: string,
): Promise<{ id: string; role: Role }> {
  const user = await readBearer(authorization, secret);
  if (!user) throw new UnauthorizedException("Invalid token");
  const role = roleSchema.safeParse(user.role);
  if (!role.success || !allowed.includes(role.data)) throw new ForbiddenException("Forbidden");
  return { id: user.id, role: role.data };
}

async function authenticate(
  context: ExecutionContext,
  allowed: readonly Role[],
  secret: string,
): Promise<boolean> {
  const request = context.switchToHttp().getRequest<RequestWithAuth>();
  request.user = await allow(request.headers.authorization, allowed, secret);
  return true;
}

/** Editor routes. An admin may call them too. */
export class EditorGuard implements CanActivate {
  constructor(private readonly secret: string) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return authenticate(context, ["editor", "admin"], this.secret);
  }
}

export class AdminGuard implements CanActivate {
  constructor(private readonly secret: string) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return authenticate(context, ["admin"], this.secret);
  }
}

/** Attaches `EditorGuard` using `JWT_SECRET` when the route is called. */
@Injectable()
export class EditorAuthGuard implements CanActivate {
  constructor(@Optional() @Inject(JWT_SECRET) private readonly secret?: string) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return new EditorGuard(this.secret ?? readJwtSecret(process.env)).canActivate(context);
  }
}

/** Attaches `AdminGuard` using `JWT_SECRET` when the route is called. */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Optional() @Inject(JWT_SECRET) private readonly secret?: string) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return new AdminGuard(this.secret ?? readJwtSecret(process.env)).canActivate(context);
  }
}
