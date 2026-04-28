import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { API_BASE_URL } from "../config";
import AdminBottomNav from "../../components/AdminBottomNav";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    pendingLetters: 0,
    identityRequests: 0,
    activeNotices: 0,
    totalDepartments: 0
  });
  const [badges, setBadges] = useState<any>({});
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

      const headers = { Authorization: `Bearer ${token}` };

      const results = await Promise.all([
        axios.get(`${API_BASE_URL}/api/staff/profile/`, { headers }).catch(e => {
          console.error("DEBUG: Profile Fetch Error:", e.response?.status, e.config?.url);
          return { data: profile || {} };
        }),
        axios.get(`${API_BASE_URL}/api/accounts/request/principal/list/`, { headers }).catch(e => {
          console.error("DEBUG: Requests Fetch Error:", e.response?.status, e.config?.url);
          return { data: [] };
        }),
        axios.get(`${API_BASE_URL}/api/accounts/account-request/list/`, { headers }).catch(e => {
          console.error("DEBUG: Identity Fetch Error:", e.response?.status, e.config?.url);
          return { data: [] };
        }),
        axios.get(`${API_BASE_URL}/api/accounts/notice/list/`, { headers }).catch(e => {
          console.error("DEBUG: Notice Fetch Error:", e.response?.status, e.config?.url);
          return { data: [] };
        }),
        axios.get(`${API_BASE_URL}/api/accounts/departments/`, { headers }).catch(e => {
          console.error("DEBUG: Depts Fetch Error:", e.response?.status, e.config?.url);
          return { data: [] };
        }),
        axios.get(`${API_BASE_URL}/api/accounts/badges/`, { headers }).catch(e => {
          return { data: {} };
        })
      ]);

      const [profRes, lettersRes, accountsRes, noticesRes, deptsRes, badgeRes] = results;

      if (profRes && profRes.data) {
        const profData = profRes.data;
        if (profData.avatar && !profData.avatar.startsWith("http")) {
          profData.avatar = `${API_BASE_URL}${profData.avatar}`;
        }
        setProfile(profData);
      }

      setStats({
        pendingLetters: Array.isArray(lettersRes.data) ? lettersRes.data.filter((r: any) => (r.principal_status || 'pending') === 'pending').length : 0,
        identityRequests: Array.isArray(accountsRes.data) ? accountsRes.data.filter((r: any) => r.status === 'PENDING' || r.status === 'pending').length : 0,
        activeNotices: Array.isArray(noticesRes.data) ? noticesRes.data.length : 0,
        totalDepartments: Array.isArray(deptsRes.data) ? deptsRes.data.length : (profRes.data.total_departments || 0)
      });

      setBadges(badgeRes?.data || {});

    } catch (err) {
      console.error("Admin dashboard critical error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
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

  const adminName = profile?.first_name || profile?.username || "Admin";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <View style={styles.branding}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>EduTrack <Text style={{ color: '#6366F1' }}>Admin</Text></Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setShowBurgerMenu(true)}>
          <Ionicons name="apps-outline" size={28} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      {/* Menu Layer */}
      {showBurgerMenu && (
        <>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowBurgerMenu(false)} />
          <View style={[styles.burgerDropdown, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownHeaderTitle, { color: themeColors.text }]}>Menu</Text>
              <TouchableOpacity onPress={() => setShowBurgerMenu(false)}>
                <Ionicons name="close" size={24} color={themeColors.subText} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowBurgerMenu(false); handleNav("/admin/profile"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#6366F115' }]}><Ionicons name="person-outline" size={18} color="#6366F1" /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowBurgerMenu(false); handleNav("/admin/django_admin"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#8B5CF615' }]}><Ionicons name="settings-outline" size={18} color="#8B5CF6" /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>System Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowBurgerMenu(false); handleNav("/admin/settings"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#10B98115' }]}><Ionicons name="options-outline" size={18} color="#10B981" /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowBurgerMenu(false); handleNav("/admin/developer_info"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#6366F115' }]}><Ionicons name="code-slash-outline" size={18} color="#6366F1" /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Developer Info</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <TouchableOpacity style={styles.dropdownItem} onPress={async () => { await AsyncStorage.clear(); router.replace("/"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#FEE2E2' }]}><Ionicons name="log-out-outline" size={18} color="#EF4444" /></View>
              <Text style={[styles.dropdownText, { color: "#EF4444" }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]} />}
      >
        {/* Profile Summary Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#1E293B' : '#6366F1' }]}>
          <View style={styles.profileMain}>
            <View style={styles.profileTexts}>
              <Text style={styles.profileGreeting}>Welcome,</Text>
              <Text style={styles.profileName}>{adminName}</Text>
              <Text style={styles.profileDept}>Principal</Text>
            </View>
            <TouchableOpacity onPress={() => handleNav("/admin/profile")}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.profileImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={28} color="#6366F1" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.profileDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{stats.pendingLetters}</Text>
              <Text style={styles.metricLab} numberOfLines={1}>PENDING LETTERS</Text>
            </View>
            <View style={[styles.metricItem, { flex: 1.5 }]}>
              <Text style={styles.metricVal}>{stats.identityRequests}</Text>
              <Text style={styles.metricLab} numberOfLines={1}>REGISTER REQUESTS</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{stats.totalDepartments}</Text>
              <Text style={styles.metricLab} numberOfLines={1}>DEPARTMENTS</Text>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Admin Overview</Text>
          <TouchableOpacity onPress={() => handleNav("/admin/notice")}>
            <Text style={styles.seeAll}>Notices</Text>
          </TouchableOpacity>
        </View>

        {/* Action Card: Pending Tasks */}
        {(stats.pendingLetters > 0 || stats.identityRequests > 0) ? (
          <TouchableOpacity
            style={[styles.sessionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => handleNav("/admin/requests")}
          >
            <View style={[styles.cardTag, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.cardTagText}>PENDING APPROVALS</Text>
            </View>
            <View style={styles.sessionMain}>
              <View style={[styles.sessionIcon, { backgroundColor: '#EF444415' }]}>
                <MaterialCommunityIcons name="alert-circle" size={32} color="#EF4444" />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionSubj, { color: themeColors.text }]}>Action Required</Text>
                <Text style={[styles.sessionTime, { color: themeColors.subText }]}>
                  {stats.pendingLetters} Letter Approvals • {stats.identityRequests} New Accounts
                </Text>
                <View style={styles.sessionFooter}>
                  <TouchableOpacity style={[styles.actionPill, { backgroundColor: '#EF4444' }]} onPress={() => handleNav("/admin/requests")}>
                    <Ionicons name="chevron-forward-circle" size={14} color="#fff" />
                    <Text style={styles.actionPillText}>Review Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.sessionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderStyle: 'dashed' }]}>
            <View style={styles.sessionMain}>
              <View style={[styles.sessionIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="checkmark-done-circle" size={32} color="#10B981" />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionSubj, { color: themeColors.text }]}>All Caught Up</Text>
                <Text style={[styles.sessionTime, { color: themeColors.subText }]}>No pending requests to approve right now.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Management Grid */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 30 }]}>Administrative Tools</Text>
        <View style={{ marginTop: 15 }}>
          <View style={styles.servicesGrid}>
            {[
              { id: 1, name: 'Departments', icon: 'building', route: '/admin/departments', color: '#6366F1' },
              { id: 2, name: 'Requests', icon: 'list', route: '/admin/requests', color: '#F59E0B', count: stats.pendingLetters + stats.identityRequests },
              { id: 3, name: 'Notice Board', icon: 'bullhorn', route: '/admin/notice', color: '#EF4444', count: badges?.notices || 0 },
              { id: 4, name: 'Documents', icon: 'folder-open', route: '/admin/documents', color: '#475569', count: badges?.materials || 0 },
              { id: 5, name: 'Attendance', icon: 'chart-bar', route: '/admin/attendance_report', color: '#B45309' },
              { id: 6, name: 'Time Table', icon: 'calendar-alt', route: '/admin/timetable', color: '#3b82f6' },
              { id: 7, name: 'Bulk Upload', icon: 'file-upload', route: '/admin/bulk_upload', color: '#EC4899' },
              { id: 8, name: 'Staff List', icon: 'users', route: '/admin/staff_list', color: '#8B5CF6' },
              { id: 9, name: 'Student List', icon: 'user-graduate', route: '/admin/student_list', color: '#f97316' },
              { id: 10, name: 'Dept Admins', icon: 'user-shield', route: '/admin/dept_admin_list', color: '#10B981' },
              { id: 11, name: 'Add User', icon: 'user-plus', route: '/admin/create_user', color: '#6366F1' },
              { id: 12, name: 'System Admin', icon: 'cogs', route: '/admin/django_admin', color: '#64748b' },
            ].map(service => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                onPress={() => handleNav(service.route)}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: `${service.color}15` }]}>
                  <FontAwesome5 name={service.icon} size={22} color={service.color} />
                </View>
                <Text style={[styles.serviceName, { color: themeColors.text }]}>{service.name}</Text>
                {service.count !== undefined && service.count > 0 && (
                  <View style={[styles.serviceBadge, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.serviceBadgeText}>{service.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Global Alert */}
        <View style={[styles.advisoryBanner, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: themeColors.border }]}>
          <MaterialCommunityIcons name="information" size={24} color="#6366F1" />
          <Text style={[styles.advisoryText, { color: themeColors.text }]}>
            You are logged in as the Principal. Your actions affect the entire institution. Please review all requests carefully.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <AdminBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 15, fontSize: 13, fontWeight: "900", letterSpacing: 2 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1
  },
  branding: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -1 },
  menuBtn: { padding: 4 },

  scrollBody: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 20 },

  profileCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15,
  },
  profileMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileTexts: { flex: 1 },
  profileGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  profileName: { color: '#ffffff', fontSize: 22, fontWeight: '900', marginTop: 2 },
  profileDept: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  profileImg: { width: 64, height: 64, borderRadius: 22, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  profileDivider: { height: 1.5, borderRadius: 1, marginVertical: 20 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  metricItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  metricVal: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  metricLab: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  seeAll: { fontSize: 12, color: '#6366F1', fontWeight: '800' },

  sessionCard: { borderRadius: 26, padding: 22, borderWidth: 1, marginBottom: 10, elevation: 2, overflow: 'hidden' },
  cardTag: { position: 'absolute', top: 0, right: 20, paddingHorizontal: 12, paddingVertical: 5, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  cardTagText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  sessionMain: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  sessionIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionSubj: { fontSize: 18, fontWeight: '900' },
  sessionTime: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  sessionFooter: { marginTop: 15 },
  actionPill: { backgroundColor: '#6366F1', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionPillText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  serviceItem: {
    width: (width - 55) / 2,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  serviceIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  serviceName: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  serviceBadge: { position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  serviceBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  advisoryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 24,
    marginTop: 25, borderWidth: 1, borderStyle: 'dashed'
  },
  advisoryText: { fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 18 },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2999 },
  burgerDropdown: {
    position: 'absolute', top: 60, right: 20, borderRadius: 24, padding: 10, width: 250,
    zIndex: 3000, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, borderWidth: 1,
  },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, marginBottom: 5 },
  dropdownHeaderTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16 },
  dropdownIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dropdownText: { marginLeft: 14, fontSize: 14, fontWeight: '800' },
  divider: { height: 1, marginVertical: 8, opacity: 0.5 },
});
