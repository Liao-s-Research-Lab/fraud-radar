import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// 自製 SVG 圖示(避開 @expo/vector-icons 字型在 newArch+release 不顯示的問題)
export default function Icon({ name, size = 24, color = '#fff', strokeWidth = 2 }) {
  const p = {
    stroke: color,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const wrap = (children) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {children}
    </Svg>
  );

  switch (name) {
    case 'home':
      return wrap(
        <>
          <Path d="M3 11l9-8 9 8" {...p} />
          <Path d="M5 9.5V21h14V9.5" {...p} />
        </>
      );
    case 'scan': // 詐騙檢測(掃描框 + 中心)
      return wrap(
        <>
          <Path d="M4 8V5.5A1.5 1.5 0 015.5 4H8M16 4h2.5A1.5 1.5 0 0120 5.5V8M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16M8 20H5.5A1.5 1.5 0 014 18.5V16" {...p} />
          <Circle cx="12" cy="12" r="3" {...p} />
          <Circle cx="12" cy="12" r="0.6" fill={color} />
        </>
      );
    case 'warning':
      return wrap(
        <>
          <Path d="M12 3.5l9 16.5H3z" {...p} />
          <Line x1="12" y1="10" x2="12" y2="14.5" {...p} />
          <Circle cx="12" cy="17.5" r="0.7" fill={color} />
        </>
      );
    case 'stats':
      return wrap(
        <>
          <Line x1="6" y1="20" x2="6" y2="12.5" {...p} />
          <Line x1="12" y1="20" x2="12" y2="5" {...p} />
          <Line x1="18" y1="20" x2="18" y2="9.5" {...p} />
        </>
      );
    case 'radar':
      return wrap(
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Circle cx="12" cy="12" r="4.5" {...p} />
          <Line x1="12" y1="12" x2="19.5" y2="6" {...p} />
          <Circle cx="12" cy="12" r="1.3" fill={color} />
        </>
      );
    case 'chevron':
      return wrap(<Path d="M9 6l6 6-6 6" {...p} />);
    case 'news':
      return wrap(
        <>
          <Path d="M4 5.5A1.5 1.5 0 015.5 4H15v15.5H5.5A1.5 1.5 0 014 18z" {...p} />
          <Path d="M15 8h3.5A1.5 1.5 0 0120 9.5V18a1.5 1.5 0 01-1.5 1.5H15" {...p} />
          <Line x1="7" y1="8.5" x2="12" y2="8.5" {...p} />
          <Line x1="7" y1="12" x2="12" y2="12" {...p} />
          <Line x1="7" y1="15.5" x2="10.5" y2="15.5" {...p} />
        </>
      );
    case 'play':
      return wrap(<Path d="M8 5.5l11 6.5-11 6.5z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />);
    case 'shield':
      return wrap(
        <>
          <Path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" {...p} />
          <Path d="M9 12l2 2 4-4" {...p} />
        </>
      );
    default:
      return null;
  }
}
