import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

export default function StudentSearch() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { isDark, theme: themeColors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: themeColors.bg }]}>
        <EduLoading size={60} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Global Search</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchBox}>
            <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="search" size={20} color={themeColors.subText} />
                <TextInput 
                    placeholder="Search people, documents, events..." 
                    style={[styles.searchInput, { color: themeColors.text }]} 
                    placeholderTextColor={themeColors.subText}
                    editable={false}
                />
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody}>
            <View style={[styles.comingCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={[styles.iconOrb, { backgroundColor: isDark ? '#374151' : '#F5F3FF' }]}>
                    <Ionicons name="flask-outline" size={40} color="#6366F1" />
                </View>
                <Text style={[styles.comingTitle, { color: themeColors.text }]}>Search Lab</Text>
                <Text style={[styles.comingText, { color: themeColors.subText }]}>
                    Our engineering team is building a high-speed indexed search engine for the portal. 
                    Soon you'll find anything across the institution in milliseconds.
                </Text>
                <View style={[styles.progressLine, { width: '80%', backgroundColor: themeColors.border }]}>
                    <View style={styles.progressFill} />
                </View>
                <Text style={styles.progressText}>V2.0 DEVELOPMENT: 85%</Text>
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

  searchBox: { paddingHorizontal: 24, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15, height: 52, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },

  scrollBody: { paddingHorizontal: 24, alignItems: 'center' },
  comingCard: { borderRadius: 28, padding: 30, alignItems: 'center', borderWidth: 1, width: '100%', marginTop: 20 },
  iconOrb: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  comingTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  comingText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  
  progressLine: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', width: '85%', backgroundColor: '#6366F1' },
  progressText: { fontSize: 10, fontWeight: '800', color: '#6366F1', marginTop: 10, letterSpacing: 1 }
});
