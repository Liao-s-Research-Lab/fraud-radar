import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import theme from '../constants/theme';

// 會掃描的雷達:靜態格線 + 旋轉光束 + 脈動環 + 幾顆光點
export default function RadarView({ size = 240 }) {
  const c = size / 2;
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 3600, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.3 + pulse.value * 0.7 }],
    opacity: 0.5 * (1 - pulse.value),
  }));

  // 掃描光束(從正上方,張角 70°)
  const a = (70 * Math.PI) / 180;
  const beam = `M ${c} ${c} L ${c} ${c * 0.04} A ${c * 0.96} ${c * 0.96} 0 0 1 ${
    c + c * 0.96 * Math.sin(a)
  } ${c - c * 0.96 * Math.cos(a)} Z`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* 脈動環 */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: theme.primary,
          },
          pulseStyle,
        ]}
      />

      {/* 靜態雷達格線 + 光點 */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={c - 2} stroke={theme.borderHi} strokeWidth={1.5} fill="none" />
        <Circle cx={c} cy={c} r={(c - 2) * 0.66} stroke={theme.border} strokeWidth={1} fill="none" />
        <Circle cx={c} cy={c} r={(c - 2) * 0.33} stroke={theme.border} strokeWidth={1} fill="none" />
        <Line x1={c} y1={4} x2={c} y2={size - 4} stroke={theme.border} strokeWidth={1} />
        <Line x1={4} y1={c} x2={size - 4} y2={c} stroke={theme.border} strokeWidth={1} />
        <Circle cx={c + 42} cy={c - 34} r={4.5} fill={theme.primary} />
        <Circle cx={c - 58} cy={c + 30} r={3.5} fill={theme.cyan} />
        <Circle cx={c + 18} cy={c + 52} r={3} fill={theme.warning} />
      </Svg>

      {/* 旋轉掃描光束 */}
      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Path d={beam} fill="url(#sweepGrad)" />
          <Line x1={c} y1={c} x2={c} y2={3} stroke={theme.primary} strokeWidth={2.5} strokeOpacity={0.95} />
        </Svg>
      </Animated.View>

      {/* 中心核心 */}
      <View style={styles.core} />
      <View style={styles.coreGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.primary,
  },
  coreGlow: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.primaryDim,
  },
});
