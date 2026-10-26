import type { Routes } from "@angular/router";
import { editorGuard, guestGuard } from "./auth";
import { Shell } from "./shell";

export const studioRoutes: Routes = [
  {
    path: "login",
    loadComponent: () => import("./login").then((module) => module.LoginPage),
    canActivate: [guestGuard],
  },
  { path: "", pathMatch: "full", component: Shell, canActivate: [editorGuard] },
  { path: "**", redirectTo: "" },
];
