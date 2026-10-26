/**
 * What `vp run verify:<target>` drives. Routes and handles match the apps on main.
 * Studio's anonymous screen is login. Web is one screen. UI stories are Library/Base plus the
 * Results score, tennis stats, and appearances stories.
 */

export const ports = {
  api: 3001,
  studio: 4200,
  web: 3000,
  ui: 6006,
} as const;

export type TargetName = keyof typeof ports;

export const composeServices = ["postgres", "redis"] as const;

/** Nest SwaggerModule.setup("docs") serves the UI at /docs and the document at /docs-json. */
export const apiPaths = {
  health: "/health",
  openApi: "/docs-json",
  swagger: "/docs",
} as const;

export type Handle =
  | { kind: "main" }
  | { kind: "heading"; name: string }
  | { kind: "text"; name: string }
  | { kind: "storybook" };

export type RouteCheck = {
  name: string;
  path: string;
  handle: Handle;
  /** Visible text that proves the user-facing end state, not only that a shell rendered. */
  proof?: string;
  /** When set, `proof` must be visible inside this role, inside the handle. */
  proofRole?: "listitem";
};

export type TargetSpec = {
  name: TargetName;
  port: number;
  command: readonly [string, ...string[]];
  readinessPath: string;
  timeoutSeconds: number;
  routes: readonly RouteCheck[];
};

export const targets: Record<TargetName, TargetSpec> = {
  api: {
    name: "api",
    port: ports.api,
    command: ["vp", "run", "api#dev"],
    readinessPath: apiPaths.health,
    timeoutSeconds: 120,
    routes: [
      {
        name: "Swagger UI",
        path: apiPaths.swagger,
        handle: { kind: "text", name: "Cro Sport Hub API" },
      },
    ],
  },
  studio: {
    name: "studio",
    port: ports.studio,
    command: ["vp", "run", "studio#dev"],
    readinessPath: "/",
    timeoutSeconds: 180,
    routes: [
      {
        name: "Login",
        path: "/login",
        handle: { kind: "main" },
        proof: "Log in",
      },
    ],
  },
  web: {
    name: "web",
    port: ports.web,
    command: ["vp", "run", "web#dev"],
    readinessPath: "/",
    timeoutSeconds: 120,
    routes: [
      {
        name: "Home",
        path: "/",
        handle: { kind: "main" },
        proof: "Cro Sport Hub",
      },
    ],
  },
  ui: {
    name: "ui",
    port: ports.ui,
    command: ["vp", "run", "@cro-sport-hub/ui#storybook"],
    readinessPath: "/index.json",
    timeoutSeconds: 120,
    routes: [],
  },
};

/** Proof text for stories we know. Other stories are still screenshotted. */
export const storyProof: Record<string, string> = {
  "library--base": "Sample Athlete",
  "results--tennis-score": "Sample Player A",
  "results--retired": "Retired",
  "results--football-score": "Sample Home",
  "results-tennis-stats--percentages": "66.7%",
  "results-appearances--table": "Second yellow",
};
