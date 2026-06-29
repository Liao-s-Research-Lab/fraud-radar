import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // 导入图片选择器
import Rating from "./Rating";
import API from "../../../config/api";

const IMGCheck = ({ close }) => {
  const [imageUri, setImageUri] = useState(null);
  const [file, setFile] = useState(null); // 存储上传的文件
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

  // 选择图片的函数
  const pickImage = async () => {
    // 请求访问相册权限
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("你必須授權才能選擇圖片！");
      return;
    }
  
    // 打开图片选择器
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!pickerResult.cancelled) {
      const { uri, type } = pickerResult; // 提取 uri 和 type
      console.log('選擇的圖片 uri:', uri); // 確認是否正確獲得 uri
      console.log('圖片的類型:', type); // 確認是否正確獲得 type
      setImageUri(uri); // 保存选择的图片 URI
      setFile({
        uri: uri,
        name: 'image.jpg', // 設置文件名
        type: type || 'image/jpeg', // 使用圖片類型或默認類型
      }); // 保存文件數據
    }
  };
  

  // 上传图片并发送给后端
  const handleDetect = async () => {
    if (!file) {
      alert("请先选择图片！");
      return;
    }

    setLoading(true);
    setModalVisible(true);
    setIsHidden(true);

    try {
        const formData = new FormData();
    
        // 使用 file.type 获取文件类型
        const fileType = file.type || "image/jpeg";  // 如果没有返回 type, 默认使用 image/jpeg
        const fileName = 'upload.jpg';

        // 後端用 formData.getAll('files[]') 取檔,欄位名必須是 files[]
        formData.append("files[]", {
          uri: file.uri,
          name: fileName,
          type: fileType,
        });
        console.log(file.type);  // 打印文件類型
        console.log(file.uri);  // 查看 URI
        console.log(formData)

      const response = await fetch(API.fetchContent, {
        method: "POST",
        body: formData,
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

    } catch (error) {
      console.error("错误:", error);
      setPythonResult("连接服务器时出现错误");
    } finally {
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
        {/* 顶部标题和关闭按钮 */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialIcons name="image" size={24} color="black" />
            <Text style={styles.headerTitle}>圖片檢測</Text>
          </View>
          <TouchableOpacity onPress={close}>
            <MaterialIcons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* 图片上传区域 */}
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {!imageUri ? (
              <View style={styles.uploadContent}>
                <MaterialIcons name="cloud-upload" size={40} color="lightgray" />
                <Text style={styles.uploadText}>點擊選擇圖片</Text>
              </View>
            ) : (
              <Image source={{ uri: imageUri }} style={styles.image} />
            )}
          </TouchableOpacity>
        </View>

        {/* 底部按钮容器 */}
        <View style={styles.buttonContainer}>
        
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={handleDetect}>
            <Text style={styles.buttonText}>上傳</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 模态框 */}
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
    width: 340,
    maxHeight: 380,
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
  uploadContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  uploadBox: {
    width: "100%",
    height: 230,
    borderWidth: 2,
    borderColor: "#CCC", // 边框颜色
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  uploadContent: {
    alignItems: "center",
  },
  uploadText: {
    color: "lightgray",
    fontWeight: "bold",
    marginTop: 10,
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  uploadButton: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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

export default IMGCheck;
