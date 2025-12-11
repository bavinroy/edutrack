// app/index.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require(".././assets/images/background.jpeg")} // ✅ adjust path
        resizeMode="stretch"
        style={styles.background}
      >
        <View style={styles.centeredContent}>
          {/* Logo */}
          <Image
            source={require(".././assets/images/logo.jpeg")} // ✅ adjust path
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
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
