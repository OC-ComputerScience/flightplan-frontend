import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  js.configs.recommended, // Use ESLint's recommended config for JS
  ...pluginVue.configs["flat/recommended"], // Use Vue 3 recommended rules
  eslintPluginPrettierRecommended,
  {
    files: ["**/*.js", "**/*.vue"], // Specify file extensions to lint
    ignores: ["node_modules/", "dist/"], // Ignore build directories
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "vue/multi-word-component-names": "off", // Example Vue rule override
      semi: "off",
      quotes: "off",
      "comma-dangle": "off",
      "prettier/prettier": "error",
    },
  },
];
