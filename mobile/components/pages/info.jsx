import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from '../Icon';
import { getInfoData, subscribeInfo, loadInfoData } from '../infoStore';
import theme, { accents } from '../../constants/theme';

function videoMeta(url = '') {
  if (/youtu\.?be|youtube/.test(url)) {
    const m = url.match(/(?:v=|\/shorts\/|youtu\.be\/|embed\/)([\w-]{11})/);
    const id = m && m[1];
    return { platform: 'YouTube', color: '#E5534B', thumb: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null, embed: null };
  }
  if (/tiktok/.test(url)) {
    const m = url.match(/video\/(\d+)/);
    return { platform: 'TikTok', color: '#2DD4BF', thumb: null, embed: m ? `https://www.tiktok.com/player/v1/${m[1]}` : null };
  }
  if (/instagram/.test(url)) {
    const m = url.match(/(reel|p|tv)\/([\w-]+)/);
    return { platform: 'Instagram', color: '#E1568F', thumb: null, embed: m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null };
  }
  return { platform: '影片', color: theme.primary, thumb: null, embed: null };
}

export default function Info() {
  const [data, setData] = useState(getInfoData());

  useEffect(() => {
    loadInfoData(); // 確保已開始(冪等;app 啟動時已呼叫過)
    const unsub = subscribeInfo(() => setData({ ...getInfoData() }));
    return unsub;
  }, []);

  const news = data.news || [];
  const videos = data.videos || [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>防詐資訊</Text>
      <Text style={styles.sub}>最新詐騙新聞與防詐短影音</Text>

      {/* 短影音 */}
      <View style={styles.headerRow}><View style={styles.bar} /><Text style={styles.section}>防詐短影音</Text></View>
      {videos.length === 0 ? (
        <Text style={styles.empty}>目前無影片(需網路連線載入)</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 6 }}>
          {videos.map((v, i) => {
            const m = videoMeta(v.url);
            return (
              <Animated.View key={i} entering={FadeInDown.delay(i * 50)}>
                <Pressable style={styles.vCard} onPress={() => Linking.openURL(v.url)}>
                  <View style={styles.vThumbWrap}>
                    {m.thumb ? (
                      <>
                        <Image source={{ uri: m.thumb }} style={styles.vThumb} resizeMode="cover" />
                        <View style={styles.playBadge}><Icon name="play" size={18} color="#fff" /></View>
                      </>
                    ) : m.embed ? (
                      <View style={styles.vThumb} pointerEvents="none">
                        <WebView
                          source={{ uri: m.embed }}
                          style={styles.vThumb}
                          scrollEnabled={false}
                          javaScriptEnabled
                          domStorageEnabled
                          mediaPlaybackRequiresUserAction
                          startInLoadingState
                          renderLoading={() => (
                            <View style={[styles.vThumb, styles.vThumbPh, styles.vThumbAbs, { backgroundColor: m.color + '22' }]}>
                              <ActivityIndicator color={m.color} />
                            </View>
                          )}
                        />
                      </View>
                    ) : (
                      <View style={[styles.vThumb, styles.vThumbPh, { backgroundColor: m.color + '26' }]}>
                        <View style={[styles.vPhCircle, { backgroundColor: m.color }]}><Icon name="play" size={24} color="#fff" /></View>
                        <Text style={[styles.vPhText, { color: m.color }]}>{m.platform}</Text>
                      </View>
                    )}
                    <View style={[styles.platTag, { backgroundColor: m.color }]}><Text style={styles.platText}>{m.platform}</Text></View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}

      {/* 新聞 */}
      <View style={styles.headerRow}><View style={styles.bar} /><Text style={styles.section}>詐騙新聞</Text></View>
      {news.length === 0 ? (
        <Text style={styles.empty}>目前無新聞(需網路連線載入)</Text>
      ) : (
        news.map((n, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(i * 50)}>
            <Pressable style={styles.news} onPress={() => n.link && Linking.openURL(n.link)}>
              {!!n.image && <Image source={{ uri: n.image }} style={styles.newsImg} resizeMode="cover" />}
              <Text style={styles.newsTitle} numberOfLines={3}>{n.title}</Text>
              <Icon name="chevron" size={16} color={theme.textFaint} />
            </Pressable>
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 18, paddingBottom: 36 },
  h1: { color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 4, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 14 },
  bar: { width: 4, height: 16, borderRadius: 2, backgroundColor: theme.primary, marginRight: 8 },
  section: { color: theme.text, fontSize: 17, fontWeight: '800' },
  empty: { color: theme.textFaint, fontSize: 13, paddingVertical: 10 },
  vCard: { marginRight: 12, width: 150 },
  vThumbWrap: { width: 150, height: 250, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  vThumb: { width: '100%', height: '100%' },
  vThumbPh: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  vThumbAbs: { position: 'absolute', top: 0, left: 0 },
  vPhCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  vPhText: { fontSize: 14, fontWeight: '800' },
  playBadge: {
    position: 'absolute', top: '50%', left: '50%', marginLeft: -22, marginTop: -22,
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  platTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  platText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  news: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border, padding: 10, marginBottom: 10,
  },
  newsImg: { width: 64, height: 64, borderRadius: 10, marginRight: 12, backgroundColor: theme.bgElevated },
  newsTitle: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 19, marginRight: 8 },
});
