// 騙局雷達 — 深色科技雷達風(偏中性灰 + 橘色主調,對齊網頁/logo)
export const theme = {
  // 底色(中性深灰,微暖)
  bg: '#15171C',
  bgElevated: '#1D2026',
  card: '#23262E',
  cardHi: '#2C313A',
  // 強調色(橘為主)
  primary: '#F2873E',     // 品牌橘(雷達/按鈕/選中)
  primaryDim: 'rgba(242,135,62,0.13)',
  cyan: '#5B8BB5',        // 次:沉穩藍(少量)
  gold: '#E0A93C',        // 琥珀金
  purple: '#C77DD6',
  danger: '#E5534B',
  warning: '#E0A93C',
  // 文字
  text: '#ECECEE',
  textDim: '#9A9AA4',
  textFaint: '#646470',
  // 線
  border: 'rgba(255,255,255,0.07)',
  borderHi: 'rgba(242,135,62,0.42)',
};

// 各功能配色(以橘為主,其餘暖/中性,避免太多藍綠)
export const accents = {
  check: '#F2873E',   // 詐騙檢測 — 橘
  stats: '#5B8BB5',   // 統計 — 沉穩藍
  method: '#E0A93C',  // 手法 — 琥珀金
  float: '#D9685A',   // 懸浮偵測 — 暖紅
};

export default theme;
