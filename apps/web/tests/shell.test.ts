import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import HomePage from "../app/page";
import { SiteShell } from "../app/shell";

test("home shell skips to the heading", () => {
  const html = renderToStaticMarkup(createElement(SiteShell, null, createElement(HomePage)));

  expect(html).toContain('class="skip-link" href="#content"');
  expect(html).toContain("Skip to content");
  expect(html).toContain('class="shell-home" href="/"');
  expect(html).toContain('<main id="content" tabindex="-1"');
  expect(html).toContain("<h1>Cro Sport Hub</h1>");
  expect(html).toContain("Published results will be listed here.");
});

test("the shell styles use the shared UI tokens", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  expect(layout).toContain("@cro-sport-hub/ui/tokens.css");
  expect(css).toContain("var(--csh-color-canvas)");
  expect(css).toContain("var(--csh-color-text)");
  expect(css).toContain("var(--csh-font-sans)");
  expect(css).toContain("var(--csh-color-on-accent)");
  expect(css).toContain("var(--csh-color-focus)");
});
