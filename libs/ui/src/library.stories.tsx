import type { SportSlug } from "@cro-sport-hub/shared-types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { AthleteHeader } from "./athlete-header.tsx";
import { Badge } from "./badge.tsx";
import { SportTabs } from "./sport-tabs.tsx";

function Gallery() {
  const [sport, setSport] = useState<SportSlug>("tennis");

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Badge>Neutral</Badge>
        <Badge tone="tennis">Tennis</Badge>
        <Badge tone="football">Football</Badge>
      </div>
      <SportTabs
        value={sport}
        onChange={setSport}
        panels={{
          tennis: "Sample tennis results",
          football: "Sample football results",
        }}
      />
      <AthleteHeader
        name="Sample Athlete"
        country="HR"
        sport="football"
        birthYear={1998}
        position="Midfielder"
      />
    </div>
  );
}

const meta = {
  title: "Library",
  component: Gallery,
} satisfies Meta<typeof Gallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Base: Story = {};
