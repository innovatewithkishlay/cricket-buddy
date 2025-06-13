import React, { useRef, useEffect } from "react";
import { Animated, StyleSheet, View, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Loader() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.overlay}>
      <BlurView intensity={12} style={styles.blur} tint="dark" />
      <Animated.View style={styles.iconContainer}>
        <MaterialCommunityIcons name="cricket" size={64} color="#FFD700" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  iconContainer: {
    position: "absolute",
    alignSelf: "center",
    top: "45%",
    transform: [{ translateY: -32 }],
  },
});
