// app/dept_admin/timetable.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

const { width } = Dimensions.get("window");

type SavedTimetable = {
  id: number;
  title: string;
  class_name: string;
  section: string;
  year: string;
  created_at: string;
  status: 'draft' | 'pending_verification' | 'published' | 'rejected';
  staff_name?: string;
};

export default function DeptAdminTimetable() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/view/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimetables(data);
      }
    } catch (e) {
      console.log("Fetch error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVerify = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/${id}/verify/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' })
      });
      if (res.ok) {
        Alert.alert("Authorized", "Schedule has been officiated and published.");
        fetchTimetables();
      } else {
        const data = await res.json();
        Alert.alert("Execution Error", data.error || "Verification failed.");
      }
    } catch (e) {
      Alert.alert("Network Fault", "Could not reach gateway.");
    }
  };

  const handleReject = async (id: number) => {
    Alert.prompt(
      "Rejection Protocol",
      "Draft the reason for schedule rejection:",
      [
        { text: "Abort", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason: string | undefined) => {
            try {
              const token = await AsyncStorage.getItem("accessToken");
              const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/${id}/verify/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', reason })
              });
              if (res.ok) {
                Alert.alert("Rejected", "Entity returned to draft status.");
                fetchTimetables();
              }
            } catch (e) {
              Alert.alert("Error", "Action failed.");
            }
          }
        }
      ]
    );
  };

  const getStatusMeta = (s: string) => {
    switch (s) {
      case 'published': return { color: '#10B981', icon: 'shield-check' };
      case 'pending_verification': return { color: '#F59E0B', icon: 'shield-sync' };
      case 'rejected': return { color: '#EF4444', icon: 'shield-off' };
      default: return { color: '#6366F1', icon: 'shield-outline' };
    }
  };

  const renderItem = ({ item }: { item: SavedTimetable }) => {
    const meta = getStatusMeta(item.status);
    return (
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title || "Standard Registry"}</Text>
            <Text style={[styles.cardSubtitle, { color: themeColors.subText }]}>{item.class_name} • Sec {item.section} (Year {item.year})</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.color + '15' }]}>
            <MaterialCommunityIcons name={meta.icon as any} size={12} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>
              {item.status.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
          <View style={styles.authorBox}>
            <View style={[styles.avatar, { backgroundColor: '#6366F115' }]}>
                <Text style={styles.avatarTxt}>{item.staff_name ? item.staff_name[0] : 'S'}</Text>
            </View>
            <View>
                <Text style={[styles.facultyRole, { color: themeColors.subText }]}>FACULTY</Text>
                <Text style={[styles.facultyName, { color: themeColors.text }]}>{item.staff_name || "Faculty Member"}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            {item.status === 'pending_verification' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF444415' }]} onPress={() => handleReject(item.id)}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B98115' }]} onPress={() => handleVerify(item.id)}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366F115' }]} onPress={() => router.push({ pathname: "/dept_admin/timetable_view", params: { id: item.id } } as any)}>
                <Ionicons name="eye-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Schedules</Text>
          <Text style={[styles.headerSub, { color: themeColors.subText }]}>ADMINISTRATIVE CALENDAR</Text>
        </View>
        <TouchableOpacity onPress={fetchTimetables} style={[styles.refreshBtn, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="refresh" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
      ) : (
        <FlatList
          data={timetables}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTimetables} tintColor="#6366F1" />}
          ListHeaderComponent={
            <View style={styles.hero}>
                <Text style={[styles.heroTitle, { color: themeColors.text }]}>Schedule Oversight</Text>
                <Text style={[styles.heroDesc, { color: themeColors.subText }]}>Audit and verify academic sessions proposed by department faculty.</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={themeColors.border} />
              <Text style={[styles.emptyTxt, { color: themeColors.subText }]}>No entities in pipeline.</Text>
            </View>
          }
        />
      )}
      
      <DeptAdminBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitleBox: { flex: 1, marginLeft: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  list: { padding: 25, paddingBottom: 150 },
  hero: { marginBottom: 35 },
  heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  heroDesc: { fontSize: 14, marginTop: 8, lineHeight: 22, opacity: 0.8 },

  card: { borderRadius: 32, padding: 24, marginBottom: 20, elevation: 4, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  cardSubtitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTopWidth: 1 },
  authorBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 14, fontWeight: '900', color: '#6366F1' },
  facultyRole: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  facultyName: { fontSize: 13, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTxt: { marginTop: 20, fontSize: 14, fontWeight: '600' }
});
