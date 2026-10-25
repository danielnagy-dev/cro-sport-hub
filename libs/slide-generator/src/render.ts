import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import {
  footballTemplate,
  slideHeight,
  slideWidth,
  type FootballOptions,
  type FootballSlide,
} from "./football.ts";

const install = "Playwright Chromium is not installed. Run: vp exec playwright install chromium";

/** `undefined` when the Chromium binary from `vp exec playwright install chromium` is present. */
export function footballRendererReason(): string | undefined {
  try {
    const executable = chromium.executablePath();
    if (!existsSync(executable)) return `${install} (${executable})`;
  } catch (error) {
    const detail = error instanceof Error ? error.message : install;
    return `${install} (${detail})`;
  }
  return undefined;
}

const embedded = new Map<string, string>();

function fontUrl(file: string): string {
  const cached = embedded.get(file);
  if (cached !== undefined) return cached;
  const here = dirname(fileURLToPath(import.meta.url));
  const found = join(here, "../design/football-r13/fonts", file);
  if (!existsSync(found)) throw new Error(`Missing round-13 font ${file}`);
  const url = `url('data:font/ttf;base64,${readFileSync(found).toString("base64")}')`;
  embedded.set(file, url);
  return url;
}

function withFonts(html: string): string {
  return html
    .replace("url('../fonts/BigShouldersDisplay.ttf')", fontUrl("BigShouldersDisplay.ttf"))
    .replace("url('../fonts/Archivo.ttf')", fontUrl("Archivo.ttf"));
}

/** Empty input returns no bytes and does not launch a browser. */
export async function renderFootballPngs(
  slides: readonly FootballSlide[],
  options?: FootballOptions,
): Promise<Uint8Array[]> {
  if (slides.length === 0) return [];
  const reason = footballRendererReason();
  if (reason !== undefined) throw new Error(reason);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: slideWidth, height: slideHeight },
      deviceScaleFactor: 1,
    });
    const pngs: Uint8Array[] = [];
    for (const slide of slides) {
      await page.setContent(withFonts(footballTemplate(slide, options).html), {
        waitUntil: "load",
      });
      const facesReady = await page.evaluate<boolean>(
        "document.fonts.ready.then(function () { return document.fonts.check('900 192px BS') && document.fonts.check('700 20px AR'); })",
      );
      if (!facesReady) throw new Error("The round-13 fonts did not load");
      pngs.push(await page.screenshot({ type: "png" }));
    }
    return pngs;
  } finally {
    await browser.close();
  }
}
