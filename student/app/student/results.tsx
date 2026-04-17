import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

export default function StudentResult() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Academic Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.cardSubtitle}>Semester Performance</Text>
          <Text style={styles.cardTitle}>Results Center</Text>
        </View>

        <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="time-outline" size={48} color="#F59E0B" />
          </View>
          <Text style={[styles.comingTitle, { color: themeColors.text }]}>Results Pending</Text>
          <Text style={[styles.comingText, { color: themeColors.subText }]}>
            Official semester results are currently being processed by the controller of examinations.
          </Text>

        </View>

        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E2937' : '#EFF6FF' }]}>
          <Ionicons name="bulb-outline" size={18} color="#3B82F6" />
          <Text style={styles.tipText}>You will receive a notification the moment results are published.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },

  scrollBody: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },

  welcomeCard: {
    backgroundColor: '#6366F1',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  cardTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 5 },

  comingSoonCard: { borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  iconBox: { width: 80, height: 80, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  comingTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  comingText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 25 },

  pulseContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginRight: 8 },
  pulseText: { fontSize: 10, fontWeight: '800', color: '#F59E0B', letterSpacing: 0.5 },

  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 20, gap: 12 },
  tipText: { flex: 1, fontSize: 12, color: '#3B82F6', fontWeight: '600', lineHeight: 18 },
});
