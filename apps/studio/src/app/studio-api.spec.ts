import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { stubApiInterceptor, stubMatches, stubSports } from "./stub-api";
import { matchesPath, sportsPath, StudioApi } from "./studio-api";

describe("StudioApi", () => {
  let api: StudioApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StudioApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("parses sports and matches", async () => {
    const sports = firstValueFrom(api.sports());
    const matches = firstValueFrom(api.matches());
    http.expectOne(sportsPath).flush(stubSports);
    http.expectOne(matchesPath).flush(stubMatches);

    await expect(sports).resolves.toEqual(stubSports);
    await expect(matches).resolves.toEqual(stubMatches);
  });

  it("rejects a match list that fails the schema", async () => {
    const matches = firstValueFrom(api.matches());
    http.expectOne(matchesPath).flush([{ id: "bad" }]);

    await expect(matches).rejects.toThrow();
  });
});

describe("stubApiInterceptor", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([stubApiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  it("answers the read endpoints with the stub", async () => {
    const api = TestBed.inject(StudioApi);

    await expect(firstValueFrom(api.sports())).resolves.toEqual(stubSports);
    await expect(firstValueFrom(api.matches())).resolves.toEqual(stubMatches);
  });

  it("leaves every other request for the backend", () => {
    const http = TestBed.inject(HttpTestingController);
    const client = TestBed.inject(HttpClient);
    client.get("/api/other").subscribe();

    http.expectOne("/api/other");
    http.verify();
  });
});
