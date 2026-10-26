import { readApiConfig } from "../api-config.js";
import { assignDemoPasswords } from "../auth/auth.js";
import { loadRootEnv } from "../load-root-env.js";
import { CatalogError, openPostgresCatalog } from "./catalog.js";
import { seedCatalog } from "./seed.js";

loadRootEnv();

function publicMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : undefined;
  if (message === undefined || message.includes("://") || message.includes("@")) {
    return "The catalog seed failed";
  }
  return message;
}

try {
  const catalog = await openPostgresCatalog(readApiConfig().databaseUrl);
  try {
    await seedCatalog(catalog);
    await assignDemoPasswords(readApiConfig().databaseUrl);
  } finally {
    await catalog.close();
  }
} catch (error) {
  console.error(error instanceof CatalogError ? error.message : publicMessage(error));
  process.exitCode = 1;
}
