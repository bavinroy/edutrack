import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import StaffBottomNav from "../../components/StaffBottomNav";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";

export default function StaffChat() {
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={theme.colors.onSurface}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 🔹 Coming Soon Content */}
      <View style={styles.centerContent}>
        <View style={styles.iconBox}>
          <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.comingText}>Coming Soon...</Text>
        <Text style={styles.subText}>
          Stay tuned! The interactive chat features will be available soon.
        </Text>
      </View>

      {/* 🔹 Bottom Navigation */}
      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.onSurface,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 50
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primaryContainer + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  comingText: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: theme.colors.outline,
    textAlign: "center",
    lineHeight: 22
  },
});
