import { TestBed } from "@angular/core/testing";
import { App } from "./app";
import { appConfig } from "./app.config";

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();
  });

  it("shows the studio shell and the tennis matches", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector("h1")?.textContent).toContain("Studio");
    expect(compiled.textContent).toContain("Cro Sport Hub");
    expect(compiled.textContent).toContain("R16");
    expect(compiled.textContent).not.toContain("Matchday 8");
  });

  it("shows the football matches after that sport is chosen", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const football = [...compiled.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Football"),
    );

    football?.click();
    await fixture.whenStable();

    expect(compiled.textContent).toContain("Matchday 8");
    expect(compiled.textContent).not.toContain("R16");
  });
});
