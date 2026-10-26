import { type AddressInfo } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { Test } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { AdminAuthGuard, EditorAuthGuard, JWT_SECRET } from "./auth/role.guard.js";
import { openCatalog, type Catalog } from "./catalog/catalog.js";
import { type CatalogDb } from "./catalog/errors.js";
import { seedCatalog } from "./catalog/seed.js";
import * as schema from "./catalog/schema.js";
import { MatchDraftsController } from "./match-drafts.controller.js";
import { MatchWorkflowController } from "./match-workflow.controller.js";
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

describe("match draft and review routes", () => {
  let close: (() => Promise<void>) | undefined;
  let catalogDb: CatalogDb | undefined;
  afterEach(async () => {
    await close?.();
    close = undefined;
    catalogDb = undefined;
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

  function rows(): CatalogDb {
    if (catalogDb === undefined) throw new Error("Expected the test database");
    return catalogDb;
  }

  async function stored(id: string): Promise<Awaited<ReturnType<Catalog["read"]>>> {
    const catalog = await openCatalog(rows());
    try {
      return await catalog.read("match", id);
    } finally {
      await catalog.close();
    }
  }

  async function start(): Promise<number> {
    const client = new PGlite();
    const database = drizzle(client, { schema });
    catalogDb = database;
    const open: CatalogOpener = () => openCatalog(database);
    const seeded = await open();
    await seedCatalog(seeded);
    await seeded.close();
    const moduleRef = await Test.createTestingModule({
      controllers: [MatchDraftsController, MatchWorkflowController, MatchesController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: JWT_SECRET, useValue: secret },
        EditorAuthGuard,
        AdminAuthGuard,
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

  it("submits a draft and rejects a review", async () => {
    const port = await start();
    const quarterfinal = "match-sample-qf";
    const published = "match-sample-final";
    const submit = `/api/matches/${quarterfinal}/submit`;
    const reject = `/api/matches/${quarterfinal}/reject`;
    const editor = await bearer("editor");
    const admin = await bearer("admin", "admin-demo");

    expect(await send(port, "POST", submit)).toMatchObject({
      status: 401,
      body: { message: "Invalid token" },
    });
    expect(await send(port, "POST", reject)).toMatchObject({
      status: 401,
      body: { message: "Invalid token" },
    });
    expect(await send(port, "POST", reject, undefined, editor)).toMatchObject({
      status: 403,
      body: { message: "Forbidden" },
    });
    expect(await send(port, "POST", submit, undefined, await bearer("viewer"))).toMatchObject({
      status: 403,
      body: { message: "Forbidden" },
    });
    expect(await send(port, "POST", reject, undefined, admin)).toMatchObject({
      status: 409,
      body: { message: "Only a match in review can be rejected" },
    });
    expect(
      await send(port, "POST", `/api/matches/${published}/reject`, undefined, admin),
    ).toMatchObject({
      status: 409,
      body: { message: "Only a match in review can be rejected" },
    });
    expect(
      await send(port, "POST", `/api/matches/${published}/submit`, undefined, editor),
    ).toMatchObject({
      status: 409,
      body: { message: "Only a draft can be submitted" },
    });
    expect(await stored(published)).toMatchObject({
      status: "published",
      reviewedBy: "admin-demo",
    });

    expect(await send(port, "POST", submit, undefined, editor)).toMatchObject({
      status: 200,
      body: { id: quarterfinal, status: "review" },
    });
    const reviewing = await stored(quarterfinal);
    expect(reviewing).toMatchObject({ id: quarterfinal, status: "review" });
    expect(reviewing).not.toHaveProperty("reviewedBy");
    expect(reviewing).not.toHaveProperty("publishedAt");
    expect(JSON.stringify((await send(port, "GET", "/api/matches")).body)).not.toContain(
      quarterfinal,
    );
    expect(await send(port, "POST", submit, undefined, editor)).toMatchObject({
      status: 409,
      body: { message: "Only a draft can be submitted" },
    });

    // Publish (12b) is what records a reviewer. Set one so reject has to clear it.
    await rows()
      .update(schema.matches)
      .set({ reviewedBy: "admin-demo" })
      .where(eq(schema.matches.id, quarterfinal));

    expect(await send(port, "POST", reject, undefined, admin)).toMatchObject({
      status: 200,
      body: { id: quarterfinal, status: "draft" },
    });
    const reopened = await stored(quarterfinal);
    expect(reopened).toMatchObject({ id: quarterfinal, status: "draft" });
    expect(reopened).not.toHaveProperty("reviewedBy");
    expect(reopened).not.toHaveProperty("publishedAt");

    expect(await send(port, "POST", submit, undefined, admin)).toMatchObject({
      status: 200,
      body: { id: quarterfinal, status: "review" },
    });
    const adminReview = await stored(quarterfinal);
    expect(adminReview).toMatchObject({ status: "review" });
    expect(adminReview).not.toHaveProperty("reviewedBy");
    expect(adminReview).not.toHaveProperty("publishedAt");

    expect(
      await send(port, "POST", "/api/matches/match-missing/submit", undefined, editor),
    ).toMatchObject({ status: 404, body: { message: "Unknown match" } });
    expect(
      await send(port, "POST", "/api/matches/match-missing/reject", undefined, admin),
    ).toMatchObject({ status: 404, body: { message: "Unknown match" } });

    const docs = await send(port, "GET", "/docs-json");
    const paths = docs.body.paths;
    expect(paths["/api/matches"].get.security).toBeUndefined();
    expect(paths["/api/matches/{id}/submit"].post.security).toEqual([{ bearer: [] }]);
    expect(paths["/api/matches/{id}/reject"].post.security).toEqual([{ bearer: [] }]);
  }, 20_000);
});
