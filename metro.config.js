const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

config.resolver.extraNodeModules = {
  "@": path.resolve(__dirname, "src"),
  "@components": path.resolve(__dirname, "src/components"),
  "@hooks": path.resolve(__dirname, "src/hooks"),
  "@constants": path.resolve(__dirname, "src/constants.ts"),
  "@theme": path.resolve(__dirname, "src/theme.ts"),
  "@utils": path.resolve(__dirname, "src/utils"),
  "@types": path.resolve(__dirname, "src/types"),
  "@locales": path.resolve(__dirname, "src/locales"),
  "@api": path.resolve(__dirname, "src/api"),
  "@global": path.resolve(__dirname, "src/global.css"),
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
