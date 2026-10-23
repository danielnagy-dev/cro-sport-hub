import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import HomePage from "../app/page";

test("home page renders", () => {
  const html = renderToStaticMarkup(createElement(HomePage));

  expect(html).toContain("Cro Sport Hub");
  expect(html).toContain("@cro-sport-hub/shared-types");
  expect(html).toContain("@cro-sport-hub/ui");
});
