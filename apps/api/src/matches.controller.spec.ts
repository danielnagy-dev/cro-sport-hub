import { type AddressInfo } from "node:net";
import { publishedMatchPageSchema } from "@cro-sport-hub/shared-types";
import { PGlite } from "@electric-sql/pglite";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { openCatalog } from "./catalog/catalog.js";
import { seedCatalog } from "./catalog/seed.js";
import * as schema from "./catalog/schema.js";
import { CATALOG_OPENER, MatchesController, type CatalogOpener } from "./matches.controller.js";
import { setupOpenApi } from "./openapi.js";

const league = {
  id: "match-sample-league",
  sport: "football" as const,
  competition: "Sample League",
  date: "2026-10-19",
  round: "Matchday 8",
  homeTeam: "Sample Home",
  awayTeam: "Sample Away",
  homeGoals: 2,
  awayGoals: 1,
};
const final = {
  id: "match-sample-final",
  sport: "tennis" as const,
  competition: "Sample Cup",
  date: "2026-10-18",
  round: "Final",
  playerA: "Sample Player A",
  playerB: "Sample Player B",
  winner: "a" as const,
  bestOf: 3 as const,
  score: [
    [6, 4],
    [7, 6, 5],
  ] as const,
  retired: false,
};

describe("published matches", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  async function start(): Promise<number> {
    const client = new PGlite();
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }));
    const catalog = await open();
    await seedCatalog(catalog);
    await catalog.write("match", {
      id: "match-sample-hidden",
      sportId: "sport-football",
      competitionId: "comp-sample-league",
      date: "2026-10-22",
      round: "Matchday 9",
      status: "draft",
      source: "manual",
      createdBy: "editor-demo",
    });
    await catalog.write("footballMatch", {
      matchId: "match-sample-hidden",
      homeTeamId: "club-sample-home",
      awayTeamId: "club-sample-town",
      homeGoals: 0,
      awayGoals: 0,
    });
    await catalog.close();

    const moduleRef = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [{ provide: CATALOG_OPENER, useValue: open }],
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

  async function page(port: number, path: string) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    expect(response.status).toBe(200);
    return publishedMatchPageSchema.parse(await response.json());
  }

  function listed(
    items: readonly (typeof league | typeof final)[],
    total: number,
    limit = 20,
    offset = 0,
  ) {
    return { items, limit, offset, total };
  }

  it("lists published matches newest first and leaves unpublished rows out", async () => {
    const port = await start();
    const body = await page(port, "/api/matches");
    expect(body).toEqual(listed([league, final], 2));
    const text = JSON.stringify(body);
    expect(text).not.toContain("createdBy");
    expect(text).not.toContain("club-sample");
    expect(text).not.toContain("match-sample-qf");

    const docs = await fetch(`http://127.0.0.1:${port}/docs-json`);
    expect(docs.status).toBe(200);
    const document = JSON.stringify(await docs.json());
    expect(document).toContain('"/api/matches"');
    expect(document).toContain("homeTeam");
    expect(document).toContain("playerA");
    expect(document).not.toContain("/api/teams");
  }, 20_000);

  it("pages with limit and offset", async () => {
    const port = await start();
    await expect(page(port, "/api/matches?limit=1&offset=0")).resolves.toEqual(
      listed([league], 2, 1),
    );
    await expect(page(port, "/api/matches?limit=1&offset=1")).resolves.toEqual(
      listed([final], 2, 1, 1),
    );
    await expect(page(port, "/api/matches?limit=1&offset=2")).resolves.toEqual(listed([], 2, 1, 2));
    const bad = await fetch(`http://127.0.0.1:${port}/api/matches?limit=0`);
    expect(bad.status).toBe(400);
    await expect(bad.json()).resolves.toMatchObject({
      message: "limit is 1 to 50 and offset is 0 or greater",
    });
  }, 20_000);
});
