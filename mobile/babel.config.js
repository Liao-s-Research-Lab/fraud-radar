module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // babel-preset-expo(SDK 52)會自動帶入 react-native-reanimated 外掛;
    // 明確列出以確保動畫 worklet 一定生效。
    plugins: ['react-native-reanimated/plugin'],
  };
};
