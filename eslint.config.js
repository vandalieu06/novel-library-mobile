// eslint.config.js — flat config con eslint-config-expo (SDK 58)
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // example/ es código de referencia del starter (aliases @/ rotos);
    // android/ se genera con prebuild. Coincide con el exclude del tsconfig.
    ignores: ["node_modules/", "android/", "example/"],
  },
]);
