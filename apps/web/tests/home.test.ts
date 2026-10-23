import { expect, test } from "vite-plus/test";
import { packageId as sharedTypesPackageId } from "@cro-sport-hub/shared-types";
import { packageId as uiPackageId } from "@cro-sport-hub/ui";

test("workspace packages resolve", () => {
  expect(sharedTypesPackageId).toBe("@cro-sport-hub/shared-types");
  expect(uiPackageId).toBe("@cro-sport-hub/ui");
});
