import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image, ImageBackground, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Icon from '../Icon';
import RadarView from '../RadarView';
import theme, { accents } from '../../constants/theme';
import { FRAUD_TYPES, ALL_SCRIPTS } from './quizData';
import { db, auth } from '../firebase/firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// 與網站一致的 Firebase 鍵名對應
const STAT_KEY = { romanceFraud: 'romanceFraud', imperFraud: 'impersonationFraud', shoppingFraud: 'shoppingFraud', investmentFraud: 'investmentFraud' };
const PR_DOC = { romanceFraud: 'RomanceFraud', imperFraud: 'ImpersonationFraud', shoppingFraud: 'ShoppingFraud', investmentFraud: 'InvestmentFraud' };
const round2 = (v) => Math.round((v || 0) * 100) / 100;
const singlePR = (userScore, arr) => {
  if (!arr.length || userScore === 0) return 0;
  const lower = arr.filter((s) => s < userScore).length;
  return Math.round((lower / arr.length) * 100);
};
const prColor = (v) => (v >= 80 ? '#3FBF7F' : v >= 60 ? '#5BBF8A' : v >= 40 ? '#E0A93C' : v > 0 ? '#E5534B' : '#646470');

const AVATARS = [
  require('../images/c1.png'),
  require('../images/c2.png'),
  require('../images/c3.png'),
  require('../images/c4.png'),
  require('../images/c5.png'),
];
const SCAMMER = require('../images/faurd.png');
// 各類別背景圖,對應網頁版
const BG = {
  romanceFraud: require('../images/pathway.png'),
  imperFraud: require('../images/room.jpg'),
  shoppingFraud: require('../images/supermarket.jpg'),
  investmentFraud: require('../images/bank.jpg'),
};

// 教學時填入對話框的範例訊息(避免空白難看)
const SAMPLE_MSGS = [
  { character: 'character1', text: 'OOO先生/小姐您好,我是XXX的客服人員。' },
  { character: 'character2', text: '您好,請問有什麼事嗎?' },
  { character: 'character1', text: '我們發現您有一筆交易出現問題,需要您到 ATM 前操作確認。' },
];

// 全身立繪只取頭部:放大對齊頭部、再往下挪一點(原圖比例 w/h≈0.46)
function Avatar({ source, size }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
      <Image source={source} style={{ width: size * 1.31, height: size * 2.86, marginLeft: -(size * 0.155), marginTop: -(size * 0.22) }} resizeMode="cover" />
    </View>
  );
}

const calcScore = (err) => Math.max(0, 100 - err * 20);

export default function Game() {
  const [phase, setPhase] = useState('home'); // home | setup | story | play | results
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [fraudType, setFraudType] = useState(null);

  const [conv, setConv] = useState(0);
  const [records, setRecords] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [wrongPicks, setWrongPicks] = useState([]);
  const [solved, setSolved] = useState(false);
  const [errors, setErrors] = useState([0, 0, 0]);
  const [autoPlay, setAutoPlay] = useState(false);

  // 教學引導
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(false);

  // 結果頁統計 / PR
  const [statsLoading, setStatsLoading] = useState(true);
  const [prValues, setPrValues] = useState([0, 0, 0, 0]);
  const [avgStats, setAvgStats] = useState(null);
  const submittedRef = useRef(false);

  const scrollRef = useRef(null);
  const autoTimer = useRef(null);
  // 教學 spotlight 目標
  const chatBoxRef = useRef(null);
  const mainBtnRef = useRef(null);
  const autoBtnRef = useRef(null);
  const skipBtnRef = useRef(null);

  const typeMeta = fraudType ? FRAUD_TYPES.find((t) => t.key === fraudType) : null;
  const scenarios = fraudType ? ALL_SCRIPTS[fraudType] : null;
  const scenario = scenarios ? scenarios[conv] : null;
  const script = scenario ? scenario.script : [];
  const correctText = scenario ? script[scenario.correctIndex].text : null;

  // 自動捲到底
  useEffect(() => {
    if (scrollRef.current) setTimeout(() => scrollRef.current.scrollToEnd({ animated: true }), 50);
  }, [records.length]);

  // 自動播放
  useEffect(() => {
    if (phase !== 'play' || !autoPlay) return;
    autoTimer.current = setInterval(() => {
      setIdx((prev) => {
        if (prev >= script.length) { clearInterval(autoTimer.current); setAutoPlay(false); return prev; }
        setRecords((r) => [...r, script[prev]]);
        const next = prev + 1;
        if (next >= script.length) { clearInterval(autoTimer.current); setAutoPlay(false); setTimeout(() => setShowQuestion(true), 400); }
        return next;
      });
    }, 1800);
    return () => clearInterval(autoTimer.current);
  }, [phase, autoPlay, script.length]);

  const resetConv = () => { setRecords([]); setIdx(0); setShowQuestion(false); setWrongPicks([]); setSolved(false); setAutoPlay(false); };

  const resetStats = () => { submittedRef.current = false; setStatsLoading(true); setPrValues([0, 0, 0, 0]); setAvgStats(null); };

  const pickType = (key) => { setFraudType(key); setConv(0); setErrors([0, 0, 0]); resetConv(); resetStats(); setPhase('story'); };

  const beginConversation = () => {
    resetConv();
    setPhase('play');
    if (conv === 0 && !tutorialSeen) setShowTutorial(true);
  };

  // 進入結果頁時:提交分數、計算 PR 與歷史平均(照搬網站邏輯,共用 Firebase)
  useEffect(() => {
    if (phase !== 'results' || submittedRef.current) return;
    submittedRef.current = true;
    (async () => {
      const sc = errors.map(calcScore);
      const overall = (sc[0] + sc[1] + sc[2]) / 3;
      try {
        // --- 讀取(QuizScore 允許任何人讀,不需登入)---
        const statRef = doc(db, 'QuizScore', 'ScoreStatistics');
        const snap = await getDoc(statRef);
        const data = snap.exists() ? snap.data() : {};
        const key = STAT_KEY[fraudType];
        const cur = data[key] || { playCount: 0, level1Score: 0, level2Score: 0, level3Score: 0, error1Count: 0, error2Count: 0, error3Count: 0 };
        // 含本次遊玩的投影值(用於顯示平均)
        const up = {
          playCount: cur.playCount + 1,
          level1Score: cur.level1Score + sc[0], level2Score: cur.level2Score + sc[1], level3Score: cur.level3Score + sc[2],
          error1Count: cur.error1Count + errors[0], error2Count: cur.error2Count + errors[1], error3Count: cur.error3Count + errors[2],
        };
        const pc = up.playCount || 1;
        setAvgStats({
          playCount: up.playCount,
          s: [round2(up.level1Score / pc), round2(up.level2Score / pc), round2(up.level3Score / pc), round2((up.level1Score + up.level2Score + up.level3Score) / (pc * 3))],
          e: [round2(up.error1Count / pc), round2(up.error2Count / pc), round2(up.error3Count / pc), round2((up.error1Count + up.error2Count + up.error3Count) / (pc * 3))],
        });

        // PR 值(對照歷史 scores 子集合的百分位)
        const scoresRef = collection(db, 'QuizScore', PR_DOC[fraudType], 'scores');
        const all = await getDocs(scoresRef);
        let pr = [50, 50, 50, 50];
        if (!all.empty) {
          const L = [[], [], [], []];
          all.forEach((d) => {
            const x = d.data();
            if (x.level1Score !== undefined) L[0].push(x.level1Score);
            if (x.level2Score !== undefined) L[1].push(x.level2Score);
            if (x.level3Score !== undefined) L[2].push(x.level3Score);
            if (x.overallScore !== undefined) L[3].push(x.overallScore);
          });
          pr = [singlePR(sc[0], L[0]), singlePR(sc[1], L[1]), singlePR(sc[2], L[2]), singlePR(overall, L[3])];
        }
        setPrValues(pr);

        // --- 寫入(需登入,盡力而為;失敗也不影響上方顯示)---
        try {
          if (!auth.currentUser) await signInAnonymously(auth);
          await setDoc(statRef, { ...data, [key]: up });
          await addDoc(scoresRef, { level1Score: sc[0], level2Score: sc[1], level3Score: sc[2], overallScore: overall, timestamp: new Date().toISOString(), errorCount: [...errors] });
        } catch (w) {
          console.warn('統計寫入失敗(僅顯示,不影響遊玩)', w);
        }
      } catch (e) {
        console.warn('結果統計失敗', e);
        setPrValues([0, 0, 0, 0]);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [phase]);

  const revealNext = () => {
    if (showQuestion || autoPlay) return;
    if (idx >= script.length) return;
    setRecords((r) => [...r, script[idx]]);
    const next = idx + 1;
    setIdx(next);
    if (next >= script.length) setTimeout(() => setShowQuestion(true), 400);
  };

  const skipAll = () => {
    if (showQuestion) return;
    clearInterval(autoTimer.current); setAutoPlay(false);
    setRecords(script.slice());
    setIdx(script.length);
    setTimeout(() => setShowQuestion(true), 300);
  };

  const toggleAuto = () => { if (showQuestion) return; setAutoPlay((p) => !p); };

  const onBubblePress = (entry) => {
    if (!showQuestion || solved || entry.character !== 'character1') return;
    if (entry.text === correctText) {
      setSolved(true);
      setTimeout(nextStage, 950);
    } else {
      if (!wrongPicks.includes(entry.text)) {
        setWrongPicks((w) => [...w, entry.text]);
        setErrors((e) => { const n = [...e]; n[conv] += 1; return n; });
      }
    }
  };

  const nextStage = () => {
    if (conv + 1 >= scenarios.length) { setPhase('results'); return; }
    setConv((c) => c + 1);
    resetConv();
    setPhase('story');
  };

  const restart = () => {
    setPhase('setup'); setFraudType(null); setConv(0); setErrors([0, 0, 0]);
    setNickname(''); setNicknameInput(''); resetConv(); resetStats();
  };

  // ===================== 中介首頁(遊戲入口) =====================
  if (phase === 'home') {
    const steps = [
      { n: '1', t: '選角色 + 挑一種詐騙類型', ic: 'scan', c: theme.primary },
      { n: '2', t: '讀對話,抓出詐騙的關鍵句', ic: 'warning', c: accents.method },
      { n: '3', t: '看分數、PR 值與防詐評等', ic: 'stats', c: accents.stats },
    ];
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.ghWrap} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.ghHero}>
          <RadarView size={168} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120)} style={styles.ghTitleWrap}>
          <Text style={styles.ghTitle}>詐騙測驗</Text>
          <Text style={styles.ghTitleEn}>SCAM SURVIVAL</Text>
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(200)} style={styles.ghTagline}>你能在關鍵時刻識破騙局嗎?</Animated.Text>

        <View style={styles.ghSteps}>
          {steps.map((s, i) => (
            <Animated.View key={s.n} entering={FadeInDown.delay(280 + i * 90)} style={styles.ghStep}>
              <View style={[styles.ghStepIcon, { backgroundColor: s.c + '22', borderColor: s.c + '66' }]}><Icon name={s.ic} size={20} color={s.c} /></View>
              <Text style={styles.ghStepText}>{s.t}</Text>
              <Text style={[styles.ghStepNo, { color: s.c }]}>{s.n}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(560)}>
          <Pressable style={styles.ghStart} onPress={() => setPhase('setup')} android_ripple={{ color: '#0003' }}>
            <Icon name="play" size={20} color="#15171C" />
            <Text style={styles.ghStartText}>開始挑戰</Text>
          </Pressable>
          <Text style={styles.ghFoot}>4 種詐騙類型 · 每類 3 個真實情境</Text>
        </Animated.View>
      </ScrollView>
    );
  }

  // ===================== 設定:角色 + 暱稱 + 類型 =====================
  if (phase === 'setup') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>詐騙測驗</Text>
        <Text style={styles.sub}>選好角色與暱稱,挑一種詐騙類型開始情境演練</Text>

        {/* 角色選擇 */}
        <View style={styles.sectionRow}><View style={styles.bar} /><Text style={styles.section}>選擇角色</Text></View>
        <View style={styles.avatarCarousel}>
          <Pressable style={styles.arrowBtn} onPress={() => setAvatarIdx((i) => (i - 1 + AVATARS.length) % AVATARS.length)} hitSlop={10}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon name="chevron" size={26} color={theme.text} />
            </View>
          </Pressable>
          <View style={styles.avatarWrap}>
            <Image source={AVATARS[avatarIdx]} style={styles.avatarImg} resizeMode="contain" />
          </View>
          <Pressable style={styles.arrowBtn} onPress={() => setAvatarIdx((i) => (i + 1) % AVATARS.length)} hitSlop={10}>
            <Icon name="chevron" size={26} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.dots}>
          {AVATARS.map((_, i) => <View key={i} style={[styles.dot, i === avatarIdx && styles.dotOn]} />)}
        </View>

        {/* 暱稱 */}
        <View style={styles.sectionRow}><View style={styles.bar} /><Text style={styles.section}>輸入暱稱</Text></View>
        <View style={styles.nicknameRow}>
          <TextInput
            style={styles.input}
            value={nicknameInput}
            onChangeText={setNicknameInput}
            placeholder="請輸入暱稱"
            placeholderTextColor={theme.textFaint}
            maxLength={10}
          />
          <Pressable
            style={[styles.confirmBtn, !nicknameInput.trim() && styles.btnDisabled]}
            disabled={!nicknameInput.trim()}
            onPress={() => setNickname(nicknameInput.trim())}
          >
            <Text style={styles.confirmBtnText}>確定</Text>
          </Pressable>
        </View>
        {!!nickname && <Text style={styles.nicknameOk}>目前暱稱:{nickname}</Text>}

        {/* 類型 */}
        <View style={styles.sectionRow}><View style={styles.bar} /><Text style={styles.section}>選擇詐騙類型</Text></View>
        {!nickname && <Text style={styles.hintText}>※ 請先確定暱稱才能選擇類型</Text>}
        {FRAUD_TYPES.map((t, i) => (
          <Animated.View key={t.key} entering={FadeInDown.delay(i * 60)}>
            <Pressable
              style={[styles.typeBtn, { borderColor: nickname ? t.accent + '99' : theme.border }, !nickname && styles.typeBtnDisabled]}
              disabled={!nickname}
              onPress={() => pickType(t.key)}
            >
              <View style={[styles.typeIcon, { backgroundColor: t.accent + '22', borderColor: t.accent + '66' }]}>
                <Icon name="warning" size={22} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeName}>{t.name}</Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
              <Icon name="chevron" size={20} color={nickname ? t.accent : theme.textFaint} />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    );
  }

  // ===================== 情境前導 =====================
  if (phase === 'story') {
    return (
      <View style={[styles.screen, styles.storyWrap]}>
        <Animated.View key={conv} entering={FadeInDown} style={styles.storyCard}>
          <Text style={[styles.storyTag, { color: typeMeta.accent }]}>【情境 {conv + 1} / {scenarios.length}】</Text>
          <Text style={styles.storyType}>{typeMeta.name}</Text>
          <Text style={styles.storyText}>{scenario.background}</Text>
          <Pressable style={[styles.primaryBtn, { backgroundColor: typeMeta.accent }]} onPress={beginConversation}>
            <Icon name="play" size={18} color="#15171C" />
            <Text style={styles.primaryBtnText}>開始測驗</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ===================== 對話遊戲 =====================
  if (phase === 'play') {
    const shownRecords = showTutorial ? SAMPLE_MSGS : records;
    const canTapAdvance = !showQuestion && !autoPlay && !showTutorial && idx < script.length;
    const tutSteps = [
      { ref: chatBoxRef, title: '對話區', text: '對方與你的對話會出現在這裡。點對話框「任何地方」就能顯示下一句。' },
      { ref: mainBtnRef, title: '繼續對話', text: '不想點對話框,也可以按這顆按鈕繼續下一句。' },
      { ref: autoBtnRef, title: '自動播放', text: '讓對話自動一句句播放,再按一次可暫停。' },
      { ref: skipBtnRef, title: '跳過對話', text: '想直接作答?一鍵顯示全部對話。' },
      { ref: chatBoxRef, title: '找出關鍵句', text: '對話結束後,在這裡點出「對方開始詐騙」的那句:答對變綠進下一關,答錯變紅並計一次錯誤。' },
    ];
    return (
      <ImageBackground source={BG[fraudType]} style={styles.screen} imageStyle={styles.bgImg}>
        <View style={styles.playScrim} pointerEvents="none" />

        {/* 進度 */}
        <View style={styles.playHeader}>
          <Text style={styles.playStage}>情境 {conv + 1} / {scenarios.length}</Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniFill, { width: `${(records.length / script.length) * 100}%`, backgroundColor: typeMeta.accent }]} />
          </View>
        </View>

        {/* 聊天視窗標頭(對方 + 上線中) */}
        <View style={styles.chatHeader}>
          <Avatar source={SCAMMER} size={42} />
          <View>
            <Text style={styles.chatHeaderName}>對方</Text>
            <Text style={styles.chatHeaderState}>🟢 上線中</Text>
          </View>
        </View>

        {/* 對話框:點任何地方都能繼續下一句 */}
        <Pressable ref={chatBoxRef} collapsable={false} style={styles.chatWrap} onPress={canTapAdvance ? revealNext : undefined}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
            {shownRecords.map((entry, i) => {
              const isScammer = entry.character === 'character1';
              const isWrong = wrongPicks.includes(entry.text);
              const isRight = solved && entry.text === correctText;
              return (
                <Animated.View key={i} entering={FadeInDown.duration(260)} style={[styles.msgRow, isScammer ? styles.rowLeft : styles.rowRight]}>
                  {isScammer && <Avatar source={SCAMMER} size={34} />}
                  <Pressable
                    onPress={() => {
                      if (showTutorial) return;
                      if (showQuestion) { if (isScammer && !solved) onBubblePress(entry); }
                      else if (canTapAdvance) revealNext();
                    }}
                    style={[
                      styles.bubble,
                      isScammer ? styles.bubbleLeft : [styles.bubbleRight, { backgroundColor: typeMeta.accent }],
                      isWrong && styles.bubbleWrong,
                      isRight && styles.bubbleRight2,
                    ]}
                  >
                    <Text style={[styles.bubbleText, !isScammer && { color: '#15171C' }]}>{entry.text}</Text>
                  </Pressable>
                  {!isScammer && <Avatar source={AVATARS[avatarIdx]} size={34} />}
                </Animated.View>
              );
            })}
            {!showTutorial && shownRecords.length === 0 && (
              <Text style={styles.tapHint}>點對話框任何地方開始對話 ▾</Text>
            )}
            {showQuestion && !solved && (
              <Animated.View entering={FadeIn} style={styles.questionBanner}>
                <Icon name="warning" size={18} color={theme.primary} />
                <Text style={styles.questionText}>請點選對方「開始進行詐騙」的關鍵句</Text>
              </Animated.View>
            )}
            {solved && (
              <Animated.View entering={FadeIn} style={[styles.questionBanner, { borderColor: typeMeta.accent }]}>
                <Text style={[styles.questionText, { color: typeMeta.accent }]}>✓ 答對了!進入下一階段…</Text>
              </Animated.View>
            )}
            <View style={{ height: 12 }} />
          </ScrollView>
        </Pressable>

        {/* 底部控制 */}
        {!showQuestion ? (
          <View style={styles.controls}>
            <Pressable ref={autoBtnRef} collapsable={false} style={styles.ctrlSmall} onPress={toggleAuto}>
              <Icon name={autoPlay ? 'scan' : 'play'} size={18} color={theme.text} />
              <Text style={styles.ctrlSmallText}>{autoPlay ? '暫停' : '自動'}</Text>
            </Pressable>
            <Pressable ref={mainBtnRef} collapsable={false} style={styles.ctrlMain} onPress={revealNext}>
              <Text style={styles.ctrlMainText}>{idx === 0 ? '開始對話' : '繼續對話'}</Text>
            </Pressable>
            <Pressable ref={skipBtnRef} collapsable={false} style={styles.ctrlSmall} onPress={skipAll}>
              <Icon name="chevron" size={18} color={theme.text} />
              <Text style={styles.ctrlSmallText}>跳過</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.controls}>
            <Text style={styles.errHint}>錯誤次數:{errors[conv]}</Text>
          </View>
        )}

        {showTutorial && (
          <SpotlightTutorial steps={tutSteps} accent={typeMeta.accent} onClose={() => { setShowTutorial(false); setTutorialSeen(true); }} />
        )}
      </ImageBackground>
    );
  }

  // ===================== 結果 =====================
  const scores = errors.map(calcScore);
  const total = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>測驗結果</Text>
      <Text style={styles.sub}>測驗類型:<Text style={{ color: typeMeta.accent, fontWeight: '800' }}>{typeMeta.name}</Text></Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>整體平均分數</Text>
        <Text style={[styles.totalNum, { color: typeMeta.accent }]}>{total}</Text>
        <Text style={styles.totalNote}>{total >= 90 ? '防詐意識極高!' : total >= 70 ? '表現不錯,再留意細節。' : total >= 50 ? '基本觀念有了,仍要更謹慎。' : '危險!容易被話術帶著走。'}</Text>
      </View>

      {[0, 1, 2].map((i) => (
        <ResultCard key={i} index={i} score={scores[i]} error={errors[i]} scenario={scenarios[i]} accent={typeMeta.accent} />
      ))}

      {/* 歷史平均 + PR 值統計 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{typeMeta.name} · 統計與 PR 值</Text>
        {statsLoading || !avgStats ? (
          <Text style={styles.statsLoadingText}>統計數據計算中…</Text>
        ) : (
          <>
            <View style={styles.statsHead}>
              <Text style={[styles.stCell, styles.stHeadText, { flex: 1.2 }]}>關卡</Text>
              <Text style={[styles.stCell, styles.stHeadText]}>平均錯誤</Text>
              <Text style={[styles.stCell, styles.stHeadText]}>歷史均分</Text>
              <Text style={[styles.stCell, styles.stHeadText]}>PR值</Text>
            </View>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.statsRow}>
                <Text style={[styles.stCell, styles.stCellText, { flex: 1.2 }]}>測驗 {i + 1}</Text>
                <Text style={[styles.stCell, styles.stCellText]}>{avgStats.e[i]}</Text>
                <Text style={[styles.stCell, styles.stCellText]}>{avgStats.s[i]}</Text>
                <Text style={[styles.stCell, styles.stPr, { color: prColor(prValues[i]) }]}>{prValues[i]}</Text>
              </View>
            ))}
            <View style={[styles.statsRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.stCell, styles.stCellText, { flex: 1.2, fontWeight: '800' }]}>整體</Text>
              <Text style={[styles.stCell, styles.stCellText]}>{avgStats.e[3]}</Text>
              <Text style={[styles.stCell, styles.stCellText]}>{avgStats.s[3]}</Text>
              <Text style={[styles.stCell, styles.stPr, { color: prColor(prValues[3]) }]}>{prValues[3]}</Text>
            </View>
            <Text style={styles.prNote}>
              PR 值表示你贏過多少百分比的玩家,PR80 代表勝過 80% 的人。{avgStats.playCount ? `目前累計遊玩 ${avgStats.playCount} 次。` : ''}
            </Text>
          </>
        )}
      </View>

      <Pressable style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 8 }]} onPress={restart}>
        <Icon name="radar" size={18} color="#15171C" />
        <Text style={styles.primaryBtnText}>再玩一次</Text>
      </Pressable>
    </ScrollView>
  );
}

// 結果卡:正面分數 / 翻面看對話回顧
function ResultCard({ index, score, error, scenario, accent }) {
  const [flip, setFlip] = useState(false);
  const correctText = scenario.script[scenario.correctIndex].text;
  return (
    <Animated.View entering={FadeInDown.delay(index * 120)} style={styles.resCard}>
      {!flip ? (
        <>
          <Text style={styles.resTitle}>測驗 {index + 1}</Text>
          <View style={styles.resScoreRow}>
            <View style={[styles.scoreRing, { borderColor: accent }]}>
              <Text style={[styles.scoreRingNum, { color: accent }]}>{score}</Text>
            </View>
            <View style={styles.resStats}>
              <Text style={styles.resStatNum}>{error}</Text>
              <Text style={styles.resStatLabel}>錯誤次數</Text>
            </View>
          </View>
          <View style={styles.tipsBox}>
            <Text style={styles.tipsLabel}>Tips</Text>
            <Text style={styles.tipsText}>{scenario.tips}</Text>
          </View>
          <Pressable style={[styles.reviewBtn, { borderColor: accent }]} onPress={() => setFlip(true)}>
            <Text style={[styles.reviewBtnText, { color: accent }]}>對話紀錄回顧</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.resTitle}>測驗 {index + 1} · 對話回顧</Text>
          <View style={styles.reviewChat}>
            {scenario.script.map((m, i) => {
              const isScammer = m.character === 'character1';
              const isKey = m.text === correctText;
              return (
                <View key={i} style={[styles.reviewRow, isScammer ? styles.rowLeft : styles.rowRight]}>
                  <View style={[styles.reviewBubble, isScammer ? styles.bubbleLeft : { backgroundColor: accent }, isKey && styles.bubbleRight2]}>
                    <Text style={[styles.reviewBubbleText, !isScammer && { color: '#15171C' }]}>{m.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Pressable style={[styles.reviewBtn, { borderColor: theme.border }]} onPress={() => setFlip(false)}>
            <Text style={[styles.reviewBtnText, { color: theme.textDim }]}>返回</Text>
          </Pressable>
        </>
      )}
    </Animated.View>
  );
}

// 教學引導:像網頁那樣,逐一對準畫面上實際功能的位置給說明(spotlight)
function SpotlightTutorial({ steps, accent, onClose }) {
  const [step, setStep] = useState(-1); // -1:先詢問是否觀看
  const [rect, setRect] = useState(null);
  const [overlayH, setOverlayH] = useState(Dimensions.get('window').height);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (step < 0) { setRect(null); return; }
    const t = steps[step];
    let tries = 0;
    const measure = () => {
      const node = t && t.ref && t.ref.current;
      const root = overlayRef.current;
      if (node && node.measureInWindow && root && root.measureInWindow) {
        // 量測 overlay 自身在視窗中的原點,扣掉它就能消除狀態列等偏移
        root.measureInWindow((ox, oy, ow, oh) => {
          if (oh) setOverlayH(oh);
          node.measureInWindow((x, y, w, h) => {
            if (w || h) setRect({ x: x - ox, y: y - oy, w, h });
            else if (tries++ < 6) setTimeout(measure, 60);
          });
        });
      } else if (tries++ < 6) setTimeout(measure, 60);
    };
    measure();
  }, [step]);

  if (step === -1) {
    return (
      <View style={styles.tutDim}>
        <Animated.View entering={FadeIn} style={styles.tutCard}>
          <View style={[styles.tutIcon, { backgroundColor: accent + '22', borderColor: accent + '66' }]}><Icon name="shield" size={34} color={accent} /></View>
          <Text style={styles.tutTitle}>是否要觀看教學引導?</Text>
          <Text style={styles.tutText}>第一次玩建議看一下各個功能的說明。</Text>
          <View style={styles.tutBtnRow}>
            <Pressable style={[styles.tutBtn, styles.tutBtnGhost]} onPress={onClose}><Text style={styles.tutBtnGhostText}>略過</Text></Pressable>
            <Pressable style={[styles.tutBtn, { backgroundColor: accent }]} onPress={() => setStep(0)}><Text style={styles.tutBtnText}>看教學</Text></Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  const t = steps[step];
  const last = step === steps.length - 1;
  const below = !rect || rect.y < overlayH * 0.5; // 目標在上半 → 提示放下方
  const tipPos = rect
    ? (below ? { top: Math.min(rect.y + rect.h + 14, overlayH - 200) } : { bottom: overlayH - rect.y + 14 })
    : { top: overlayH * 0.4 };

  return (
    <View ref={overlayRef} collapsable={false} style={StyleSheet.absoluteFill}>
      {/* 透明攔截層:擋住互動但不變暗 */}
      <View style={StyleSheet.absoluteFill} />
      {/* 周圍變暗、留下目標原亮度 → 目標按鈕「發亮」 */}
      {rect ? (
        <>
          <View style={[styles.tutDimBg, { position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(0, rect.y - 8) }]} pointerEvents="none" />
          <View style={[styles.tutDimBg, { position: 'absolute', left: 0, right: 0, top: rect.y + rect.h + 8, bottom: 0 }]} pointerEvents="none" />
          <View style={[styles.tutDimBg, { position: 'absolute', top: rect.y - 8, height: rect.h + 16, left: 0, width: Math.max(0, rect.x - 8) }]} pointerEvents="none" />
          <View style={[styles.tutDimBg, { position: 'absolute', top: rect.y - 8, height: rect.h + 16, left: rect.x + rect.w + 8, right: 0 }]} pointerEvents="none" />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.tutDimBg]} pointerEvents="none" />
      )}
      <Animated.View key={step} entering={FadeIn} style={[styles.tipCard, { borderColor: accent }, tipPos]}>
        <Text style={styles.tipTitle}>{t.title}</Text>
        <Text style={styles.tipText}>{t.text}</Text>
        <View style={styles.tipBar}>
          <Text style={styles.tipStep}>{step + 1} / {steps.length}</Text>
          <View style={styles.tipBtns}>
            <Pressable hitSlop={8} onPress={onClose}><Text style={styles.tipSkip}>跳過</Text></Pressable>
            <Pressable style={[styles.tipNext, { backgroundColor: accent }]} onPress={() => (last ? onClose() : setStep(step + 1))}>
              <Text style={styles.tipNextText}>{last ? '完成' : '下一步'}</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 18, paddingBottom: 40 },
  h1: { color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 4, marginBottom: 8 },

  // 中介首頁(遊戲入口)
  ghWrap: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 32 },
  ghHero: { alignItems: 'center' },
  ghTitleWrap: { alignItems: 'center', marginTop: 4 },
  ghTitle: { color: theme.text, fontSize: 34, fontWeight: '900', letterSpacing: 4 },
  ghTitleEn: { color: theme.primary, fontSize: 11, fontWeight: '800', letterSpacing: 6, marginTop: 3 },
  ghTagline: { color: theme.textDim, fontSize: 15, textAlign: 'center', marginTop: 12, marginBottom: 26 },
  ghSteps: { gap: 10, marginBottom: 28 },
  ghStep: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingVertical: 13, paddingHorizontal: 14 },
  ghStepIcon: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ghStepText: { flex: 1, color: theme.text, fontSize: 14.5, fontWeight: '600' },
  ghStepNo: { fontSize: 24, fontWeight: '900', opacity: 0.45 },
  ghStart: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 17, elevation: 4, shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  ghStartText: { color: '#15171C', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  ghFoot: { color: theme.textFaint, fontSize: 12, textAlign: 'center', marginTop: 14 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 14 },
  bar: { width: 4, height: 16, borderRadius: 2, backgroundColor: theme.primary, marginRight: 8 },
  section: { color: theme.text, fontSize: 17, fontWeight: '800' },
  hintText: { color: theme.textFaint, fontSize: 12, marginBottom: 10 },

  // 角色輪播
  avatarCarousel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrowBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  avatarWrap: { flex: 1, height: 200, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: 200 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.card },
  dotOn: { backgroundColor: theme.primary, width: 18 },

  // 暱稱
  nicknameRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14, color: theme.text, fontSize: 15, height: 48 },
  confirmBtn: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#15171C', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
  nicknameOk: { color: theme.primary, fontSize: 13, marginTop: 8, fontWeight: '700' },

  // 類型
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  typeBtnDisabled: { opacity: 0.45 },
  typeIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  typeName: { color: theme.text, fontSize: 16, fontWeight: '800' },
  typeDesc: { color: theme.textDim, fontSize: 12, marginTop: 3 },

  // 情境前導
  storyWrap: { justifyContent: 'center', padding: 22 },
  storyCard: { backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, padding: 24 },
  storyTag: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  storyType: { color: theme.textDim, fontSize: 13, marginBottom: 16 },
  storyText: { color: theme.text, fontSize: 17, lineHeight: 28, marginBottom: 24 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15, alignSelf: 'stretch' },
  primaryBtnText: { color: '#15171C', fontSize: 16, fontWeight: '800' },

  // 對話遊戲
  playHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  playStage: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  miniBar: { height: 5, borderRadius: 3, backgroundColor: theme.card, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 3 },

  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(29,32,38,0.82)', borderBottomWidth: 1, borderBottomColor: theme.border },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card },
  chatHeaderName: { color: theme.text, fontSize: 15, fontWeight: '800' },
  chatHeaderState: { color: theme.textDim, fontSize: 11, marginTop: 2 },

  chat: { flex: 1 },
  chatContent: { padding: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8, maxWidth: '100%' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.card },
  bubble: { maxWidth: '74%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleLeft: { backgroundColor: theme.cardHi, borderTopLeftRadius: 4 },
  bubbleRight: { borderTopRightRadius: 4 },
  bubbleWrong: { backgroundColor: 'rgba(229,83,75,0.85)' },
  bubbleRight2: { backgroundColor: '#3FBF7F' },
  bubbleText: { color: theme.text, fontSize: 15, lineHeight: 22 },

  questionBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primaryDim, borderWidth: 1, borderColor: theme.borderHi, borderRadius: 12, padding: 12, marginTop: 6 },
  questionText: { color: theme.primary, fontSize: 13.5, fontWeight: '700', flexShrink: 1, textAlign: 'center' },

  controls: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: theme.bgElevated, borderTopWidth: 1, borderTopColor: theme.border },
  ctrlSmall: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.card, borderRadius: 12, minWidth: 58, gap: 2 },
  ctrlSmallText: { color: theme.textDim, fontSize: 11, fontWeight: '700' },
  ctrlMain: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: theme.primary, borderRadius: 12 },
  ctrlMainText: { color: '#15171C', fontSize: 16, fontWeight: '800' },
  errHint: { flex: 1, textAlign: 'center', color: theme.textDim, fontSize: 14, fontWeight: '700' },

  // 結果
  totalCard: { backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, padding: 22, alignItems: 'center', marginTop: 16, marginBottom: 18 },
  totalLabel: { color: theme.textDim, fontSize: 13 },
  totalNum: { fontSize: 56, fontWeight: '900', marginVertical: 4 },
  totalNote: { color: theme.text, fontSize: 14 },

  resCard: { backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.border, padding: 18, marginBottom: 14 },
  resTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  resScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 14 },
  scoreRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgElevated },
  scoreRingNum: { fontSize: 30, fontWeight: '900' },
  resStats: { alignItems: 'flex-start' },
  resStatNum: { color: theme.text, fontSize: 28, fontWeight: '900' },
  resStatLabel: { color: theme.textDim, fontSize: 12 },
  tipsBox: { backgroundColor: theme.bgElevated, borderRadius: 12, padding: 14, marginBottom: 14 },
  tipsLabel: { color: theme.primary, fontSize: 12, fontWeight: '800', marginBottom: 5 },
  tipsText: { color: theme.text, fontSize: 13.5, lineHeight: 21 },
  reviewBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  reviewBtnText: { fontSize: 14, fontWeight: '800' },

  reviewChat: { marginBottom: 14 },
  reviewRow: { flexDirection: 'row', marginBottom: 8 },
  reviewBubble: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  reviewBubbleText: { color: theme.text, fontSize: 13, lineHeight: 19 },

  tapHint: { color: theme.textDim, fontSize: 14, textAlign: 'center', marginTop: 24, fontWeight: '600' },

  // 對話遊戲背景 / 角色舞台
  bgImg: { opacity: 0.5 },
  playScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,15,19,0.62)' },
  chatWrap: { flex: 1 },
  bubbleSpeaker: { fontSize: 10.5, fontWeight: '800', marginBottom: 2 },
  stage: { flexDirection: 'row', height: 132, paddingHorizontal: 10, alignItems: 'flex-end', justifyContent: 'space-between' },
  stageSide: { width: '34%', alignItems: 'center' },
  stageFig: { width: '100%', height: 122 },
  figActive: { opacity: 1 },
  figIdle: { opacity: 0.38 },
  nameTag: { marginTop: -6, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border },
  nameTagText: { color: theme.text, fontSize: 12, fontWeight: '800' },

  // 統計表
  statsCard: { backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 16 },
  statsTitle: { color: theme.text, fontSize: 15, fontWeight: '800', marginBottom: 12 },
  statsLoadingText: { color: theme.textDim, fontSize: 13, paddingVertical: 14, textAlign: 'center' },
  statsHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.borderHi, paddingBottom: 8, marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: theme.border },
  stCell: { flex: 1, textAlign: 'center', fontSize: 13 },
  stHeadText: { color: theme.textDim, fontWeight: '700', fontSize: 12 },
  stCellText: { color: theme.text },
  stPr: { fontWeight: '900', fontSize: 15 },
  prNote: { color: theme.textFaint, fontSize: 11.5, lineHeight: 17, marginTop: 12 },

  // 教學引導:起始詢問卡
  tutDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  tutCard: { backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.borderHi, padding: 24, alignItems: 'center', width: '100%' },
  tutIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 14 },
  tutTitle: { color: theme.text, fontSize: 19, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  tutText: { color: theme.textDim, fontSize: 14.5, lineHeight: 23, textAlign: 'center' },
  tutBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  tutBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  tutBtnText: { color: '#15171C', fontSize: 15, fontWeight: '800' },
  tutBtnGhost: { backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border },
  tutBtnGhostText: { color: theme.textDim, fontSize: 15, fontWeight: '700' },

  // 教學引導:定點說明(周圍變暗,目標按鈕保持原亮 → 發亮效果,不用框)
  tutDimBg: { backgroundColor: 'rgba(0,0,0,0.4)' },
  tipCard: { position: 'absolute', left: 16, right: 16, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1.5, padding: 18 },
  tipTitle: { color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  tipText: { color: theme.text, fontSize: 17, lineHeight: 27 },
  tipBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  tipStep: { color: theme.textFaint, fontSize: 14, fontWeight: '700' },
  tipBtns: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tipSkip: { color: theme.textDim, fontSize: 15, fontWeight: '700' },
  tipNext: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  tipNextText: { color: '#15171C', fontSize: 15, fontWeight: '800' },
});
