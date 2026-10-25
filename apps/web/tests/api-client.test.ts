import { expect, test } from "vite-plus/test";
import { createApiClient, matchesPath, sportsPath } from "../lib/api-client";

const sport = { id: "sport-tennis", slug: "tennis", name: "Tennis" };

const match = {
  id: "match-1",
  sportId: "sport-tennis",
  competitionId: "comp-1",
  date: "2026-10-18",
  round: "QF",
  status: "published",
  source: "manual",
  createdBy: "editor-1",
  reviewedBy: "editor-2",
  publishedAt: "2026-10-18T18:00:00+00:00",
};

function routes(bodies: Record<string, { status?: number; body: unknown }>) {
  const calls: { url: string; accept: string | null }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push({ url, accept: new Headers(init?.headers).get("accept") });
    const route = Object.entries(bodies).find(([path]) => url.endsWith(path));
    if (route === undefined) throw new Error(`unexpected ${url}`);
    return new Response(JSON.stringify(route[1].body), { status: route[1].status ?? 200 });
  };
  return { fetchImpl, calls };
}

test("parses sports and matches from the read paths", async () => {
  const { fetchImpl, calls } = routes({
    [sportsPath]: { body: [sport] },
    [matchesPath]: { body: [match] },
  });
  const api = createApiClient({ fetch: fetchImpl, baseUrl: "http://localhost:3001" });

  await expect(api.sports()).resolves.toEqual([sport]);
  await expect(api.matches()).resolves.toEqual([match]);
  expect(calls).toEqual([
    { url: "http://localhost:3001/api/sports", accept: "application/json" },
    { url: "http://localhost:3001/api/matches", accept: "application/json" },
  ]);
});

test("requests a same-origin path when no origin is set", async () => {
  const { fetchImpl, calls } = routes({ [sportsPath]: { body: [sport] } });
  const api = createApiClient({ fetch: fetchImpl });

  await expect(api.sports()).resolves.toEqual([sport]);
  expect(calls.map((call) => call.url)).toEqual([sportsPath]);
});

test("rejects a failed response before parsing the body", async () => {
  const fetchImpl: typeof fetch = async () => new Response("nope", { status: 503 });
  const api = createApiClient({ fetch: fetchImpl });

  await expect(api.sports()).rejects.toThrow("GET /api/sports returned HTTP 503");
});

test("rejects a match list that fails the schema", async () => {
  const { fetchImpl } = routes({ [matchesPath]: { body: [{ id: "bad" }] } });
  const api = createApiClient({ fetch: fetchImpl });

  await expect(api.matches()).rejects.toThrow(/sportId/);
});
