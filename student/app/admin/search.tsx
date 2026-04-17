// app/admin/search.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

export default function AdminSearchPlaceholder() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Search</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.illustration, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
            <Ionicons name="search" size={80} color="#6366F120" />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>Coming Soon</Text>
          <Text style={[styles.desc, { color: themeColors.subText }]}>
            We are working on a powerful search tool to help you find students and staff members in seconds.
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#6366F1' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.actionText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  illustration: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  desc: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 40, fontWeight: '600' },
  actionBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20, elevation: 8, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});
