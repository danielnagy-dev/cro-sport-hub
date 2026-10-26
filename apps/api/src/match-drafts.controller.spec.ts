import { type AddressInfo } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { EditorAuthGuard, JWT_SECRET } from "./auth/role.guard.js";
import { openCatalog } from "./catalog/catalog.js";
import { seedCatalog } from "./catalog/seed.js";
import * as schema from "./catalog/schema.js";
import { MatchDraftsController } from "./match-drafts.controller.js";
import { CATALOG_OPENER, MatchesController, type CatalogOpener } from "./matches.controller.js";
import { setupOpenApi } from "./openapi.js";

const secret = "test-jwt-secret-that-is-at-least-32";

function tennisBody(id: string) {
  return {
    id,
    competitionId: "comp-sample-cup",
    date: "2026-10-20",
    round: "Semi-final",
    playerAId: "sample-player-a",
    playerBId: "sample-player-b",
    winnerId: "sample-player-a",
    bestOf: 3,
    score: [
      [6, 4],
      [6, 3],
    ],
    retired: false,
  };
}

function footballBody(id: string) {
  return {
    id,
    competitionId: "comp-sample-league",
    date: "2026-10-20",
    round: "Matchday 11",
    homeTeamId: "club-sample-home",
    awayTeamId: "club-sample-away",
    homeGoals: 1,
    awayGoals: 0,
  };
}

describe("match draft routes", () => {
  let close: (() => Promise<void>) | undefined;
  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  async function bearer(role: string, sub = "editor-demo"): Promise<string> {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    return `Bearer ${token}`;
  }

  async function start(): Promise<number> {
    const client = new PGlite();
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }));
    const seeded = await open();
    await seedCatalog(seeded);
    await seeded.close();
    const moduleRef = await Test.createTestingModule({
      controllers: [MatchDraftsController, MatchesController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: JWT_SECRET, useValue: secret },
        EditorAuthGuard,
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    setupOpenApi(app);
    await app.listen(0, "127.0.0.1");
    close = async () => {
      await app.close();
      await client.close();
    };
    const address = app.getHttpServer().address() as AddressInfo | null;
    if (!address) throw new Error("Expected the test server to be listening");
    return address.port;
  }

  async function send(port: number, method: string, path: string, body?: unknown, token?: string) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token === undefined ? {} : { authorization: token }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text === "" ? undefined : JSON.parse(text) };
  }

  it("requires an editor, documents bearer security, and saves a draft", async () => {
    const port = await start();
    const id = "match-draft-rally";
    expect(await send(port, "POST", "/api/matches/tennis", tennisBody(id))).toMatchObject({
      status: 401,
      body: { message: "Invalid token" },
    });
    expect(
      await send(port, "POST", "/api/matches/tennis", tennisBody(id), await bearer("viewer")),
    ).toMatchObject({ status: 403, body: { message: "Forbidden" } });
    expect((await send(port, "GET", "/api/matches")).status).toBe(200);
    expect(await send(port, "PUT", "/api/matches/football/match-sample-league")).toMatchObject({
      status: 401,
      body: { message: "Invalid token" },
    });
    expect(
      await send(port, "POST", "/api/matches/tennis", tennisBody(id), await bearer("editor")),
    ).toMatchObject({ status: 201, body: { id, status: "draft", sport: "tennis" } });
    expect(
      await send(
        port,
        "POST",
        "/api/matches/football",
        footballBody("match-draft-kick"),
        await bearer("admin", "admin-demo"),
      ),
    ).toMatchObject({
      status: 201,
      body: { id: "match-draft-kick", status: "draft", sport: "football" },
    });

    const docs = await send(port, "GET", "/docs-json");
    const paths = docs.body.paths;
    expect(paths["/api/matches"].get.security).toBeUndefined();
    expect(paths["/api/matches/{sport}"].get.security).toBeUndefined();
    expect(paths["/api/matches/tennis"].post.security).toEqual([{ bearer: [] }]);
    expect(paths["/api/matches/football"].post.security).toEqual([{ bearer: [] }]);
    expect(paths["/api/matches/tennis/{id}"].put.security).toEqual([{ bearer: [] }]);
    expect(paths["/api/matches/football/{id}"].put.security).toEqual([{ bearer: [] }]);
  }, 20_000);
});
