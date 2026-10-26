import { randomBytes } from "node:crypto";
import { roleSchema, type Role } from "@cro-sport-hub/shared-types";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { Pool } from "pg";
import { z } from "zod";

const rounds = 10;
const claims = z.object({ sub: z.string().min(1), role: roleSchema });
const credentialRow = z.object({
  id: z.string().min(1),
  role: roleSchema,
  password_hash: z.string().nullable(),
});

export class InvalidCredentials extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentials";
  }
}

export type StoredCredential = { id: string; role: Role; passwordHash: string | null };
export type CredentialStore = { find(id: string): Promise<StoredCredential | undefined> };
export type Sql = {
  query(
    text: string,
    values: readonly unknown[],
  ): Promise<{ rows: readonly unknown[]; rowCount: number | null }>;
};

let dummy: Promise<string> | undefined;
const dummyHash = (): Promise<string> => (dummy ??= hash(randomBytes(32).toString("hex"), rounds));

export function hashPassword(password: string): Promise<string> {
  return hash(password, rounds);
}

export function readJwtSecret(env: NodeJS.ProcessEnv): string {
  const secret = env.JWT_SECRET?.trim() ?? "";
  if (secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  return secret;
}

export function readDemoPasswords(env: NodeJS.ProcessEnv): { editor: string; admin: string } {
  const editor = env.EDITOR_DEMO_PASSWORD ?? "";
  const admin = env.ADMIN_DEMO_PASSWORD ?? "";
  if (!acceptable(editor) || !acceptable(admin)) {
    throw new Error("EDITOR_DEMO_PASSWORD and ADMIN_DEMO_PASSWORD must be 8 to 72 characters");
  }
  return { editor, admin };
}

function acceptable(value: string): boolean {
  return value.length >= 8 && value.length <= 72 && Buffer.byteLength(value) <= 72;
}

function signingKey(secret: string): Uint8Array {
  return new TextEncoder().encode(readJwtSecret({ JWT_SECRET: secret }));
}

export async function readBearer(
  authorization: string | undefined,
  secret: string,
): Promise<{ id: string; role: Role } | undefined> {
  const key = signingKey(secret);
  if (authorization === undefined || !authorization.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length);
  if (token.length === 0) return undefined;
  try {
    const { payload } = await jwtVerify(token, key);
    const parsed = claims.safeParse({ sub: payload.sub, role: payload.role });
    return parsed.success ? { id: parsed.data.sub, role: parsed.data.role } : undefined;
  } catch {
    return undefined;
  }
}

export async function login(
  store: CredentialStore,
  secret: string,
  input: { id: string; password: string },
): Promise<{ token: string }> {
  const key = signingKey(secret);
  const credential = await store.find(input.id);
  const passwordHash = credential?.passwordHash ?? (await dummyHash());
  const matches = await compare(input.password, passwordHash).catch(() => false);
  if (credential === undefined || credential.passwordHash === null || !matches) {
    throw new InvalidCredentials();
  }
  const token = await new SignJWT({ role: credential.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(credential.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key);
  return { token };
}

export async function findCredential(sql: Sql, id: string): Promise<StoredCredential | undefined> {
  const result = await sql.query("SELECT id, role, password_hash FROM users WHERE id = $1", [id]);
  const parsed = credentialRow.safeParse(result.rows[0]);
  if (!parsed.success) return undefined;
  return { id: parsed.data.id, role: parsed.data.role, passwordHash: parsed.data.password_hash };
}

export async function savePasswordHash(sql: Sql, id: string, passwordHash: string): Promise<void> {
  const result = await sql.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    id,
  ]);
  if (result.rowCount !== 1) throw new Error(`The seed user ${id} is missing`);
}

function openPool(databaseUrl: string): Pool {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 500,
    query_timeout: 500,
    max: 1,
  });
  pool.on("error", () => undefined);
  return pool;
}

function pgSql(pool: Pool): Sql {
  return {
    async query(text, values) {
      const result = await pool.query<Record<string, unknown>>(text, [...values]);
      return { rows: result.rows, rowCount: result.rowCount };
    },
  };
}

export async function openCredentialStore(
  databaseUrl: string,
): Promise<CredentialStore & { close(): Promise<void> }> {
  const pool = openPool(databaseUrl);
  const sql = pgSql(pool);
  return { find: (id) => findCredential(sql, id), close: () => pool.end() };
}

export async function assignDemoPasswords(
  databaseUrl: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const passwords = readDemoPasswords(env);
  const pool = openPool(databaseUrl);
  try {
    const sql = pgSql(pool);
    await savePasswordHash(sql, "editor-demo", await hashPassword(passwords.editor));
    await savePasswordHash(sql, "admin-demo", await hashPassword(passwords.admin));
  } finally {
    await pool.end();
  }
}
