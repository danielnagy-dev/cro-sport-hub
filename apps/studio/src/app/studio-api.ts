import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { matchSchema, sportSchema, type Match, type Sport } from "@cro-sport-hub/shared-types";
import { map, type Observable } from "rxjs";

export const sportsPath = "/api/sports";
export const matchesPath = "/api/matches";

/**
 * Read-only client for sports and matches.
 * Writes are a later change. Login lives on the auth store.
 */
@Injectable({ providedIn: "root" })
export class StudioApi {
  private readonly http = inject(HttpClient);

  sports(): Observable<Sport[]> {
    return this.http.get(sportsPath).pipe(map((body) => sportSchema.array().parse(body)));
  }

  matches(): Observable<Match[]> {
    return this.http.get(matchesPath).pipe(map((body) => matchSchema.array().parse(body)));
  }
}
