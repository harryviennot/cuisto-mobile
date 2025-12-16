module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.APP_VARIANT === "production";
  const isPreview = process.env.APP_VARIANT === "preview";
  const shouldRemoveConsole = isProduction || isPreview;

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      shouldRemoveConsole && [
        "transform-remove-console",
        { exclude: ["error", "warn"] },
      ],
    ].filter(Boolean),
  };
};