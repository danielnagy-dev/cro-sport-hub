/**
 * Host, user, and database for local Postgres. The Compose password is not here.
 * Set DATABASE_URL in the repository-root `.env` to connect.
 */
export const localDevDefaults = {
  port: 3001,
  databaseUrl: "postgresql://cro_sport@127.0.0.1:5432/cro_sport",
  redisUrl: "redis://127.0.0.1:6379",
} as const;

export type ApiConfig = {
  port: number;
  databaseUrl: string;
  redisUrl: string;
};

const databaseProtocols = new Set(["postgresql:", "postgres:"]);

export function readApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    port: readPort(env.PORT),
    databaseUrl: readUrl(
      env.DATABASE_URL,
      localDevDefaults.databaseUrl,
      "DATABASE_URL",
      databaseProtocols,
    ),
    redisUrl: readUrl(env.REDIS_URL, localDevDefaults.redisUrl, "REDIS_URL", new Set(["redis:"])),
  };
}

function readPort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return localDevDefaults.port;
  }

  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  const port = Number(trimmed);
  if (port > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  return port;
}

function readUrl(
  value: string | undefined,
  fallback: string,
  name: string,
  protocols: ReadonlySet<string>,
): string {
  const candidate = value === undefined ? fallback : value.trim();
  if (candidate === "") {
    throw new Error(`${name} must be a non-empty URL`);
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (!protocols.has(parsed.protocol)) {
    throw new Error(`${name} must use ${[...protocols].join(" or ")}`);
  }

  return candidate;
}
