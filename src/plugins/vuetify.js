/**
 * Vuetify3 Plugin
 */
import { createVuetify } from "vuetify";
import { VFileUpload } from "vuetify/labs/components";

// Misc
import { loadFonts } from "./webfontloader";
loadFonts();

// Styles
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

const vuetify = createVuetify({
  theme: {
    defaultTheme: "darkTheme",
    themes: {
      lightTheme: {
        dark: false,
        colors: {
          primary: "#118acb",
          secondary: "#353841",
          accent: "#f4ecd0",
          danger: "#E04125",
          warning: "#f9c633",
          background: "#d5dfe7",
          backgroundDarken: "#BDD2DE",
          black: "#1A1A1A",
          white: "#E8E8E8",
          text: "#1A1A1A",
          textInverted: "#E8E8E8",
          upcoming: "#118acb",
          registered: "#5ec4b6",
          checkedin: "#4CAF50",
          past: "#989898",
          recommended: "#f9c633",
          canceled: "#202020",
        },
      },
      darkTheme: {
        dark: true,
        colors: {
          primary: "#118acb",
          secondary: "#d5dfe7",
          accent: "#f4ecd0",
          danger: "#E04125",
          warning: "#f9c633",
          background: "#42444C",
          backgroundDarken: "#32343A",
          black: "#1A1A1A",
          white: "#E8E8E8",
          text: "#E8E8E8",
          textInverted: "#1A1A1A",
          upcoming: "#118acb",
          registered: "#5ec4b6",
          checkedin: "#4CAF50",
          past: "#989898",
          recommended: "#f9c633",
          canceled: "#202020",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi",
  },
  components: {
    VFileUpload,
  },
});

export default vuetify;
// new colors
