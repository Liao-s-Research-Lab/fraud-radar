import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Modal, Animated } from 'react-native';
import Rating from './Rating';
import API from '../../../config/api';
//import BottomTabs from '../../app/(tabs)/BottomTabs'; // 导入底部导航栏

export default function MSGCheck() {
  const [text, setText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ID, setID] = useState('');
  const [pythonResult, setPythonResult] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [type, setType] = useState('');
  const [reminds, setReminds] = useState('');
  const [prevents, setPrevent] = useState('');
  const [fraudRate, setFraudRate] = useState('');

  // 动画数值
  const dot1 = useState(new Animated.Value(0))[0];
  const dot2 = useState(new Animated.Value(0))[0];
  const dot3 = useState(new Animated.Value(0))[0];

  // 启动动画
  useEffect(() => {
    if (loading) {
      const bounce = (dot) => {
        return Animated.sequence([ 
          Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]);
      };

      Animated.loop(
        Animated.stagger(200, [bounce(dot1), bounce(dot2), bounce(dot3)])
      ).start();
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [loading]);

  const handleSubmit = async () => {
    setLoading(true);
    setModalVisible(true); // 显示 Loading 窗口

    try {
      const response = await fetch(API.fetchContent, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        mode: 'cors',
      });

      const data = await response.json();

      if (data.pythonResult) {
        setID(data.ID);
        const matchedKeywords = data.pythonResult.Match || [];
        const extractedKeywords = matchedKeywords.map((item) => item.MatchKeyword);
        const extractedTypes = matchedKeywords.map((item) => item.MatchType);
        const extractedReminds = matchedKeywords.map((item) => item.Remind);
        const extractedPrevents = matchedKeywords.map((item) => item.Prevent);

        setPythonResult(data.pythonResult.FraudResult || '未知');
        setKeywords(extractedKeywords);
        setType(extractedTypes.join(', '));
        setReminds(extractedReminds.join(', '));
        setPrevent(extractedPrevents.join(', '));

        const fraudRate = parseFloat(data.pythonResult.FraudRate);
        setFraudRate(Math.round(fraudRate * 100) / 100);
      }
    } catch (error) {
      console.error('错误:', error);
      setPythonResult('连接服务器时出现错误');
    } finally {
      setLoading(false); // 结束 Loading，切换到结果画面
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>输入文字</Text>
      <TextInput
        style={styles.input}
        placeholder="在这里输入文字"
        value={text}
        onChangeText={setText}
      />
      <Button title="提交" onPress={handleSubmit} />

      {/* 弹出窗口（Loading + 结果） */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>请稍候</Text>
                <View style={styles.dotsContainer}>
                  <Animated.Text style={[styles.dot, { transform: [{ translateY: dot1 }] }]}>.</Animated.Text>
                  <Animated.Text style={[styles.dot, { transform: [{ translateY: dot2 }] }]}>.</Animated.Text>
                  <Animated.Text style={[styles.dot, { transform: [{ translateY: dot3 }] }]}>.</Animated.Text>
                </View>
              </View>
            ) : (
              <Rating
                onClose={() => setModalVisible(false)}
                ID={ID}
                pythonResult={pythonResult}
                keywords={keywords}
                types={type}
                fraudRate={fraudRate}
                reminds={reminds}
                prevents={prevents}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* 添加底部导航栏 <BottomTabs /> */}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 8,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明背景
  },
  modalContainer: {
    width: 200,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    fontSize: 30,
    marginHorizontal: 2,
    color: 'black',
  },
});
