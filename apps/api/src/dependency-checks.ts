import { Client } from "pg";
import { createClient } from "redis";
import { type DependencyStatus } from "./health-response.js";

const probeTimeoutMs = 500;

export async function checkPostgres(databaseUrl: string): Promise<DependencyStatus> {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: probeTimeoutMs,
  });

  try {
    await client.connect();
    await client.query("SELECT 1");
    return "up";
  } catch {
    return "down";
  } finally {
    await client.end().catch(() => {
      // A refused connection never opened a socket worth closing.
    });
  }
}

export async function checkRedis(redisUrl: string): Promise<DependencyStatus> {
  const client = createClient({
    url: redisUrl,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: probeTimeoutMs,
      reconnectStrategy: false,
    },
  });
  client.on("error", () => {
    // The probe reports "down" instead of crashing on a socket error.
  });

  try {
    await client.connect();
    const reply = await client.ping();
    return reply === "PONG" ? "up" : "down";
  } catch {
    return "down";
  } finally {
    if (client.isOpen) {
      await client.quit().catch(() => {
        // Closing a broken socket should not change the probe result.
      });
    }
  }
}
