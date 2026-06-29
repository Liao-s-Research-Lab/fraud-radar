import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Icon from '../../Icon';
import API from '../../../config/api';
import theme, { accents } from '../../../constants/theme';

const TYPES = [
  { key: 'URL', label: '網址', icon: 'scan', hint: '貼上可疑網址' },
  { key: 'TXT', label: '文字', icon: 'shield', hint: '貼上對話 / 新聞 / 內容' },
  { key: 'MSG', label: '簡訊', icon: 'warning', hint: '貼上簡訊內容' },
  { key: 'IMG', label: '圖片', icon: 'radar', hint: '選擇截圖 / 圖片' },
];

const GUIDE = [
  { t: '網址檢測', d: '可疑連結、釣魚網站、假購物站', icon: 'scan', c: accents.check },
  { t: '文字檢測', d: '對話、新聞、貼文內容分析', icon: 'shield', c: theme.gold },
  { t: '簡訊檢測', d: '可疑簡訊、包裹/帳單通知', icon: 'warning', c: accents.float },
  { t: '圖片檢測', d: '截圖、對話圖、廣告圖 OCR 偵測', icon: 'radar', c: accents.stats },
];

export default function CheckScreen() {
  const [type, setType] = useState('URL');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const reset = () => { setResult(null); setError(''); };

  const pickImage = async () => {
    reset();
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled) setImage(res.assets[0]);
  };

  const detect = async () => {
    reset();
    setLoading(true);
    try {
      let res;
      if (type === 'IMG') {
        if (!image) { setError('請先選擇圖片'); setLoading(false); return; }
        const form = new FormData();
        form.append('files[]', { uri: image.uri, name: 'upload.jpg', type: image.type || 'image/jpeg' });
        res = await fetch(API.fetchContent, { method: 'POST', body: form });
      } else {
        if (!text.trim()) { setError('請先輸入內容'); setLoading(false); return; }
        const body = type === 'URL' ? { url: text.trim() } : { text: text.trim() };
        res = await fetch(API.fetchContent, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (data.pythonResult) setResult(data.pythonResult);
      else setError('未取得偵測結果');
    } catch (e) {
      setError('連線失敗:後端未啟動或網路不通(' + e.message + ')');
    }
    setLoading(false);
  };

  const rate = result ? Number(result.FraudRate || 0) : 0;
  const danger = rate >= 60;
  const mid = rate >= 30 && rate < 60;
  const rateColor = danger ? theme.danger : mid ? theme.gold : theme.primary;
  const matches = result && Array.isArray(result.Match) ? result.Match : [];
  const kwList = [...new Set(matches.map((m) => m.MatchKeyword).filter(Boolean))];
  const typeList = [...new Set(matches.map((m) => m.MatchType).filter(Boolean))];
  const remindList = [...new Set(matches.map((m) => m.Remind).filter(Boolean))];
  const preventList = [...new Set(matches.map((m) => m.Prevent).filter(Boolean))];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>詐騙檢測</Text>
        <Text style={styles.sub}>選擇類型,貼上內容,一鍵分析風險</Text>

        {/* 類型切換 */}
        <View style={styles.segment}>
          {TYPES.map((t) => {
            const on = type === t.key;
            return (
              <Pressable key={t.key} onPress={() => { setType(t.key); reset(); }}
                style={[styles.seg, on && { backgroundColor: theme.primaryDim, borderColor: theme.borderHi }]}>
                <Icon name={t.icon} size={20} color={on ? theme.primary : theme.textFaint} />
                <Text style={[styles.segLabel, { color: on ? theme.primary : theme.textFaint }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 輸入區 */}
        {type === 'IMG' ? (
          <Pressable style={styles.imgPick} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <>
                <Icon name="radar" size={40} color={theme.textFaint} />
                <Text style={styles.imgHint}>點此選擇圖片 / 截圖</Text>
              </>
            )}
          </Pressable>
        ) : (
          <TextInput
            style={styles.input}
            placeholder={TYPES.find((t) => t.key === type)?.hint}
            placeholderTextColor={theme.textFaint}
            value={text}
            onChangeText={(v) => { setText(v); reset(); }}
            multiline={type !== 'URL'}
          />
        )}

        {/* 偵測按鈕 */}
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={detect} disabled={loading}>
          {loading ? <ActivityIndicator color={theme.bg} /> : <Icon name="scan" size={20} color={theme.bg} />}
          <Text style={styles.btnText}>{loading ? '掃描中…' : '開始偵測'}</Text>
        </Pressable>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* 結果 */}
        {result && (
          <Animated.View entering={FadeInDown} style={[styles.resultCard, { borderColor: rateColor + '66' }]}>
            <View style={styles.gaugeRow}>
              <View style={[styles.gauge, { borderColor: rateColor }]}>
                <Text style={[styles.gaugeNum, { color: rateColor }]}>{rate.toFixed(0)}</Text>
                <Text style={styles.gaugeUnit}>% 風險</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.verdict, { color: rateColor }]}>
                  {danger ? '⚠ 高風險,極可能是詐騙' : mid ? '需留意,有疑慮' : '風險較低'}
                </Text>
                {!!result.FraudResult && result.FraudResult !== '未檢測到' && (
                  <Text style={styles.fraudType}>{result.FraudResult}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldRow}><Text style={styles.fLabel}>情緒</Text><Text style={styles.fValue}>{result.Emotion || '無'}</Text></View>
            <View style={styles.fieldRow}>
              <Text style={styles.fLabel}>關鍵字</Text>
              <Text style={[styles.fValue, styles.kwValue]}>{kwList.length ? kwList.join('、') : '無'}</Text>
            </View>
            <View style={styles.fieldRow}><Text style={styles.fLabel}>類型</Text><Text style={styles.fValue}>{typeList.length ? typeList.join('、') : '無'}</Text></View>

            {remindList.length > 0 && (
              <View style={styles.adviceBox}>
                <Text style={styles.adviceLabel}>💡 提醒</Text>
                {remindList.map((r, i) => <Text key={i} style={styles.adviceText}>{r}</Text>)}
              </View>
            )}
            {preventList.length > 0 && (
              <View style={styles.adviceBox}>
                <Text style={[styles.adviceLabel, { color: theme.primary }]}>🛡 如何防範</Text>
                {preventList.map((p, i) => <Text key={i} style={styles.adviceText}>{p}</Text>)}
              </View>
            )}
          </Animated.View>
        )}

        {/* 說明 */}
        <View style={styles.guideHeaderRow}>
          <View style={styles.bar} />
          <Text style={styles.guideHeader}>可偵測的內容</Text>
        </View>
        {GUIDE.map((g) => (
          <View key={g.t} style={styles.guideRow}>
            <View style={[styles.gIcon, { backgroundColor: g.c + '22', borderColor: g.c + '55' }]}>
              <Icon name={g.icon} size={18} color={g.c} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gTitle}>{g.t}</Text>
              <Text style={styles.gDesc}>{g.d}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.note}>※ 結果僅供參考,請保持警覺。遇可疑情況可撥打 165 反詐騙專線。</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 18, paddingBottom: 40 },
  h1: { color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 4, marginBottom: 18 },
  segment: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  seg: {
    flex: 1, marginHorizontal: 3, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
  },
  segLabel: { fontSize: 12, fontWeight: '700', marginTop: 5 },
  input: {
    backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border,
    color: theme.text, padding: 16, fontSize: 15, minHeight: 56, maxHeight: 160,
  },
  imgPick: {
    backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border,
    borderStyle: 'dashed', height: 170, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  imgHint: { color: theme.textFaint, marginTop: 10, fontSize: 13 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, marginTop: 16,
  },
  btnText: { color: theme.bg, fontWeight: '800', fontSize: 16 },
  error: { color: theme.danger, fontSize: 13, marginTop: 14, textAlign: 'center' },
  resultCard: { backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, padding: 18, marginTop: 22 },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 14, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: theme.border },
  gauge: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 4, alignItems: 'center', justifyContent: 'center',
  },
  gaugeNum: { fontSize: 30, fontWeight: '800' },
  gaugeUnit: { color: theme.textDim, fontSize: 11, marginTop: -2 },
  verdict: { fontSize: 16, fontWeight: '800' },
  fraudType: { color: theme.text, fontSize: 14, marginTop: 6 },
  fieldRow: { flexDirection: 'row', marginTop: 12 },
  fLabel: { width: 52, color: theme.textDim, fontSize: 14, fontWeight: '700' },
  fValue: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 20 },
  kwValue: { color: theme.gold, fontWeight: '800' },
  adviceBox: { backgroundColor: theme.bgElevated, borderRadius: 12, padding: 12, marginTop: 12 },
  adviceLabel: { color: theme.gold, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  adviceText: { color: theme.text, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  guideHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  bar: { width: 4, height: 16, borderRadius: 2, backgroundColor: theme.primary, marginRight: 8 },
  guideHeader: { color: theme.text, fontSize: 17, fontWeight: '800' },
  guideRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 13, marginBottom: 10,
  },
  gIcon: {
    width: 38, height: 38, borderRadius: 11, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  gTitle: { color: theme.text, fontSize: 14, fontWeight: '700' },
  gDesc: { color: theme.textDim, fontSize: 12, marginTop: 3 },
  note: { color: theme.textFaint, fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: 'center' },
});

