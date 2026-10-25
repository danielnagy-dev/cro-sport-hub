import type { Meta, StoryObj } from "@storybook/react-vite";
import { MatchCard } from "./match-card.tsx";

const meta = {
  title: "Results",
  component: MatchCard,
} satisfies Meta<typeof MatchCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TennisScore: Story = {
  args: {
    sport: "tennis",
    playerA: "Sample Player A",
    playerB: "Sample Player B",
    sets: [
      [6, 4],
      [7, 6, 4],
    ],
    winner: "a",
  },
};

export const Retired: Story = {
  args: {
    sport: "tennis",
    playerA: "Sample Player A",
    playerB: "Sample Player B",
    sets: [
      [6, 3],
      [3, 2],
    ],
    retired: true,
  },
};

export const FootballScore: Story = {
  args: {
    sport: "football",
    homeTeam: "Sample Home",
    awayTeam: "Sample Away",
    homeGoals: 2,
    awayGoals: 0,
  },
};
