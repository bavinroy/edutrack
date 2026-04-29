import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  
  // Animation Values
  const bodyAnim = useRef(new Animated.Value(-height)).current;
  const earthAnim = useRef(new Animated.Value(-height)).current;
  const capAnim = useRef(new Animated.Value(-height)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pure Vertical Drop Sequence
    Animated.sequence([
      Animated.delay(400),
      
      // 1. Body Drops (Bottom)
      Animated.timing(bodyAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),

      // 2. Earth Drops (Middle)
      Animated.timing(earthAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      // 3. Cap Drops (Top)
      Animated.timing(capAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),

      // 4. Final Text Reveal
      Animated.timing(textFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),

      Animated.delay(1800),
    ]).start(async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const role = await AsyncStorage.getItem("userRole");

        if (token && role) {
          switch (role.toUpperCase()) {
            case "SUPER_ADMIN":
            case "PRINCIPAL":
              router.replace("./admin/dashboard");
              break;
            case "DEPT_ADMIN":
              router.replace("./dept_admin/dashboard");
              break;
            case "DEPT_STAFF":
              router.replace("./staff/dashboard");
              break;
            case "DEPT_STUDENT":
              router.replace("./student/dashboard");
              break;
            default:
              router.replace("./login");
          }
        } else {
          router.replace("./login");
        }
      } catch (e) {
        router.replace("./login");
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.content}>
        
        <View style={styles.logoWrapper}>
          
          {/* Layer 1: The Cap (Top) */}
          <Animated.View style={[styles.sliceContainer, { height: 72, transform: [{ translateY: capAnim }], zIndex: 10 }]}>
             <Image 
                source={require("../assets/images/logo.png")} 
                style={[styles.logoImage, { marginTop: 0 }]} 
                resizeMode="contain" 
             />
          </Animated.View>

          {/* Layer 2: The Earth (Middle) */}
          <Animated.View style={[styles.sliceContainer, { height: 60, transform: [{ translateY: earthAnim }], zIndex: 5, marginTop: -2 }]}>
             <Image 
                source={require("../assets/images/logo.png")} 
                style={[styles.logoImage, { marginTop: -72 }]} 
                resizeMode="contain" 
             />
          </Animated.View>

          {/* Layer 3: The Body (Bottom) */}
          <Animated.View style={[styles.sliceContainer, { height: 75, transform: [{ translateY: bodyAnim }], zIndex: 1, marginTop: -2 }]}>
             <Image 
                source={require("../assets/images/logo.png")} 
                style={[styles.logoImage, { marginTop: -132 }]} 
                resizeMode="contain" 
             />
          </Animated.View>

          {/* Text Reveal */}
          <Animated.View style={[styles.textContainer, { opacity: textFade }]}>
            <Text style={styles.title}>EduTrack</Text>
            <Text style={styles.subtitle}>Smart Education Platform</Text>
          </Animated.View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },
  sliceContainer: {
    width: 200,
    overflow: 'hidden',
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  textContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#000",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 2,
    marginTop: 6,
    textTransform: "uppercase",
  },
});
