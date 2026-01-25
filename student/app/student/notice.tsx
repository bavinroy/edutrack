import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { API_BASE_URL } from "../config";

type Notice = {
  id: number;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  author_name: string;
  acknowledgements_count: number;
};

export default function StudentNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Fetch notices
  const fetchNotices = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/notice/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notices");
      const data: Notice[] = await res.json();
      if (Array.isArray(data)) {
        setNotices(data);
      } else {
        setNotices([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const renderNotice = ({ item }: { item: Notice }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        {item.author_name} • {new Date(item.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.content}>{item.content}</Text>
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#30e4de" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f9fc" }}>
      {/* 🔹 Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setShowMenu(!showMenu)}
      >
        <Ionicons name="arrow-back" size={22} color="#30e4de" />
        <Text style={styles.headerTitle}>NOTICES BOARD</Text>
        <Ionicons
          name={showMenu ? "chevron-up" : "chevron-down"}
          size={22}
          color="#30e4de"
        />
      </TouchableOpacity>

      {/* 🔹 Dropdown Menu */}
      {showMenu && (
        <View style={styles.menuBox}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/fees")}
          >
            <Ionicons name="cash-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Fees</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/results")}
          >
            <Ionicons name="ribbon-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Results</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/time table")}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Time Table</Text>
          </TouchableOpacity>
        </View>
      )}


      <FlatList
        data={notices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotice}
        contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons
          name="home"
          size={24}
          color={pathname === "/student/dashboard" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/student/dashboard")}
        />
        <Ionicons
          name="search"
          size={24}
          color={pathname === "/student/search" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/student/search")}
        />
        <Ionicons
          name="desktop-outline"
          size={24}
          color={pathname === "/student/notice" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/student/notice")}
        />
        <Ionicons
          name="download-outline"
          size={24}
          color={pathname === "/student/downloads" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/student/downloads")}
        />
        <Ionicons
          name="person-circle-outline"
          size={24}
          color={pathname === "/student/profile" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/student/profile")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de" },
  menuBox: {
    backgroundColor: "#eff4f4",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 5,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "80%",
    backgroundColor: "#30e4de",
    borderRadius: 8,
    marginVertical: 6,
    justifyContent: "center",
  },
  menuText: { color: "#fff", fontSize: 16, marginLeft: 8, fontWeight: "600" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#333" },
  card: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },


  title: { fontSize: 16, fontWeight: "bold", color: "#222" },
  meta: { fontSize: 12, color: "#666", marginBottom: 8 },
  content: { fontSize: 14, marginBottom: 8, color: "#333" },
  image: { width: "100%", height: 180, borderRadius: 10, marginBottom: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#30e4de",
    paddingVertical: 12,
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
  },
});
