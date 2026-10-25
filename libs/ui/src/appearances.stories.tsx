import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppearancesTable } from "./appearances-table.tsx";
import { appearanceRows } from "./result-samples.ts";

const meta = {
  title: "Results/Appearances",
  component: AppearancesTable,
} satisfies Meta<typeof AppearancesTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Table: Story = {
  args: {
    athleteName: "Sample Player",
    rows: appearanceRows,
  },
};
