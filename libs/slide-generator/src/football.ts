/**
 * Round 13 interim football template. There is no cover slide.
 * Hero size is computed here. See ADR-003.
 * List passes are text ("84%" over "38/45"). There is no list donut.
 */
export const slideWidth = 1080;
export const slideHeight = 1350;
export const designRound = "13-interim" as const;

/** Cap height / em, Big Shoulders Display weight 800, from the bundled face. */
const CAP = 0.81;
const HERO_KEYS = ["goals", "assists", "saves", "rating"] as const;

export type Colourway = "navy" | "red" | "light";
export type FootballStatInput = {
  key: string;
  label: string;
  value?: string;
  onTarget?: string;
  accurate?: number;
  total?: number;
};
export type FootballFixture = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  side: "home" | "away";
};
export type FootballPerson = {
  name: string;
  club: string;
  number: number;
  position: string;
  fixture: FootballFixture;
  stats: readonly FootballStatInput[];
  /** Stat key to force. `"none"` leaves the grid without a hero. */
  hero?: string;
  lineup?: "start" | "sub";
};
type SlideMeta = { competition: string; round: string; date: string };
export type FootballSlide =
  | (SlideMeta & { kind: "player"; player: FootballPerson })
  | (SlideMeta & { kind: "list"; players: readonly FootballPerson[] });
export type FootballOptions = {
  colourway?: Colourway;
  hero?: "measured" | "off";
  /** Replaces the measured hero size. The round-13 size stays the handoff value. */
  heroFontPx?: number;
  brand?: string;
};
export type FootballDocument = {
  width: typeof slideWidth;
  height: typeof slideHeight;
  kind: FootballSlide["kind"];
  colourway: Colourway;
  designRound: typeof designRound;
  heroes: readonly { key: string; fontPx: number }[];
  /** 1 on a player slide. List zoom is the round-13 row table. */
  zoom: number;
  html: string;
};

type Stat = FootballStatInput & { value: string; percent?: number };
type Hero = { key: string; fontPx: number };

const COLOURS: Record<Colourway, string> = {
  navy: "--bg:#0E1431;--bg2:#0A0F25;--fg:#F3EEE3;--dim:rgba(243,238,227,0.7);--mute:rgba(243,238,227,0.5);--fnc:rgba(243,238,227,0.6);--rule:rgba(243,238,227,0.16);--rule2:rgba(243,238,227,0.3);--red:#E5263A;--win:#5BC490;--loss:#F2475A;--mark:rgba(243,238,227,0.42);--texture:rgba(243,238,227,0.02)",
  red: "--bg:#43122A;--bg2:#120E20;--fg:#F6F0E4;--dim:rgba(246,240,228,0.7);--mute:rgba(246,240,228,0.5);--fnc:rgba(246,240,228,0.6);--rule:rgba(246,240,228,0.16);--rule2:rgba(246,240,228,0.3);--red:#F03A4E;--win:#74D6A4;--loss:#FF8C99;--mark:rgba(246,240,228,0.42);--texture:rgba(246,240,228,0.02)",
  light:
    "--bg:#F4EEE1;--bg2:#EEE5D2;--fg:#0E1A3A;--dim:rgba(14,26,58,0.7);--mute:rgba(14,26,58,0.5);--fnc:rgba(14,26,58,0.6);--rule:rgba(14,26,58,0.22);--rule2:rgba(14,26,58,0.3);--red:#D0192E;--win:#177548;--loss:#C8192D;--mark:rgba(14,26,58,0.42);--texture:rgba(14,26,58,0.028)",
};
export function footballTemplate(
  slide: FootballSlide,
  options: FootballOptions = {},
): FootballDocument {
  const kind: string = slide.kind;
  if (kind !== "player" && kind !== "list") throw new Error("Round 13 has no cover slide");
  const colourway = options.colourway ?? "navy";
  const heroes: Hero[] = [];
  const zoom = slide.kind === "list" ? listZoom(slide.players.length) : 1;
  const body =
    slide.kind === "player"
      ? playerBody(slide, options, heroes)
      : listBody(slide, options, heroes, zoom);
  return {
    width: slideWidth,
    height: slideHeight,
    kind: slide.kind,
    colourway,
    designRound,
    heroes,
    zoom,
    html: page(colourway, options.brand ?? "HRVATSKI SPORT", body, slide.kind),
  };
}

function listZoom(count: number): number {
  if (count > 6) throw new Error("A list slide holds at most 6 players");
  if (count < 1) throw new Error("A list needs a player");
  if (count >= 4) return 1.15;
  return count === 3 ? 1.3 : 1.5;
}

function prepare(input: readonly FootballStatInput[]): Stat[] {
  const stats: Stat[] = input.flatMap((raw) =>
    (raw.value === undefined || raw.value === "") && raw.total === undefined
      ? []
      : [{ ...raw, value: raw.value ?? "" }],
  );
  const shots = stats.find((stat) => stat.key === "shots");
  const onTarget = stats.find((stat) => stat.key === "sot");
  if (shots && onTarget && shots.onTarget === undefined) shots.onTarget = onTarget.value;
  const merged = shots && onTarget ? stats.filter((stat) => stat.key !== "sot") : stats;
  for (const stat of merged) {
    if (
      (stat.key === "passes" || stat.key === "pass_pct") &&
      stat.accurate !== undefined &&
      stat.total
    ) {
      stat.key = "passes";
      stat.label = "Dodavanja";
      stat.percent = stat.accurate / stat.total;
      stat.value = `${Math.round(stat.percent * 100)}%`;
    }
  }
  if (shots?.onTarget) shots.label = "Udarci (u okvir)";
  return merged.slice(0, 8);
}

function amount(value: string): number {
  const match = /\d+(?:[.,]\d+)?/.exec(value);
  return match ? Number(match[0].replace(",", ".")) : 0;
}

function pickHero(
  person: FootballPerson,
  stats: readonly Stat[],
  enabled: boolean,
  min: number,
): number | null {
  if (!enabled || stats.length < min || person.hero === "none") return null;
  if (person.hero !== undefined) {
    const chosen = stats.findIndex(
      (stat) => stat.key === person.hero || stat.label.toLowerCase() === person.hero?.toLowerCase(),
    );
    if (chosen >= 0) return chosen;
  }
  return HERO_KEYS.reduce<number | null>((found, key) => {
    if (found !== null) return found;
    const index = stats.findIndex((stat) => stat.key === key && amount(stat.value) > 0);
    return index >= 0 ? index : null;
  }, null);
}

/** Cap top of row 1 to the baseline of row 2, divided by the cap ratio. */
function twoRow(
  value: number,
  valueLine: number,
  label: number,
  labelLine: number,
  top: number,
  bottom: number,
  gap: number,
): number {
  return (top + label * labelLine + gap + value * valueLine + bottom + 1 + value * CAP) / CAP;
}

function noHero(count: number): { cols: number; value: number } {
  const row = ("1,168 2,168 3,136 2,112 3,96 3,96 4,88 4,88".split(" ")[count - 1] ?? "4,88").split(
    ",",
  );
  return { cols: Number(row[0]), value: Number(row[1]) };
}

function playerBody(
  slide: Extract<FootballSlide, { kind: "player" }>,
  options: FootballOptions,
  heroes: Hero[],
): string {
  const person = slide.player;
  if (person.name.trim() === "") throw new Error("A player needs a name");
  const stats = prepare(person.stats);
  const heroIndex = pickHero(person, stats, (options.hero ?? "measured") === "measured", 2);
  return `${meta(slide.competition, slide.round, slide.date)}${who(person)}${matchLine(person, true)}${playerGrid(stats, heroIndex, person, options, heroes)}`;
}

function playerGrid(
  stats: readonly Stat[],
  heroIndex: number | null,
  person: FootballPerson,
  options: FootballOptions,
  heroes: Hero[],
): string {
  const hero = heroIndex === null ? undefined : stats[heroIndex];
  if (!hero) {
    const spec = noHero(stats.length);
    const tiles = stats.map((stat, index) => {
      const edge = `${index % spec.cols === 0 ? " c0" : ""}${index < spec.cols ? " r0" : ""}`;
      return `<div class="tile${edge}" style="font-size:${spec.value}px">${lab(stat.label)}${val(stat, person, true)}</div>`;
    });
    return `<div class="grid" style="grid-template-columns:repeat(${spec.cols},1fr)">${tiles.join("")}</div>`;
  }
  const rest = stats.filter((_, index) => index !== heroIndex);
  const rows = rest.length >= 2 ? 2 : 1;
  const cols = Math.max(1, Math.ceil(rest.length / rows));
  const value = [0, 112, 112, 96, 88][cols] ?? 88;
  const fontPx =
    options.heroFontPx ?? (rows === 2 ? twoRow(value, 0.82, 16, 1.1, 18, 20, 12) : value * 1.4);
  heroes.push({ key: hero.key, fontPx });
  const heroTile = `<div class="tile hero c0 r0" style="grid-row:1 / span ${rows};grid-column:1">${lab(hero.label)}${val(hero, person, true, fontPx)}</div>`;
  const tiles = rest.map((stat, index) => {
    const row = Math.floor(index / cols) + 1;
    return `<div class="tile${row === 1 ? " r0" : ""}" style="grid-row:${row};grid-column:${(index % cols) + 2};font-size:${value}px">${lab(stat.label)}${val(stat, person, true)}</div>`;
  });
  return `<div class="grid" style="grid-template-columns:1.3fr repeat(${cols},1fr)">${heroTile}${tiles.join("")}</div>`;
}

/** Plain second-row baseline. A text pass in row 1 adds the 16px fraction stack.
 * The donut-only content-bottom fallback (114px) does not apply: the percent has a baseline. */
function listHeroPx(row1Pass: boolean): number {
  const plain = twoRow(34, 1, 12, 1.1, 7, 9, 8);
  return row1Pass ? plain + 16 / CAP : plain;
}

function rowWidth(count: number, hero: boolean): number {
  if (hero) return 1 + Math.min(3, Math.ceil((count - 1) / 2));
  return count > 4 ? Math.min(4, Math.ceil(count / 2)) : Math.max(1, count);
}

function listLabel(stat: Stat): string {
  if (stat.onTarget) return "Udarci (okv.)";
  if (stat.key === "assists") return "Asist.";
  if (stat.key === "key_passes") return "Klj. dod.";
  if (stat.key === "yellow") return "Žuti";
  return stat.label;
}

type RowPlan = {
  person: FootballPerson;
  stats: Stat[];
  heroIndex: number | null;
  width: number;
};

function listBody(
  slide: Extract<FootballSlide, { kind: "list" }>,
  options: FootballOptions,
  heroes: Hero[],
  zoom: number,
): string {
  const plans: RowPlan[] = slide.players.map((person) => {
    if (person.name.trim() === "") throw new Error("A player needs a name");
    const stats = prepare(person.stats);
    const heroIndex = pickHero(person, stats, (options.hero ?? "measured") === "measured", 4);
    return { person, stats, heroIndex, width: rowWidth(stats.length, heroIndex !== null) };
  });
  const cols = Math.max(1, ...plans.map((plan) => plan.width));
  const heroSlide = plans.some((plan) => plan.heroIndex !== null);
  const template = heroSlide ? `128px repeat(${cols - 1},104px)` : `repeat(${cols},104px)`;
  const rows = plans.map((plan) => listRow(plan, template, options, heroes)).join("");
  return `<div class="block" style="--list-zoom:${zoom}">${meta(slide.competition, slide.round, slide.date)}${rows}</div>`;
}

function listRow(
  plan: RowPlan,
  template: string,
  options: FootballOptions,
  heroes: Hero[],
): string {
  const { person, stats, heroIndex, width } = plan;
  const hero = heroIndex === null ? undefined : stats[heroIndex];
  const rest = stats.filter((_, index) => index !== heroIndex);
  const across = hero ? width - 1 : width;
  const row1Pass = rest.slice(0, across).some((stat) => stat.percent !== undefined);
  const fontPx = hero === undefined ? undefined : (options.heroFontPx ?? listHeroPx(row1Pass));
  if (hero !== undefined && fontPx !== undefined) heroes.push({ key: hero.key, fontPx });
  const heroCell =
    hero === undefined
      ? ""
      : kvCell(hero, person, " hero c0 r0", "grid-row:1 / span 2;grid-column:1", fontPx);
  const cells = rest.map((stat, index) => {
    const row = Math.floor(index / across) + 1;
    const col = (index % across) + (hero === undefined ? 1 : 2);
    const edge = `${col === 1 ? " c0" : ""}${row === 1 ? " r0" : ""}`;
    return kvCell(stat, person, edge, `grid-row:${row};grid-column:${col}`);
  });
  return `<div class="row"><div>${who(person)}${matchLine(person, false)}</div><div class="sg" style="grid-template-columns:${template}">${heroCell}${cells.join("")}</div></div>`;
}

function kvCell(
  stat: Stat,
  person: FootballPerson,
  edge: string,
  place: string,
  fontPx?: number,
): string {
  const label = listLabel(stat);
  return `<div class="kv${edge}" style="${place}">${lab(label, label.length > 10)}${val(stat, person, false, fontPx)}</div>`;
}

function who(person: FootballPerson): string {
  const parts = person.name.trim().split(/\s+/);
  const surname = parts.at(-1) ?? person.name;
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const accent = /[ČĆŠŽĐ]/.test(surname.toUpperCase()) ? " acc" : "";
  const given = first === "" ? "" : `<span class="fn">${esc(first)}</span>`;
  return `<div class="name${accent}">${given}<span class="ln">${esc(surname)}</span></div><p class="id"><span>${esc(person.club)}</span><i></i><span>#${person.number}</span><i></i><span>${esc(person.position)}</span></p>`;
}

function matchLine(person: FootballPerson, player: boolean): string {
  const { fixture } = person;
  const draw = fixture.homeScore === fixture.awayScore;
  const won = !draw && fixture.homeScore > fixture.awayScore === (fixture.side === "home");
  const opponent = fixture.side === "home" ? fixture.away : fixture.home;
  const mark = fixture.side === "home" ? HOME : AWAY;
  return `<p class="match${player ? " player" : ""}"><b class="${draw ? "d" : won ? "w" : "l"}">${fixture.homeScore}–${fixture.awayScore}</b><span class="vs">vs</span><span class="opp">${mark}${esc(opponent)}</span></p>`;
}

function lab(label: string, tight = false): string {
  return `<div class="lab${tight ? " tight" : ""}"><i></i><span>${esc(label)}</span></div>`;
}

function val(stat: Stat, person: FootballPerson, donut: boolean, fontPx?: number): string {
  const size = fontPx === undefined ? "" : ` style="font-size:${Math.round(fontPx * 100) / 100}px"`;
  if (stat.percent !== undefined && stat.accurate !== undefined && stat.total !== undefined) {
    const fraction = `${stat.accurate}/${stat.total}`;
    if (donut)
      return `<span class="pass"${size}><span class="frac">${fraction}</span><span class="ring">${ring(stat.percent)}<span class="pct">${esc(stat.value)}</span></span></span>`;
    return `<span class="pass text"${size}><span>${esc(stat.value)}</span><span class="frac">${fraction}</span></span>`;
  }
  const extra = stat.onTarget ? `<span class="ot">(${esc(stat.onTarget)})</span>` : "";
  const lineup = stat.key === "minutes" ? lineupIcon(person.lineup) : "";
  return `<span class="num"${size}>${esc(stat.value)}${extra}${lineup}</span>`;
}

function lineupIcon(lineup: FootballPerson["lineup"]): string {
  if (lineup === "start")
    return icon("M8.2 3.5L3 6.4l2 4.2 2.2-1V20.5h9.6V9.6l2.2 1 2-4.2-5.2-2.9");
  if (lineup === "sub") return icon("M4 5.5h16v4.5H4zM3 14h18");
  return "";
}

function ring(percent: number): string {
  const turn = 2 * Math.PI * 42;
  const arc = Math.max(0, Math.min(1, percent)) * turn;
  return `<svg class="rg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-width="9"/><circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="9" stroke-dasharray="${arc.toFixed(2)} ${turn.toFixed(2)}" transform="rotate(-90 50 50)"/></svg>`;
}

function icon(path: string): string {
  return `<svg class="vi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="${path}"/></svg>`;
}

function meta(lead: string, round: string, date: string): string {
  return `<header class="meta"><span>${esc(lead)}</span><i></i><span class="dim">${esc(round)}</span><i></i><span class="dim">${esc(date)}</span></header>`;
}

function page(
  colourway: Colourway,
  brand: string,
  body: string,
  kind: FootballSlide["kind"],
): string {
  const note = colourway === "navy" ? "" : "<!-- colourway not re-reviewed since v1 -->";
  return `<!doctype html><html lang="hr"><head><meta charset="utf-8"><style>${CSS}</style></head><body><article class="s ${kind}" data-design="${designRound}" data-kind="${kind}" data-colourway="${colourway}" style="${COLOURS[colourway]};width:${slideWidth}px;height:${slideHeight}px">${note}<div class="tex"></div><div class="content">${body}</div><footer class="brand"><span class="mk"></span><b>${esc(brand)}</b></footer></article></body></html>`;
}

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (char) =>
    char === "&" ? "&amp;" : char === "<" ? "&lt;" : char === ">" ? "&gt;" : "&quot;",
  );
}

const HOME = icon("M3.5 11.5L12 4.5l8.5 7M6 9.8V19.5h12V9.8M10 19.5v-5h4v5");
const AWAY = icon(
  "M12 2.8c.9 0 1.5.9 1.5 2.2v4.6l7 4.1v2.1l-7-2.1v4.1l2.2 1.7v1.7L12 20.2l-3.7 1v-1.7l2.2-1.7v-4.1l-7 2.1v-2.1l7-4.1V5c0-1.3.6-2.2 1.5-2.2z",
);
const CSS =
  "@font-face{font-family:BS;src:url('../fonts/BigShouldersDisplay.ttf');font-weight:100 900}@font-face{font-family:AR;src:url('../fonts/Archivo.ttf');font-weight:100 900;font-stretch:62% 125%}" +
  "*{margin:0;padding:0;box-sizing:border-box}.s{position:relative;overflow:hidden;color:var(--fg);font-family:AR;background:linear-gradient(180deg,var(--bg) 0%,var(--bg) 35%,var(--bg2) 100%)}.tex{position:absolute;inset:0;background:repeating-conic-gradient(var(--texture) 0 25%,transparent 0 50%) 0 0/24px 24px}.content{position:absolute;left:72px;right:72px;top:72px;bottom:184px}" +
  ".brand{position:absolute;left:72px;bottom:72px;display:flex;align-items:center;gap:16px}.mk{width:40px;height:40px;background:repeating-conic-gradient(var(--red) 0 25%,#fff 0 50%) 0 0/20px 20px}.brand b{font:800 32px/1 BS;letter-spacing:.04em;text-transform:uppercase}.meta{display:flex;align-items:center;gap:16px;font:700 20px/1.1 AR;font-stretch:88%;letter-spacing:.06em;text-transform:uppercase}.meta i{width:8px;height:8px;background:var(--red)}.dim{color:var(--dim)}" +
  ".name{font-family:BS;text-transform:uppercase;font-size:192px}.player .fn,.list .fn{display:block;font-weight:700;color:var(--fnc)}.player .fn{font-size:.58em;line-height:.92}.list .name{font-size:56px;font-weight:800}.list .fn{font-size:.5em}.ln{display:block;font-weight:900;line-height:.9}.list .ln{font-weight:800;line-height:1}.acc .fn{margin-bottom:.2em}" +
  ".id{display:flex;align-items:center;gap:14px;color:var(--dim);font:700 28px/1 AR;font-stretch:88%;letter-spacing:.06em;text-transform:uppercase;margin-top:24px}.id i{width:6px;height:6px;background:var(--mute)}.list .id{font-size:22px;margin-top:12px}.match{display:flex;align-items:baseline;gap:14px;margin-top:48px;font:500 25px/1 AR;font-stretch:88%;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}.list .match{margin-top:12px;font-size:20px}.match b{font:900 1.45em/1 BS}.list .match b{font-size:1.02em}.w{color:var(--win)}.l{color:var(--loss)}.d{color:var(--fg)}.vs{font-size:.8em}.opp{display:inline-flex;align-items:center;gap:6px}.vi{width:1em;height:1em}" +
  ".grid{display:grid;margin-top:40px}.tile,.kv{border-left:1px solid var(--rule);border-top:1px solid var(--rule);padding:18px 28px 20px;display:flex;flex-direction:column;gap:12px}.kv{padding:7px 14px 9px;gap:8px}.c0{border-left:0;padding-left:0}.r0{border-top:0}.lab{display:flex;align-items:center;gap:8px;color:var(--dim);font:700 16px/1.1 AR;font-stretch:88%;letter-spacing:.06em;text-transform:uppercase}.kv .lab{font-size:12px}.lab i{width:6px;height:6px;background:var(--mark)}.kv .lab i{width:5px;height:5px}.tight{letter-spacing:.01em}" +
  ".num,.pass{font:800 1em/.82 BS;color:var(--fg)}.kv .num,.kv .pass{font-size:34px;line-height:1}.hero .num{line-height:1}.ot{font-size:.56em;color:var(--dim)}.pass{display:flex;align-items:center;justify-content:space-between}.pass.text{flex-direction:column;align-items:flex-start}.frac{font-size:.36em;color:var(--dim)}.kv .frac{font:700 12px/1 AR}.kv .pass.text{gap:4px}.ring{position:relative;width:.8em;height:.8em}.rg{width:100%;height:100%}.pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.24em}" +
  ".block{zoom:var(--list-zoom)}.block .meta{zoom:calc(1 / var(--list-zoom))}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:36px;align-items:start;padding:16px 0;border-bottom:1px solid var(--rule)}.sg{display:grid}";
