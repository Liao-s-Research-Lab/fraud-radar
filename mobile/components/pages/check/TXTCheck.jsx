  import React, { useState,useEffect } from "react";
  import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,Animated } from "react-native";
  import { MaterialIcons } from "@expo/vector-icons";
  import Rating from "./Rating";
  import API from "../../../config/api";

  const TXTCheck = ({ close }) => {
    const [text, setText] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [ID, setID] = useState("");
    const [pythonResult, setPythonResult] = useState("未知");
    const [keywords, setKeywords] = useState([]);
    const [type, setType] = useState("");
    const [fraudRate, setFraudRate] = useState(0);
    const [reminds, setReminds] = useState("");
    const [prevents, setPrevents] = useState("");
    const [isHidden, setIsHidden] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDetect = async () => {
      setLoading(true);
      setModalVisible(true);
      setIsHidden(true);
      try {
        const response = await fetch(API.fetchContent, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          mode: "cors",
        });

        const data = await response.json();
        
        if (data.pythonResult) {
          setID(data.ID);
          const matchedKeywords = data.pythonResult.Match || [];
          const extractedKeywords = matchedKeywords.map((item) => item.MatchKeyword);
          const extractedTypes = matchedKeywords.map((item) => item.MatchType);
          const extractedReminds = matchedKeywords.map((item) => item.Remind);
          const extractedPrevents = matchedKeywords.map((item) => item.Prevent);

          setPythonResult(data.pythonResult.FraudResult || "未知");
          setKeywords(extractedKeywords);
          setType(extractedTypes.join(", "));
          setReminds(extractedReminds.join(", "));
          setPrevents(extractedPrevents.join(", "));

          const fraudRate = parseFloat(data.pythonResult.FraudRate);
          setFraudRate(Math.round(fraudRate * 100) / 100);
        }
        setModalVisible(true);
      } catch (error) {
        // console.error("错误:", error);
        setPythonResult("连接服务器时出现错误");
      }finally {
        setLoading(false); // 结束 Loading，切换到结果画面
      }
    };


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



    return (
      <View>
      <View style={[styles.container, isHidden && { opacity: 0 }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialIcons name="edit" size={24} color="black" />
            <Text style={styles.headerTitle}>文字檢測</Text>
          </View>
          <TouchableOpacity onPress={close}>
            <MaterialIcons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>
          你可以在底下的方框中，貼入您想要檢測的文字，可以是對話、新聞、簡訊內容。
        </Text>

        <TextInput
          style={styles.input}
          placeholder="請輸入文字..."
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical='top'
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.detectButton} onPress={handleDetect}>
            <Text style={styles.buttonText}>檢測</Text>
          </TouchableOpacity>
        </View>

        
      </View>
      <View>
      <Modal visible={modalVisible} transparent animationType="fade">
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>請稍後</Text>
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
                      close={close}
                    />
                  )}
                </View>
              </View>
      </Modal> 
    </View>
    </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#F3F3F3",
      borderRadius: 20,
      maxHeight: 450,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginLeft: 5,
    },
    description: {
      fontSize: 14,
      color: "#888",
      marginBottom: 10,
    },
    input: {
      height: 250,
      borderColor: "",
      backgroundColor: "#FFFFFF",
      borderWidth: 0.5,
      borderRadius: 20,
      padding: 10,
      marginBottom: 20,

    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      position: "absolute",
      bottom: 20,
      left: 20,
    },
    detectButton: {
      backgroundColor: "#444444",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 30,
      alignItems: "center",
      marginTop: 10,
    },
    closeButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "#444444",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 30,
      alignItems: "center",
      marginTop: 10,
      marginRight: 10,
      marginLeft: 135,
    },
    buttonText: {
      color: "#FFF",
      fontWeight: "bold",
    },
    cancelText: {
      color: "#444444",
      fontWeight: "bold",
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
      marginBottom: -15,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    dot: {
      fontSize: 50,
      marginHorizontal: 2,
      color: 'black',
    },
  });

  export default TXTCheck;
