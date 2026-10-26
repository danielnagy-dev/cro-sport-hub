import {
  packageId as sharedTypesPackageId,
  type PublishedMatch,
} from "@cro-sport-hub/shared-types";
import { MatchCard, packageId as uiPackageId, type MatchCardProps } from "@cro-sport-hub/ui";
import type { Metadata } from "next";
import { createApiClient } from "../lib/api-client";

/** Local API origin. The server calls it. The browser does not. */
const resultsApiOrigin = "http://localhost:3001";

/** Render on each request so a down API is not baked into the build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tennis and football results · Cro Sport Hub",
  description: "Latest tennis and football results.",
};

function cardProps(match: PublishedMatch): MatchCardProps {
  if (match.sport === "tennis") {
    return {
      sport: "tennis",
      playerA: match.playerA,
      playerB: match.playerB,
      sets: match.score,
      retired: match.retired,
      winner: match.winner,
    };
  }
  return {
    sport: "football",
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
  };
}

export default async function HomePage() {
  let items: readonly PublishedMatch[] | undefined;
  try {
    items = (await createApiClient({ baseUrl: resultsApiOrigin }).matches()).items;
  } catch {
    items = undefined;
  }

  return (
    <main id="content" tabIndex={-1} data-shared-types={sharedTypesPackageId} data-ui={uiPackageId}>
      <h1>Cro Sport Hub</h1>
      {items === undefined ? (
        <p>Results are unavailable.</p>
      ) : items.length === 0 ? (
        <p>No published results.</p>
      ) : (
        <ul className="results">
          {items.map((item) => (
            <li key={item.id}>
              <MatchCard {...cardProps(item)} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
