import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNav = (path: string) => {
    setLoading(true); // show loader
    setTimeout(() => {
      setLoading(false);
      router.push(path as any);
    }, 800); // ⏳ 0.8s delay before navigating
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
      {/* 🔹 Loader Overlay */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#00B9BD" />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      )}

      {/* 🔹 Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#00B9BD" />
        <Text style={styles.headerTitle}>EDU TRACK</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => handleNav("/student/notifications")}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color="orange"
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNav("/student/chat")}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="orange"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 Main Menu Buttons */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNav("/student/fees")}
        >
          <Text style={styles.menuText}>FEE'S & TERMS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNav("/student/time table")}
        >
          <Text style={styles.menuText}>TIME TABLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNav("/student/documents")}
        >
          <Text style={styles.menuText}>MATERIAL'S</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNav("/student/results")}
        >
          <Text style={styles.menuText}>RESULTS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNav("/student/letter")}
        >
          <Text style={styles.menuText}>FORM'S</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleNav("/student/requests")}
        >
          <Text style={styles.menuText}>REQUEST</Text>
        </TouchableOpacity>

        
      </View>

      {/* 🔹 Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => handleNav("/student/dashboard")}>
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/search")}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/notice")}>
          <Ionicons name="desktop-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/downloads")}>
          <Ionicons name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/profile")}>
          <Ionicons name="person-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  // 🔹 Loader Overlay
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loaderText: {
    marginTop: 10,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
    fontSize: 30,
    marginLeft: 30,
    fontWeight: "bold",
    color: "#00B9BD",
  },
  headerIcons: {
    flexDirection: "row",
  },
  icon: {
    marginLeft: 15,
  },

  // 🔹 Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  // 🔹 Menu
  menu: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  menuButton: {
    width: "80%",
    paddingVertical: 15,
    backgroundColor: "#30e4de",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // 🔹 Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#30e4de",
    paddingVertical: 12,
  },
});
