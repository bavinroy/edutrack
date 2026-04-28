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
import StaffBottomNav from "../../components/StaffBottomNav";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

export default function StaffDashboard() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [nextClass, setNextClass] = useState<any>(null);
  const [advisory, setAdvisory] = useState<any>(null);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [badges, setBadges] = useState<any>({});

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [profRes, reqRes, nextRes, advRes, badgeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/staff/profile/`, { headers }),
        axios.get(`${API_BASE_URL}/api/request/staff/list/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/academic/schedule/upcoming/`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/academic/class-advisors/my_advisory/`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/accounts/badges/`, { headers }).catch(() => ({ data: {} }))
      ]);

      const profData = profRes.data;
      if (profData.avatar && !profData.avatar.startsWith("http")) {
        profData.avatar = `${API_BASE_URL}${profData.avatar}`;
      }
      setProfile(profData);

      const pendingReqs = (reqRes.data || []).filter((r: any) => r.staff_status === 'pending');
      setRequests(pendingReqs);

      if (nextRes && nextRes.status === 200) setNextClass(nextRes.data);
      if (advRes && advRes.status === 200 && advRes.data.assigned) setAdvisory(advRes.data);
      
      setBadges(badgeRes.data);
    } catch (err) {
      console.error("Staff dashboard fetch error", err);
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
        <Text style={[styles.loaderText, { color: themeColors.subText }]}>Initializing Faculty Portal...</Text>
      </View>
    );
  }

  const staffName = profile?.first_name || profile?.username || "Staff Member";
  const deptName = profile?.department?.toUpperCase() || "DEPARTMENT";
  const designation = profile?.designation || "Faculty Member";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      {/* Premium Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <View style={styles.branding}>
           <Text style={[styles.headerTitle, { color: themeColors.text }]}>EduTrack <Text style={{color: '#6366F1'}}>Staff</Text></Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setShowBurgerMenu(true)}>
          <Ionicons name="apps-outline" size={28} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      {/* Burger Menu Layer */}
      {showBurgerMenu && (
        <>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowBurgerMenu(false)} />
          <View style={[styles.burgerDropdown, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownHeaderTitle, { color: themeColors.text }]}>Quick Menu</Text>
              <TouchableOpacity onPress={() => setShowBurgerMenu(false)}>
                <Ionicons name="close" size={24} color={themeColors.subText} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowBurgerMenu(false); handleNav("/staff/profile"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#6366F115' }]}><Ionicons name="person-outline" size={18} color="#6366F1" /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowBurgerMenu(false); handleNav("/staff/settings"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#8B5CF615' }]}><Ionicons name="settings-outline" size={18} color="#8B5CF6" /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowBurgerMenu(false); handleNav("/staff/developer_info"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#10B98115' }]}><Ionicons name="code-slash" size={18} color="#10B981" /></View>
              <Text style={[styles.dropdownText, { color: themeColors.text }]}>Developer Info</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <TouchableOpacity style={styles.dropdownItem} onPress={async () => { await AsyncStorage.clear(); router.replace("/"); }}>
              <View style={[styles.dropdownIconBox, { backgroundColor: '#FEE2E2' }]}><Ionicons name="log-out-outline" size={18} color="#EF4444" /></View>
              <Text style={[styles.dropdownText, { color: "#EF4444" }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollBody} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]} />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#1E293B' : '#6366F1' }]}>
          <View style={styles.profileMain}>
            <View style={styles.profileTexts}>
              <Text style={styles.profileGreeting}>Welcome back,</Text>
              <Text style={styles.profileName}>{staffName}</Text>
              <Text style={styles.profileDept}>{deptName} • {profile?.designation || "Faculty Member"}</Text>
            </View>
            <TouchableOpacity onPress={() => handleNav("/staff/profile")}>
               {profile?.avatar ? (
                 <Image source={{ uri: profile.avatar }} style={styles.profileImg} />
               ) : (
                 <View style={styles.avatarPlaceholder}>
                   <Ionicons name="person" size={24} color="#6366F1" />
                 </View>
               )}
            </TouchableOpacity>
          </View>
          
          <View style={[styles.profileDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          
          <View style={styles.metricsRow}>
             <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{requests.length || '0'}</Text>
                <Text style={styles.metricLab} numberOfLines={1}>PENDING REQS</Text>
             </View>
             <View style={[styles.metricItem, { flex: 1.5 }]}>
                <Text style={styles.metricVal} numberOfLines={1}>{advisory ? advisory.class_name : "N/A"}</Text>
                <Text style={styles.metricLab} numberOfLines={1}>ADV. CLASS</Text>
             </View>
             <View style={styles.metricItem}>
                <Text style={styles.metricVal}>Active</Text>
                <Text style={styles.metricLab} numberOfLines={1}>STATUS</Text>
             </View>
          </View>
        </View>

        {/* Action Center Title */}
        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: themeColors.text }]}>FACULTY COMMAND CENTER</Text>
           <TouchableOpacity onPress={() => handleNav("/staff/notice")}>
             <Text style={styles.seeAll}>See Notices</Text>
           </TouchableOpacity>
        </View>

        {/* Priority Card: Next Session */}
        <TouchableOpacity 
          style={[styles.sessionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => handleNav("/staff/my_schedule")}
        >
          <View style={[styles.cardTag, { backgroundColor: '#6366F1' }]}>
            <Text style={styles.cardTagText}>UPCOMING SESSION</Text>
          </View>
          <View style={styles.sessionMain}>
            <View style={[styles.sessionIcon, { backgroundColor: '#6366F115' }]}>
              <MaterialCommunityIcons name="clock-fast" size={32} color="#6366F1" />
            </View>
            <View style={styles.sessionInfo}>
               {nextClass ? (
                 <>
                   <Text style={[styles.sessionSubj, { color: themeColors.text }]}>{nextClass.subject}</Text>
                   <Text style={[styles.sessionTime, { color: themeColors.subText }]}>{nextClass.class_name} • {nextClass.time}</Text>
                   <View style={styles.sessionFooter}>
                      <TouchableOpacity style={styles.actionPill} onPress={() => handleNav("/staff/attendance")}>
                        <Ionicons name="finger-print" size={14} color="#fff" />
                        <Text style={styles.actionPillText}>Take Attendance</Text>
                      </TouchableOpacity>
                   </View>
                 </>
               ) : (
                 <Text style={[styles.noSession, { color: themeColors.subText }]}>No more scheduled sessions for today.</Text>
               )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Main Service Grid */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 30 }]}>SERVICES & TOOLS</Text>
        <View style={styles.servicesGrid}>
          {[
            { id: 1, name: 'Timetable', icon: 'calendar', route: '/staff/timetable', color: '#8B5CF6', tag: 'Master' },
            { id: 2, name: 'My Schedule', icon: 'clock', route: '/staff/my_schedule', color: '#6366F1' },
            { id: 3, name: 'Attendance', icon: 'user-check', route: '/staff/attendance', color: '#10B981', tag: 'Live' },
            { id: 4, name: 'Requests', icon: 'envelope-open-text', route: '/staff/requests', color: '#F59E0B', count: requests.length },
            { id: 5, name: 'Study Materials', icon: 'book', route: '/staff/documents', color: '#3B82F6', count: badges.materials },
            { id: 6, name: 'Notice Board', icon: 'bullhorn', route: '/staff/notice', color: '#EF4444', count: badges.notices },
            { id: 7, name: 'Bulk Ops', icon: 'file-upload', route: '/staff/bulk_upload', color: '#EC4899' },
            { id: 8, name: 'My Class', icon: 'users', route: advisory ? `/staff/my_students?department=${advisory.department}&year=${advisory.year}&className=${advisory.class_name}` : '/staff/my_students', color: '#64748B', hide: !advisory },
            { id: 9, name: 'Dept Students', icon: 'user-graduate', route: '/staff/my_students', color: '#0EA5E9' },
          ].filter(s => !s.hide).map(service => (
            <TouchableOpacity 
              key={service.id} 
              style={[styles.serviceItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => handleNav(service.route)}
            >
              <View style={[styles.serviceIconWrap, { backgroundColor: `${service.color}15` }]}>
                <FontAwesome5 name={service.icon} size={22} color={service.color} />
              </View>
              <Text style={[styles.serviceName, { color: themeColors.text }]}>{service.name}</Text>
              {service.tag && (
                <View style={[styles.serviceTag, { backgroundColor: service.color }]}>
                  <Text style={styles.serviceTagText}>{service.tag}</Text>
                </View>
              )}
              {service.count !== undefined && service.count > 0 && (
                <View style={[styles.serviceBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.serviceBadgeText}>{service.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Insights Placeholder */}
        <View style={[styles.advisoryBanner, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: themeColors.border }]}>
           <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
           <Text style={[styles.advisoryText, { color: themeColors.text }]}>
             {advisory ? `You are the Class Advisor for ${advisory.class_name}` : "Reach out to Admin for Class Advisor assignments."}
           </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 15, fontSize: 14, fontWeight: "600" },
  
  header: { 
     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
     paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1
  },
  branding: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
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
  profileGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  profileName: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  profileDept: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginTop: 4, opacity: 0.8 },
  profileImg: { width: 60, height: 60, borderRadius: 20, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  profileDivider: { height: 1.5, borderRadius: 1, marginVertical: 20 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  metricItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  metricVal: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  metricLab: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  seeAll: { fontSize: 13, color: '#6366F1', fontWeight: '700' },

  sessionCard: { borderRadius: 26, padding: 20, borderWidth: 1, marginBottom: 10, elevation: 1, overflow: 'hidden' },
  cardTag: { position: 'absolute', top: 0, right: 20, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  cardTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  sessionMain: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  sessionIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionSubj: { fontSize: 18, fontWeight: '800' },
  sessionTime: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  sessionFooter: { marginTop: 15 },
  actionPill: { backgroundColor: '#6366F1', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  noSession: { fontSize: 14, fontWeight: '500', fontStyle: 'italic' },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  serviceItem: {
    width: (width - 55) / 2,
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
  },
  serviceIconWrap: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  serviceName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  serviceTag: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  serviceTagText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  serviceBadge: { position: 'absolute', top: 10, right: 12, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  serviceBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  advisoryBanner: { 
    flexDirection: 'row', alignItems: 'center', gap: 15, padding: 18, borderRadius: 20, 
    marginTop: 25, borderWidth: 1, borderStyle: 'dashed' 
  },
  advisoryText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2999 },
  burgerDropdown: {
    position: 'absolute', top: 60, right: 20, borderRadius: 24, padding: 8, width: 240,
    zIndex: 3000, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, borderWidth: 1,
  },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, marginBottom: 5 },
  dropdownHeaderTitle: { fontSize: 15, fontWeight: '800' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16 },
  dropdownIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dropdownText: { marginLeft: 12, fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 8, opacity: 0.5 },
});
