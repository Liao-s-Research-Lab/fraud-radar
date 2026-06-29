import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Modal } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from '../Icon';
import theme from '../../constants/theme';

const scamCards = [
  { id: '01', title: '投資詐騙', keywords: ['外匯套利', '穩賺不賠', '專人帶牌'],
    description: '詐騙集團透過社群接觸受害人,以股票、虛擬貨幣、外匯名義誘導加入 LINE 投資群組。初期讓你小額獲利,再以「投資越多賺越多」引誘加碼,最後以洗碼量不足、IP 異常為由拒絕出金,直到網站消失才驚覺被騙。',
    viewImage: require('../images/scampic1.jpg') },
  { id: '02', title: '解除分期付款', keywords: ['重複扣款', '誤設分期', '操作ATM'],
    description: '假冒客服聲稱系統錯誤、誤設分期或重複扣款,要求你到 ATM、網銀或 APP「解除設定」,趁機把錢轉走。記住:沒有任何解除設定需要你操作 ATM。',
    viewImage: require('../images/scampic2.jpg') },
  { id: '03', title: '網拍詐騙', keywords: ['單一頁面', '限時特賣', '低於市價'],
    description: '網站常只有一頁、只賣單一商品,用限時特賣、倒數計時誘人,價格明顯低於市價,且只留 email、沒有公司地址與客服電話。',
    viewImage: require('../images/scampic3.png') },
  { id: '04', title: '愛情交友詐騙', keywords: ['急需用錢', '婉拒見面', '莫名消失'],
    description: '透過交友軟體建立感情,取得信任後編造醫療費、房租、海外受困等緊急理由騙錢,常婉拒視訊與見面。',
    viewImage: require('../images/scampic4.jpg') },
  { id: '05', title: '假冒詐騙', keywords: ['緊急通知', '中獎通知', '帳號資訊'],
    description: '假冒政府、金融機構或檢警,聲稱你涉及非法、需提供個資處理「緊急情況」,或謊稱中獎要先付手續費、稅款。',
    viewImage: require('../images/scampic5.jpg') },
];

export default function Method() {
  const [expanded, setExpanded] = useState(null);
  const [modalImg, setModalImg] = useState(null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>常見手法</Text>
      <Text style={styles.sub}>認識詐騙套路,第一時間識破</Text>

      <View style={styles.headerRow}><View style={styles.bar} /><Text style={styles.section}>常見詐騙手法</Text></View>
      {scamCards.map((s, i) => {
        const open = expanded === s.id;
        return (
          <Animated.View key={s.id} entering={FadeInDown.delay(i * 70)} style={styles.card}>
            <Pressable onPress={() => setModalImg(s.viewImage)}>
              <Image source={s.viewImage} style={styles.banner} resizeMode="contain" />
              <View style={styles.bannerTag}><Icon name="scan" size={13} color={theme.bg} /><Text style={styles.bannerTagText}>查看示意圖</Text></View>
            </Pressable>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.no}>{s.id}</Text>
                <Text style={styles.cardTitle}>{s.title}</Text>
              </View>
              <View style={styles.chips}>
                {s.keywords.map((k) => <View key={k} style={styles.chip}><Text style={styles.chipText}>{k}</Text></View>)}
              </View>
              <Text style={styles.desc} numberOfLines={open ? undefined : 3}>{s.description}</Text>
              <Pressable onPress={() => setExpanded(open ? null : s.id)}>
                <Text style={styles.more}>{open ? '收合 ▲' : '展開 ▼'}</Text>
              </Pressable>
            </View>
          </Animated.View>
        );
      })}

      <Modal visible={!!modalImg} transparent animationType="fade" onRequestClose={() => setModalImg(null)}>
        <Pressable style={styles.modalBg} onPress={() => setModalImg(null)}>
          {modalImg && <Image source={modalImg} style={styles.modalImg} resizeMode="contain" />}
          <Text style={styles.modalHint}>點任意處關閉</Text>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 18, paddingBottom: 36 },
  h1: { color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 4, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 12 },
  bar: { width: 4, height: 16, borderRadius: 2, backgroundColor: theme.primary, marginRight: 8 },
  section: { color: theme.text, fontSize: 17, fontWeight: '800' },
  card: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 14, overflow: 'hidden' },
  banner: { width: '100%', height: 210, backgroundColor: theme.bgElevated },
  bannerTag: {
    position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  bannerTagText: { color: theme.bg, fontSize: 11, fontWeight: '800' },
  cardBody: { padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  no: { color: theme.primary, fontSize: 14, fontWeight: '800', marginRight: 8 },
  cardTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  chip: { backgroundColor: theme.primaryDim, borderColor: theme.borderHi, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: theme.primary, fontSize: 12, fontWeight: '600' },
  desc: { color: theme.textDim, fontSize: 13, lineHeight: 20, marginTop: 10 },
  more: { color: theme.primary, fontSize: 13, fontWeight: '700', marginTop: 8 },
  news: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border, padding: 10, marginBottom: 10,
  },
  newsImg: { width: 64, height: 64, borderRadius: 10, marginRight: 12, backgroundColor: theme.bgElevated },
  newsTitle: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 19, marginRight: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalImg: { width: '100%', height: '80%' },
  modalHint: { color: theme.textDim, marginTop: 14, fontSize: 13 },
});
