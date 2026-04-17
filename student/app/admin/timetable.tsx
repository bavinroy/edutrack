import React, { useState, useCallback } from "react";
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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

type SavedTimetable = {
  id: number;
  title: string;
  class_name: string;
  section: string;
  year: string;
  created_at: string;
  status: 'draft' | 'pending_verification' | 'published' | 'rejected';
  department_name?: string;
  staff_name?: string;
};

export default function AdminTimetable() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);

  const fetchTimetables = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

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

  useFocusEffect(
    useCallback(() => {
      fetchTimetables();
    }, [])
  );

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'published': return '#10B981';
      case 'pending_verification': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#64748B';
    }
  };

  const renderItem = ({ item }: { item: SavedTimetable }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title || "Class Timetable"}</Text>
          <View style={styles.classMeta}>
             <Ionicons name="school" size={14} color="#6366F1" />
             <Text style={[styles.cardSubtitle, { color: themeColors.subText }]}>{item.class_name} • {item.section} ({item.year})</Text>
          </View>
          <View style={[styles.deptBadge, { backgroundColor: '#6366F115' }]}>
             <Text style={styles.deptName}>{item.department_name || "General Unit"}</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
        <View style={styles.facultyStack}>
           <View style={[styles.miniAvatar, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
              <Text style={[styles.miniAvatarTxt, { color: themeColors.text }]}>{item.staff_name?.[0]?.toUpperCase() || 'S'}</Text>
           </View>
           <Text style={[styles.facultyName, { color: themeColors.subText }]}>Created by: {item.staff_name || "Staff"}</Text>
        </View>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366F115' }]}>
           <Text style={styles.actionBtnTxt}>VIEW</Text>
           <Ionicons name="chevron-forward" size={12} color="#6366F1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Timetables</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>ALL TIMETABLES</Text>
          </View>
          <TouchableOpacity onPress={() => { setRefreshing(true); fetchTimetables(); }} style={styles.refreshBtn}>
             <Ionicons name="sync" size={20} color="#6366F1" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={timetables}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTimetables(); }} colors={["#6366F1"]} />}
          ListHeaderComponent={
            <View style={styles.inventoryHdr}>
              <Text style={[styles.inventoryTxt, { color: themeColors.subText }]}>TOTAL TIMETABLES: <Text style={{ color: '#6366F1', fontWeight: '900' }}>{timetables.length}</Text></Text>
            </View>
          }
          ListEmptyComponent={
            loading ? <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} /> :
            <View style={styles.empty}>
              <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                 <Ionicons name="calendar-outline" size={64} color={themeColors.border} />
              </View>
              <Text style={[styles.emptyTxt, { color: themeColors.subText }]}>No timetables have been published yet.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1 },
  headerTitleBox: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

  list: { padding: 20, paddingBottom: 100 },
  inventoryHdr: { marginBottom: 20, paddingHorizontal: 5 },
  inventoryTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

  card: { borderRadius: 32, padding: 24, marginBottom: 18, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  classMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardSubtitle: { fontSize: 13, fontWeight: '700' },
  deptBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
  deptName: { fontSize: 9, fontWeight: '900', color: '#6366F1', letterSpacing: 0.5 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTopWidth: 1 },
  facultyStack: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  miniAvatarTxt: { fontSize: 12, fontWeight: '900' },
  facultyName: { fontSize: 12, fontWeight: '700' },

  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  actionBtnTxt: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 0.5 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconBox: { width: 120, height: 120, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTxt: { fontSize: 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 50, lineHeight: 22 }
});
