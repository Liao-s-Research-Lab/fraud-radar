import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Animated, { FadeInDown } from 'react-native-reanimated';
import theme from '../../constants/theme';

const W = Dimensions.get('window').width;
const palette = ['#F2873E', '#5B8BB5', '#E0A93C', '#D9685A', '#C77DD6', '#6B7280'];

const chartConfig = {
  backgroundGradientFrom: theme.card,
  backgroundGradientTo: theme.card,
  decimalPlaces: 0,
  color: (o = 1) => `rgba(242,135,62,${o})`,
  labelColor: (o = 1) => `rgba(154,154,164,${o})`,
  barPercentage: 0.62,
  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.06)' },
};

const shortLabel = (t) => (t || '').replace('詐騙', '').slice(0, 4);

export default function Statistics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'Statistics'));
        const arr = [];
        snap.forEach((d) => {
          if (d.id !== 'finalStatistics') {
            const x = d.data();
            arr.push({ type: x.Type, frequency: x.Frequency || 0 });
          }
        });
        arr.sort((a, b) => b.frequency - a.frequency);
        setData(arr);
      } catch (e) { /* 無網路時略過 */ }
      setLoading(false);
    })();
  }, []);

  const total = data.reduce((s, d) => s + d.frequency, 0);
  const top5 = data.slice(0, 5);
  const barData = { labels: top5.map((d) => shortLabel(d.type)), datasets: [{ data: top5.map((d) => d.frequency) }] };
  const other = data.slice(5).reduce((s, d) => s + d.frequency, 0);
  const pieData = [
    ...top5.map((d, i) => ({ name: shortLabel(d.type), population: d.frequency, color: palette[i], legendFontColor: theme.textDim, legendFontSize: 12 })),
    ...(other > 0 ? [{ name: '其他', population: other, color: palette[5], legendFontColor: theme.textDim, legendFontSize: 12 }] : []),
  ];

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={styles.loadingText}>載入統計資料…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>統計圖表</Text>
      <Text style={styles.sub}>各類詐騙趨勢與數據</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}><Text style={styles.sNum}>{total.toLocaleString()}</Text><Text style={styles.sLabel}>總通報數</Text></View>
        <View style={styles.summaryCard}><Text style={styles.sNum}>{data.length}</Text><Text style={styles.sLabel}>詐騙類型</Text></View>
        <View style={styles.summaryCard}><Text style={[styles.sNum, { fontSize: 15 }]} numberOfLines={1}>{top5[0]?.type || '-'}</Text><Text style={styles.sLabel}>最高風險</Text></View>
      </View>

      {top5.length > 0 && (
        <>
          <View style={styles.headerRow}><View style={styles.bar} /><Text style={styles.section}>各類詐騙數量(前五)</Text></View>
          <View style={styles.chartCard}>
            <BarChart data={barData} width={W - 64} height={220} chartConfig={chartConfig} fromZero showValuesOnTopOfBars withInnerLines style={{ borderRadius: 12, marginLeft: -8 }} />
          </View>

          <View style={styles.headerRow}><View style={styles.bar} /><Text style={styles.section}>類型占比</Text></View>
          <View style={styles.chartCard}>
            <PieChart data={pieData} width={W - 64} height={200} chartConfig={chartConfig} accessor="population" backgroundColor="transparent" paddingLeft="6" />
          </View>
        </>
      )}

      <View style={styles.headerRow}><View style={styles.bar} /><Text style={styles.section}>詐騙類型排行</Text></View>
      {data.length === 0 && <Text style={styles.empty}>目前無資料(需網路連線載入)</Text>}
      {data.map((d, i) => {
        const pct = total ? (d.frequency / total) * 100 : 0;
        return (
          <Animated.View key={d.type} entering={FadeInDown.delay(i * 50)} style={styles.rankRow}>
            <Text style={styles.rankNo}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.rankTop}>
                <Text style={styles.rankType}>{d.type}</Text>
                <Text style={styles.rankFreq}>{d.frequency.toLocaleString()}</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: palette[i % palette.length] }]} /></View>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.textDim, marginTop: 12 },
  content: { padding: 18, paddingBottom: 36 },
  h1: { color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 4, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14, alignItems: 'center' },
  sNum: { color: theme.primary, fontSize: 22, fontWeight: '800' },
  sLabel: { color: theme.textDim, fontSize: 12, marginTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  bar: { width: 4, height: 16, borderRadius: 2, backgroundColor: theme.primary, marginRight: 8 },
  section: { color: theme.text, fontSize: 17, fontWeight: '800' },
  chartCard: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  empty: { color: theme.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  rankNo: { color: theme.textFaint, fontSize: 15, fontWeight: '800', width: 24 },
  rankTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rankType: { color: theme.text, fontSize: 14, fontWeight: '600' },
  rankFreq: { color: theme.textDim, fontSize: 13, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: theme.bgElevated, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
