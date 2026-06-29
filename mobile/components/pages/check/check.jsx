import React, { useRef, useCallback } from "react";
import { View, Text, Animated, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import MSGCheck from "./MSGCheck"; 

const { width, height } = Dimensions.get("window"); // 獲取螢幕尺寸

const Stack = createStackNavigator();

const AnimatedOption = ({ text, animatedStyle, onPress }) => (
  <Animated.View style={[styles.option, animatedStyle]}>
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.optionText}>{text}</Text>
    </TouchableOpacity>
  </Animated.View>
);

const Check = () => {
  const navigation = useNavigation(); // 獲取導航對象

  const option1Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const option2Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const option3Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const opacity1 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const opacity3 = useRef(new Animated.Value(0)).current;

  const startAnimation = () => {
    option1Anim.setValue({ x: 0, y: 0 });
    option2Anim.setValue({ x: 0, y: 0 });
    option3Anim.setValue({ x: 0, y: 0 });

    opacity1.setValue(0);
    opacity2.setValue(0);
    opacity3.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(option1Anim, { toValue: { x: width * 0, y: height * -0.15 }, duration: 500, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(opacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(option2Anim, { toValue: { x: width * -0.25, y: height * 0.1 }, duration: 500, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(opacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(option3Anim, { toValue: { x: width * 0.25, y: height * 0.1 }, duration: 500, useNativeDriver: true })
      ]),
    ]).start();
  };

  useFocusEffect(
    useCallback(() => {
      startAnimation();
    }, [])
  );

  const goToMSGCheck = () => {
    navigation.navigate("MSGCheck"); // 跳轉到 MSGCheck 頁面
  };

  return (
    <View style={styles.container}>
      <AnimatedOption text="選項 1" animatedStyle={{ transform: option1Anim.getTranslateTransform(), opacity: opacity1 }} onPress={goToMSGCheck} />
      <AnimatedOption text="選項 2" animatedStyle={{ transform: option2Anim.getTranslateTransform(), opacity: opacity2 }} />
      <AnimatedOption text="選項 3" animatedStyle={{ transform: option3Anim.getTranslateTransform(), opacity: opacity3 }} />
    </View>
  );
};

function CheckStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="CheckMain" 
        component={Check} 
        options={{ unmountOnBlur: true }} 
      />
      <Stack.Screen name="MSGCheck" component={MSGCheck} />
    </Stack.Navigator>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  option: {
    position: "absolute",
    width: 100,
    height: 100,
    backgroundColor: "#333",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CheckStack;
