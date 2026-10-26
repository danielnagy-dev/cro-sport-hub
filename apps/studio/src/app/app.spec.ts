import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { appConfig } from "./app.config";
import { Shell } from "./shell";
import { StudioApi } from "./studio-api";
import { stubSports } from "./stub-api";

describe("Shell", () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: appConfig.providers,
    }).compileComponents();
  });

  it("shows the studio shell and the tennis matches", async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector("h1")?.textContent).toContain("Studio");
    expect(compiled.textContent).toContain("Cro Sport Hub");
    expect(compiled.textContent).toContain("R16");
    expect(compiled.textContent).not.toContain("Matchday 8");
  });

  it("shows the football matches after that sport is chosen", async () => {
    const fixture = TestBed.createComponent(Shell);
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

describe("Shell empty list", () => {
  it("renders the empty match row", async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        {
          provide: StudioApi,
          useValue: {
            sports: () => of(stubSports),
            matches: () => of([]),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const empty = (fixture.nativeElement as HTMLElement).querySelector("li.match-empty");

    expect(empty?.textContent).toContain("No matches for this sport.");
  });
});
