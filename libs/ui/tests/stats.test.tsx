import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { AppearancesTable } from "../src/appearances-table.tsx";
import { appearanceRows, playedCounts, zeroDenominatorCounts } from "../src/result-samples.ts";
import { TennisStats } from "../src/tennis-stats.tsx";

function markup(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(element);
}

function row(html: string, label: string): string {
  const found = html
    .split("<tr>")
    .slice(1)
    .find((part) => part.includes(`>${label}`));
  if (found === undefined) throw new Error(`Missing row ${label}`);
  return found;
}

test("tennis stats show serve and return percentages from the counts", () => {
  const html = markup(createElement(TennisStats, { player: "Sample Player", stats: playedCounts }));

  expect(html).toContain("<caption>Sample Player serve and return</caption>");
  expect(html).toContain('scope="col"');
  expect(row(html, "First serve")).toContain(">60%</td>");
  expect(row(html, "First-serve points won")).toContain(">66.7%</td>");
  expect(row(html, "Second-serve points won")).toContain(">50%</td>");
  expect(row(html, "Break points saved")).toContain(">50%</td>");
  expect(row(html, "Break points converted")).toContain(">50%</td>");
  expect(row(html, "First serve")).toContain('scope="row"');
});

test("a zero tennis denominator reads as no attempts, and a zero rate stays 0%", () => {
  const html = markup(
    createElement(TennisStats, { player: "Sample Player", stats: zeroDenominatorCounts }),
  );

  expect(row(html, "First serve")).toContain(">0%</td>");
  expect(row(html, "First-serve points won")).toContain(">No attempts</td>");
  expect(row(html, "Second-serve points won")).toContain(">0%</td>");
  expect(row(html, "Break points saved")).toContain(">No attempts</td>");
  expect(row(html, "Break points converted")).toContain(">No attempts</td>");
  expect(row(html, "First serve")).not.toContain("No attempts");
});

test("appearances list each match, competition, and the counting stats", () => {
  const html = markup(
    createElement(AppearancesTable, { athleteName: "Sample Player", rows: appearanceRows }),
  );

  expect(html).toContain("<caption>Sample Player appearances</caption>");
  expect(html).toContain('scope="col"');
  const opener = row(html, "2026-05-01");
  expect(opener).toContain("Sample Cup");
  expect(opener).toContain("2026");
  expect(opener).toContain("QF");
  expect(opener).toContain(">Yes</td>");
  expect(opener).toContain(">90</td>");
  expect(opener).toContain(">1</td>");
  expect(opener).toContain(">Yellow</td>");
  expect(opener).toContain('scope="row"');
  const final = row(html, "2026-05-20");
  expect(final).toContain(">Second yellow</td>");
  expect(final).toContain(">12</td>");
  expect(final).toContain(">No</td>");
  expect(final).toContain(">1</td>");
  expect(row(html, "2026-05-10")).toContain(">Red</td>");
  expect(row(html, "2026-04-28")).toContain(">Yellow, red</td>");
  expect(row(html, "2026-04-20")).toContain(">None</td>");
  expect(row(html, "2026-04-20")).toContain(">0</td>");
});

test("an athlete with no appearances says so", () => {
  const html = markup(createElement(AppearancesTable, { athleteName: "Sample Player", rows: [] }));

  expect(html).toContain("Sample Player appearances");
  expect(html).toContain("No appearances");
  expect(html).not.toContain("<td>");
});
