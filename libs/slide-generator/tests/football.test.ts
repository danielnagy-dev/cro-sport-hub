import { expect, test } from "vite-plus/test";
import { footballTemplate, type FootballPerson, type FootballSlide } from "../src/index.ts";

// Colour literals are copied from design/football-r13/tokens.json.

const karlo: FootballPerson = {
  name: "Karlo Brkić",
  club: "GNK Dinamo",
  number: 9,
  position: "napadač",
  lineup: "start",
  fixture: { home: "Slaven Belupo", away: "Dinamo", homeScore: 1, awayScore: 5, side: "away" },
  stats: [
    { key: "goals", label: "Golovi", value: "2" },
    { key: "assists", label: "Asistencije", value: "1" },
    { key: "minutes", label: "Minute", value: "90’" },
    { key: "shots", label: "Udarci", value: "5", onTarget: "3" },
    { key: "key_passes", label: "Ključna dodavanja", value: "2" },
    { key: "passes", label: "Dodavanja", accurate: 25, total: 32 },
    { key: "yellow", label: "Žuti karton", value: "1" },
  ],
};

const player: FootballSlide = {
  kind: "player",
  competition: "SuperSport HNL",
  round: "10. kolo",
  date: "18. 10.",
  player: karlo,
};

test("the example player slide uses the round-13 hero rule", () => {
  const doc = footballTemplate(player);
  expect(doc).toMatchObject({
    width: 1080,
    height: 1350,
    designRound: "13-interim",
    colourway: "navy",
    kind: "player",
  });
  expect(doc.heroes.map((hero) => hero.key)).toEqual(["goals"]);
  // Token note for this slide: 278px. Chrome on the reference HTML reported 278.164.
  expect(Math.round(doc.heroes[0]?.fontPx ?? 0)).toBe(278);
  for (const bit of [
    'data-design="13-interim"',
    "78%",
    "25/32",
    "(3)",
    "Udarci (u okvir)",
    "acc",
    "#0E1431",
    "1080px",
    "1350px",
    "font:800 1em/.82",
  ])
    expect(doc.html).toContain(bit);
  // The handoff's value face is 1em with line-height .82. twoRow measures that face.
  expect(doc.html).not.toContain("font:800 .82em/1");
});

test("hero size, colourway, and the missing cover are template options", () => {
  expect(footballTemplate(player, { hero: "off" }).heroes).toEqual([]);
  expect(footballTemplate({ ...player, player: { ...karlo, hero: "none" } }).heroes).toEqual([]);
  expect(footballTemplate(player, { heroFontPx: 200 }).heroes).toEqual([
    { key: "goals", fontPx: 200 },
  ]);
  const red = footballTemplate(player, { colourway: "red" });
  expect(red.colourway).toBe("red");
  expect(red.html).toContain("#43122A");
  expect(red.html).toContain("not re-reviewed");
  expect(footballTemplate(player, { colourway: "light" }).html).toContain("#F4EEE1");
  expect(() => footballTemplate({ kind: "cover" } as never)).toThrow("Round 13 has no cover slide");
});
