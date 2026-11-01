const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// withUniwindConfig debe ser el wrapper más exterior del config de Metro.
// global.css en la raíz del proyecto: Tailwind escanea classNames desde ahí.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
