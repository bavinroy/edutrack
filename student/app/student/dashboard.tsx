import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { API_BASE_URL } from "../config";
import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

export default function StudentDashboard() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [badges, setBadges] = useState<any>({});

  // Settings State
  const [showCGPA, setShowCGPA] = useState(false);
  const [showAttendance, setShowAttendance] = useState(true);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      syncSettings();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;
      
      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, badgeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/student/dashboard/`, { headers }),
        axios.get(`${API_BASE_URL}/api/accounts/badges/`, { headers }).catch(() => ({ data: {} }))
      ]);
      
      setProfileData(dashRes.data);
      setBadges(badgeRes.data);
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
      if (err.response?.status === 401) {
        router.replace("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const syncSettings = async () => {
    try {
      const cgpa = await AsyncStorage.getItem("@settings_show_cgpa");
      if (cgpa !== null) setShowCGPA(cgpa === "true");
      else setShowCGPA(false);

      const att = await AsyncStorage.getItem("@settings_show_attendance");
      if (att !== null) setShowAttendance(att === "true");
      else setShowAttendance(true);
    } catch (e) { }
  };

  const handleNav = (path: string) => {
    router.push(path as any);
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: themeColors.bg }]}>
        <EduLoading size={80} />
        <Text style={[styles.loaderText, { color: themeColors.subText }]}>Loading Dashboard...</Text>
      </View>
    );
  }

  const studentName = profileData?.name || profileData?.first_name || "Student";
  const studentYear = profileData?.year;
  const validYear = studentYear !== null && studentYear !== undefined ? studentYear : "-";

  const studentCgpa = profileData?.cgpa;
  const validCgpa = studentCgpa !== null && studentCgpa !== undefined ? studentCgpa : null;

  const studentAtt = profileData?.attendance;
  const validAtt = studentAtt !== null && studentAtt !== undefined ? studentAtt : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>EDU TRACK</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setShowBurgerMenu(!showBurgerMenu)}>
            <Ionicons name="menu-outline" size={32} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {showBurgerMenu && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowBurgerMenu(false)}
          />
          <View style={[styles.burgerDropdown, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setShowBurgerMenu(false); handleNav("/student/settings"); }}
            >
              <View style={[styles.dropdownIconBox, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}><Ionicons name="settings-outline" size={18} color={themeColors.subText} /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setShowBurgerMenu(false); handleNav("/student/privacy_policy"); }}
            >
              <View style={[styles.dropdownIconBox, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}><Ionicons name="shield-checkmark-outline" size={18} color={themeColors.subText} /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Privacy and Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setShowBurgerMenu(false); handleNav("/student/feedback"); }}
            >
              <View style={[styles.dropdownIconBox, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}><Ionicons name="chatbubble-outline" size={18} color={themeColors.subText} /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setShowBurgerMenu(false); handleNav("/student/developer_info"); }}
            >
              <View style={[styles.dropdownIconBox, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}><Ionicons name="code-slash-outline" size={18} color={themeColors.subText} /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Developer Info</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeSubtitle}>Welcome back,</Text>
          <Text style={styles.welcomeTitle}>{studentName}</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="school-outline" size={24} color="#10B981" />
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{validYear}</Text>
            <Text style={styles.metricLabel}>Current Year</Text>
          </View>

          {showCGPA && (
            <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Ionicons name="stats-chart-outline" size={24} color="#6366F1" />
              {validCgpa ? (
                <Text style={[styles.metricValue, { color: themeColors.text }]}>{validCgpa}</Text>
              ) : (
                <Text style={styles.metricMissingText}>CGPA not updated contact your faculty</Text>
              )}
              <Text style={styles.metricLabel}>CGPA</Text>
            </View>
          )}

          {showAttendance && (
            <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
              {validAtt ? (
                <Text style={[styles.metricValue, { color: themeColors.text }]}>{validAtt}%</Text>
              ) : (
                <Text style={styles.metricMissingText}>No attendance data available yet.</Text>
              )}
              <Text style={styles.metricLabel}>Attendance</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Quick actions</Text>
        <View style={styles.actionGrid}>
          {[
            { icon: 'time-outline', name: 'Time Table', route: '/student/timetable', color: '#8B5CF6' },
            { icon: 'document-text-outline', name: 'Materials', route: '/student/documents', color: '#10B981', count: badges.materials },
            { icon: 'trophy-outline', name: 'Results', route: '/student/results', color: '#F59E0B' },
            { icon: 'wallet-outline', name: 'Fee Details', route: '/student/fees', color: '#EF4444' },
            { icon: 'mail-open-outline', name: 'Requests', route: '/student/requests', color: '#3B82F6', count: badges.requests },
            { icon: 'megaphone-outline', name: 'Notices', route: '/student/notice', color: '#EC4899', count: badges.notices },
            { icon: 'list-circle-outline', name: 'Forms', route: '/student/letter', color: '#6366F1' },
          ].map((action, idx) => (
            <TouchableOpacity key={idx} style={[styles.actionBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => handleNav(action.route)}>
              <View style={[styles.actionIconBox, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
                {action.count !== undefined && action.count > 0 && (
                  <View style={[styles.serviceBadge, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.serviceBadgeText}>{action.count}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.actionText, { color: themeColors.subText }]}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <StudentBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 15, fontSize: 14, fontWeight: "600" },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerIcons: { flexDirection: "row" },

  scrollBody: { paddingHorizontal: 20, paddingBottom: 100 },

  welcomeCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  welcomeSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  welcomeTitle: { color: '#ffffff', fontSize: 28, fontWeight: '800', marginTop: 5 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15, marginBottom: 25 },
  metricCard: {
    borderRadius: 20,
    padding: 20,
    width: (width - 55) / 2,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    alignItems: 'flex-start',
    borderWidth: 1
  },
  metricValue: { fontSize: 24, fontWeight: '800', marginTop: 15 },
  metricLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginTop: 5 },
  metricMissingText: { fontSize: 8, color: '#9CA3AF', textAlign: 'center', marginBottom: 5, paddingHorizontal: 5 },

  burgerDropdown: {
    position: 'absolute',
    top: 60,
    right: 20,
    borderRadius: 20,
    padding: 6,
    width: 200,
    zIndex: 3000,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  dropdownIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dropdownText: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: '700',
  },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
  actionBtn: {
    width: (width - 70) / 3,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    borderWidth: 1,
    marginBottom: 10
  },
  actionIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  serviceBadge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1, borderColor: '#fff' },
  serviceBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' }
});
