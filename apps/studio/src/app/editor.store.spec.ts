import { TestBed } from "@angular/core/testing";
import { Subject, throwError } from "rxjs";
import { EditorStore } from "./editor.store";
import { StudioApi } from "./studio-api";
import { stubMatches, stubSports } from "./stub-api";

describe("EditorStore", () => {
  it("loads matches for the selected sport", () => {
    const sports = new Subject<typeof stubSports>();
    const matches = new Subject<typeof stubMatches>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: StudioApi,
          useValue: {
            sports: () => sports.asObservable(),
            matches: () => matches.asObservable(),
          },
        },
      ],
    });

    const store = TestBed.inject(EditorStore);
    expect(store.status()).toBe("loading");
    expect(store.visibleMatches()).toEqual([]);

    sports.next(stubSports);
    sports.complete();
    matches.next(stubMatches);
    matches.complete();

    expect(store.status()).toBe("ready");
    expect(store.visibleMatches()).toEqual(
      stubMatches.filter((match) => match.sportId === "sport-tennis"),
    );

    store.selectSport("football");
    expect(store.visibleMatches()).toEqual(
      stubMatches.filter((match) => match.sportId === "sport-football"),
    );
  });

  it("clears the lists when a read fails", () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: StudioApi,
          useValue: {
            sports: () => throwError(() => new Error("unavailable")),
            matches: () => throwError(() => new Error("unavailable")),
          },
        },
      ],
    });

    const store = TestBed.inject(EditorStore);
    expect(store.status()).toBe("error");
    expect(store.sports()).toEqual([]);
    expect(store.matches()).toEqual([]);
    expect(store.visibleMatches()).toEqual([]);
  });
});
