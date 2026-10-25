import { packageId as sharedTypesPackageId } from "@cro-sport-hub/shared-types";
import { packageId as uiPackageId } from "@cro-sport-hub/ui";

export default function HomePage() {
  return (
    <main id="content" tabIndex={-1} data-shared-types={sharedTypesPackageId} data-ui={uiPackageId}>
      <h1>Cro Sport Hub</h1>
      <p>Published results will be listed here.</p>
    </main>
  );
}
