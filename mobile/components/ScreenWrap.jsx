import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

// 每次分頁取得焦點都重播淡入 + 輕微上移
// 關鍵:用 withSequence 先瞬間歸零再淡入,否則第二次起目前值已是 1,withTiming 不會動
export default function ScreenWrap({ children }) {
  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      progress.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) })
      );
      return () => {};
    }, [])
  );

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));

  return <Animated.View style={[styles.f, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({ f: { flex: 1 } });
