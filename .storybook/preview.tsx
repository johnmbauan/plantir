import type { Preview } from "@storybook/react-vite";
import { MantineProvider, createTheme } from "@mantine/core";
import "@/index.css";
import "@/i18n";

const theme = createTheme({
  primaryColor: "plantGreen",
  colors: {
    plantGreen: [
      "#eef4f0",
      "#d8e5dc",
      "#b5ccbc",
      "#8fb39b",
      "#6fa080",
      "#4a7c59",
      "#3d6849",
      "#2d5241",
      "#1f3d30",
      "#1a2e22",
    ],
  },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <MantineProvider theme={theme}>
        <div style={{ margin: "0 auto", maxWidth: 960, padding: 24 }}>
          <Story />
        </div>
      </MantineProvider>
    ),
  ],
  parameters: {
    a11y: {
      test: "todo",
    },
    controls: {
      expanded: true,
    },
    layout: "fullscreen",
  },
};

export default preview;
