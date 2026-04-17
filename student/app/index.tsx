// app/index.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require(".././assets/images/background.jpeg")} // ✅ adjust path
      resizeMode="stretch"
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          {/* Logo */}
          <Image
            source={require(".././assets/images/logo.png")} // ✅ using transparent logo
            style={styles.logo}
            resizeMode="contain"
          />



          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("./login")}
          >
            <Text style={styles.buttonText}>GET STARTED</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  background: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  centeredContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00B9BD",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#00B9BD",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
