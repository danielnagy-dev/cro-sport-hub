import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import HomePage, { metadata } from "../app/page";
import { matchesPath } from "../lib/api-client";

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
  ],
  retired: false,
};
const editorialMatch = {
  id: "match-sample-qf",
  sportId: "sport-tennis",
  competitionId: "comp-sample-cup",
  date: "2026-10-16",
  round: "QF",
  status: "draft",
  source: "manual",
  createdBy: "editor-demo",
};

function publishedPage(items: readonly unknown[]) {
  return { items, limit: 20, offset: 0, total: items.length };
}

async function renderHome(respond: () => Response | Promise<Response>): Promise<{
  html: string;
  urls: string[];
}> {
  const previous = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    urls.push(url);
    return respond();
  };
  try {
    return { html: renderToStaticMarkup(await HomePage()), urls };
  } finally {
    globalThis.fetch = previous;
  }
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

test("renders the seeded final and league match in fixture order", async () => {
  const { html, urls } = await renderHome(() => json(publishedPage([league, final])));

  expect(urls).toEqual([`http://localhost:3001${matchesPath}`]);
  expect(html).toContain("<h1>Cro Sport Hub</h1>");
  expect(html).toContain("Sample Player A");
  expect(html).toContain("Sample Player B");
  expect(html).toContain("Sample Home");
  expect(html).toContain("Sample Away");
  expect(html).toContain(">2</td>");
  expect(html).toContain(">1</td>");
  expect(html.indexOf("Sample Home")).toBeLessThan(html.indexOf("Sample Player A"));
  expect(html).toContain("@cro-sport-hub/shared-types");
  expect(html).toContain("@cro-sport-hub/ui");
  expect(html).not.toContain("Results are unavailable.");
  expect(html).not.toContain("No published results.");
});

test("an empty page says there are no published results", async () => {
  const { html } = await renderHome(() => json(publishedPage([])));

  expect(html).toContain("<h1>Cro Sport Hub</h1>");
  expect(html).toContain("No published results.");
  expect(html).not.toContain("Results are unavailable.");
  expect(html).not.toContain("Sample Home");
});

test("a rejected fetch still renders the heading", async () => {
  const { html } = await renderHome(() => {
    throw new Error("down");
  });

  expect(html).toContain("<h1>Cro Sport Hub</h1>");
  expect(html).toContain("Results are unavailable.");
  expect(html).not.toContain("No published results.");
});

test("a draft-shaped Match is not drawn as a card", async () => {
  const { html } = await renderHome(() => json([editorialMatch]));

  expect(html).toContain("<h1>Cro Sport Hub</h1>");
  expect(html).toContain("Results are unavailable.");
  expect(html).not.toContain("match-sample-qf");
  expect(html).not.toContain("Sample Player");
});

test("the document title names results and there is no share image", () => {
  expect(metadata.title).toBe("Tennis and football results · Cro Sport Hub");
  expect(metadata.description).toBe("Latest tennis and football results.");
  expect(metadata.openGraph).toBeUndefined();
  expect(JSON.stringify(metadata)).not.toContain("og:image");
});
