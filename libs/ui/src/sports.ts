import type { SportSlug } from "@cro-sport-hub/shared-types";

/** v1 sports, in tab order. */
export const sportOrder = ["tennis", "football"] as const satisfies readonly SportSlug[];

export const sportLabel: Record<SportSlug, string> = {
  tennis: "Tennis",
  football: "Football",
};

/** Next tab for this key. Arrow keys select that sport; other keys are ignored. */
export function nextSport(current: SportSlug, key: string): SportSlug | undefined {
  const index = sportOrder.indexOf(current);

  if (key === "Home") return sportOrder[0];
  if (key === "End") return sportOrder[sportOrder.length - 1];
  if (key === "ArrowRight" || key === "ArrowDown") {
    return sportOrder[(index + 1) % sportOrder.length];
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return sportOrder[(index - 1 + sportOrder.length) % sportOrder.length];
  }

  return undefined;
}
