import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import EduLoading from "../../components/EduLoading";
import StaffBottomNav from "../../components/StaffBottomNav";
import { theme } from "../theme";

export default function StaffSearchScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⏳ simulate small loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <EduLoading size={60} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <View style={styles.centerContent}>
        <View style={styles.iconCircle}>
          <Ionicons name="search" size={64} color={theme.colors.primary} />
        </View>
        <Text style={styles.comingText}>Search Coming Soon</Text>
        <Text style={styles.subText}>
          We are building a powerful search tool to help you find students, documents, and notices instantly.
        </Text>
      </View>

      <StaffBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  headerBtn: { padding: 5 },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100, // accommodate bottom nav
  },
  iconCircle: {
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryContainer + '40',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 30
  },
  comingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.onSurface,
    marginBottom: 15,
    textAlign: 'center'
  },
  subText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 24
  },
});
