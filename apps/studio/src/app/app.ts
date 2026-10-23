import { Component, signal } from "@angular/core";
import { packageId } from "@cro-sport-hub/shared-types";

@Component({
  selector: "app-root",
  styleUrl: "./app.css",
  templateUrl: "./app.html",
})
export class App {
  protected readonly title = signal("Cro Sport Hub");
  protected readonly sharedTypes = packageId;
}
