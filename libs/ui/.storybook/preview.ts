import type { Preview } from "@storybook/react-vite";
import "../src/tokens.css";
import "../src/components.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    a11y: {
      test: "error",
    },
  },
};

export default preview;
