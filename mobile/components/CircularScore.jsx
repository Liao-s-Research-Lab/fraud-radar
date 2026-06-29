import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import theme from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const STOPS = [0, 30, 60, 100];
const COLORS = ['#3FBF7F', '#5BBF8A', '#E0A93C', '#E5534B'];

// 圓形進度環:出現時數字 0→value 跑動,顏色隨進度漸變(綠→金→紅)
export default function CircularScore({ value = 0, size = 110, stroke = 9, label = '風險' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = 0;
    p.value = withTiming(pct, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - p.value / 100),
    stroke: interpolateColor(p.value, STOPS, COLORS),
  }));
  const numProps = useAnimatedProps(() => ({ text: `${Math.round(p.value)}%`, defaultValue: '0%' }));
  const numStyle = useAnimatedStyle(() => ({ color: interpolateColor(p.value, STOPS, COLORS) }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={circleProps}
        />
      </Svg>
      <View style={styles.center}>
        <AnimatedTextInput
          editable={false}
          underlineColorAndroid="transparent"
          animatedProps={numProps}
          style={[styles.num, { fontSize: size * 0.3, width: size * 0.82 }, numStyle]}
        />
        <Text style={[styles.label, { fontSize: size * 0.12 }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  num: { fontWeight: '900', padding: 0, textAlign: 'center', includeFontPadding: false },
  label: { color: theme.textDim, fontWeight: '700', marginTop: -2 },
});
