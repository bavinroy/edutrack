import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function StaffDashboard() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNav = (path: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(path as any);
    }, 800);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
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
        <Ionicons name="arrow-back" size={24} color="#00B9BD" onPress={() => router.push("/login")} />
        <Text style={styles.headerTitle}>EDU TRACK</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => handleNav("/staff/notifications")}>
            <Ionicons name="notifications-outline" size={22} color="orange" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNav("/staff/chat")}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="orange" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 Menu Buttons */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/staff/documents")}>
          <Text style={styles.menuText}>UPLOAD MATERIALS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/staff/time table")}>
          <Text style={styles.menuText}>UPLOAD TIMETABLE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/staff/notice")}>
          <Text style={styles.menuText}>NOTICE BOARD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/staff/requests")}>
          <Text style={styles.menuText}>MANAGE REQUESTS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/staff/bulk_upload")}>
          <Text style={styles.menuText}>BULK UPLOAD STUDENTS</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => handleNav("/staff/dashboard")}>
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/staff/search")}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/staff/notice")}>
          <Ionicons name="desktop-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/staff/documents")}>
          <Ionicons name="document-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/staff/profile")}>
          <Ionicons name="person-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00B9BD",
    marginLeft: 10,
  },
  headerIcons: { flexDirection: "row" },
  icon: { marginLeft: 15 },

  // Menu
  menu: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
  menuButton: {
    width: "80%",
    paddingVertical: 15,
    backgroundColor: "#30e4de",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#30e4de",
    paddingVertical: 12,
  },
});
