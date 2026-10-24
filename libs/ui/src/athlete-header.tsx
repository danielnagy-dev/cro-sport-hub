import type { SportSlug } from "@cro-sport-hub/shared-types";
import { Badge } from "./badge.tsx";
import { sportLabel } from "./sports.ts";

export type AthleteHeaderProps = {
  name: string;
  country: string;
  sport: SportSlug;
  birthYear?: number;
  position?: string;
};

/** Page title for one athlete. The name is the heading. */
export function AthleteHeader({ name, country, sport, birthYear, position }: AthleteHeaderProps) {
  return (
    <header className="csh-athlete-header">
      <Badge tone={sport}>{sportLabel[sport]}</Badge>
      <h1 className="csh-athlete-header__name">{name}</h1>
      <dl className="csh-athlete-header__facts">
        <div>
          <dt>Country</dt>
          <dd>{country}</dd>
        </div>
        {birthYear !== undefined ? (
          <div>
            <dt>Born</dt>
            <dd>{birthYear}</dd>
          </div>
        ) : null}
        {position !== undefined ? (
          <div>
            <dt>Position</dt>
            <dd>{position}</dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}
