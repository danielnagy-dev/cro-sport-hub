import { Component, inject } from "@angular/core";
import { EditorStore } from "./editor.store";

@Component({
  selector: "app-root",
  templateUrl: "./app.html",
})
export class App {
  protected readonly editor = inject(EditorStore);
}
