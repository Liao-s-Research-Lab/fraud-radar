import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, NativeModules, Platform, ToastAndroid } from 'react-native';
import Icon from '../Icon';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import RadarView from '../RadarView';
import theme, { accents } from '../../constants/theme';

const AItem = Animated.createAnimatedComponent(Pressable);

const features = [
  { key: 'check', route: '/check', icon: 'scan', title: '詐騙檢測', desc: '網址 / 文字 / 圖片 / 檔案', color: accents.check },
  { key: 'stats', route: '/statistics', icon: 'stats', title: '統計圖表', desc: '各類詐騙趨勢數據', color: accents.stats },
  { key: 'method', route: '/method', icon: 'warning', title: '常見手法', desc: '最新詐騙手法情報', color: accents.method },
  { key: 'game', route: '/game', icon: 'shield', title: '詐騙測驗', desc: '情境演練 + PR 評等', color: '#5BBF8A' },
];

const tips = [
  { icon: 'warning', text: '聽到「ATM 操作解除設定」一律是詐騙,掛掉電話。' },
  { icon: 'shield', text: '官方不會用私訊或簡訊要你點連結輸入帳密。' },
  { icon: 'scan', text: '投資保證獲利、穩賺不賠,99% 是詐騙陷阱。' },
];

function StatusDot() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.25, { duration: 900 }), -1, true);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, s]} />;
}

export default function Home() {
  const router = useRouter();

  const openFloating = () => {
    const m = NativeModules.FloatingModule;
    if (m && m.openFloating) {
      m.openFloating()
        .then((r) => {
          if (Platform.OS !== 'android') return;
          if (r === 'need_permission') ToastAndroid.show('請開啟「顯示在其他應用程式上層」權限後,再點一次開啟', ToastAndroid.LONG);
          else ToastAndroid.show('懸浮偵測已開啟', ToastAndroid.SHORT);
        })
        .catch(() => { if (Platform.OS === 'android') ToastAndroid.show('開啟失敗,請確認懸浮窗權限', ToastAndroid.LONG); });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <Text style={styles.brand}>騙局雷達</Text>
        <Text style={styles.brandEn}>FRAUD RADAR</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(700)} style={styles.radarWrap}>
        <RadarView size={210} />
        <View style={styles.statusPill}>
          <StatusDot />
          <Text style={styles.statusText}>即時偵測中</Text>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(150)} style={styles.tagline}>守護你的每一筆交易</Animated.Text>

      <AItem entering={FadeInDown.delay(200)} style={styles.floatCta} android_ripple={{ color: theme.primary + '33' }} onPress={openFloating}>
        <View style={styles.floatCtaIcon}><Icon name="radar" size={26} color={theme.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.floatCtaTitle}>開啟懸浮偵測</Text>
          <Text style={styles.floatCtaDesc}>任何畫面一鍵截圖檢測 · 可拖曳移除</Text>
        </View>
        <Icon name="chevron" size={18} color={theme.primary} />
      </AItem>

      {[0, 2].map((start) => (
        <View key={start} style={styles.row}>
          {features.slice(start, start + 2).map((f, i) => (
            <AItem
              key={f.key}
              entering={FadeInDown.delay(250 + (start + i) * 80)}
              style={styles.card}
              android_ripple={{ color: f.color + '33' }}
              onPress={() => router.push(f.route)}
            >
              <View style={[styles.iconWrap, { backgroundColor: f.color + '22', borderColor: f.color + '55' }]}>
                <Icon name={f.icon} size={24} color={f.color} />
              </View>
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={1}>{f.desc}</Text>
              <View style={styles.cardArrow}><Icon name="chevron" size={15} color={theme.textFaint} /></View>
            </AItem>
          ))}
        </View>
      ))}

      <Animated.View entering={FadeInDown.delay(600)} style={styles.tipsHeaderRow}>
        <View style={styles.bar} />
        <Text style={styles.tipsHeader}>防詐提醒</Text>
      </Animated.View>

      {tips.map((t, i) => (
        <Animated.View key={i} entering={FadeInDown.delay(680 + i * 80)} style={styles.tipRow}>
          <View style={styles.tipIcon}><Icon name={t.icon} size={18} color={theme.primary} /></View>
          <Text style={styles.tipText}>{t.text}</Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 18, paddingBottom: 28 },
  header: { alignItems: 'center', marginTop: 8 },
  brand: { fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: 4 },
  brandEn: { fontSize: 11, fontWeight: '700', color: theme.primary, letterSpacing: 6, marginTop: 2 },
  radarWrap: { marginTop: 6, alignItems: 'center' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryDim,
    borderColor: theme.borderHi, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 14,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginRight: 8 },
  statusText: { color: theme.primary, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  tagline: { color: theme.textDim, fontSize: 13, marginTop: 12, marginBottom: 16, textAlign: 'center' },
  floatCta: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16,
    backgroundColor: theme.primaryDim, borderRadius: 16, borderWidth: 1, borderColor: theme.borderHi,
    paddingVertical: 15, paddingHorizontal: 16,
  },
  floatCtaIcon: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: theme.bgElevated,
    borderWidth: 1, borderColor: theme.borderHi, alignItems: 'center', justifyContent: 'center',
  },
  floatCtaTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
  floatCtaDesc: { color: theme.textDim, fontSize: 12, marginTop: 3 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1, height: 124, backgroundColor: '#272D3A', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', padding: 14,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  cardTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  cardDesc: { color: theme.textDim, fontSize: 12, marginTop: 4 },
  cardArrow: { position: 'absolute', top: 15, right: 13 },
  tipsHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 12 },
  bar: { width: 4, height: 16, borderRadius: 2, backgroundColor: theme.primary, marginRight: 8 },
  tipsHeader: { color: theme.text, fontSize: 17, fontWeight: '800' },
  tipRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14, marginBottom: 10,
  },
  tipIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: theme.primaryDim,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  tipText: { flex: 1, color: theme.textDim, fontSize: 13, lineHeight: 19 },
});
