import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function StudentResult() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⏳ simulate small loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNav = (path: string) => {
    router.push(path as any);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#30e4de" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/back.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#00B9BD"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.headerIcons}>
        </View>
      </View>

      {/* 🔹 Coming Soon Content */}
      <View style={styles.centerContent}>
        <Ionicons name="time-outline" size={70} color="#30e4de" />
        <Text style={styles.comingText}>Coming Soon...</Text>
        <Text style={styles.subText}>
          Stay tuned! chat section will be available soon.
        </Text>
      </View>

      {/* 🔹 Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons
          name="home"
          size={24}
          color="#fff"
          onPress={() => handleNav("/student/dashboard")}
        />
        <Ionicons
          name="search"
          size={24}
          color="#fff"
          onPress={() => handleNav("/student/search")}
        />
        <Ionicons
          name="grid-outline"
          size={24}
          color="#fff"
          onPress={() => handleNav("/student/dashboard")}
        />
        <Ionicons
          name="download-outline"
          size={24}
          color="#fff"
          onPress={() => handleNav("/student/downloads")}
        />
        <Ionicons
          name="person-circle-outline"
          size={24}
          color="#fff"
          onPress={() => handleNav("/student/profile")}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  // 🔹 Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#30e4de",
    fontWeight: "600",
  },

  // 🔹 Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00B9BD",
  },
  headerIcons: {
    flexDirection: "row",
  },
  icon: {
    marginLeft: 15,
  },

  // 🔹 Content
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  comingText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#30e4de",
    marginTop: 10,
  },
  subText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginHorizontal: 30,
  },

  // 🔹 Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#30e4de",
    paddingVertical: 12,
  },
});
