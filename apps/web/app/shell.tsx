import type { ReactNode } from "react";

/** Shared chrome for every public page. The page supplies `main`. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="shell-header">
        <a className="shell-home" href="/">
          Cro Sport Hub
        </a>
      </header>
      {children}
    </div>
  );
}
