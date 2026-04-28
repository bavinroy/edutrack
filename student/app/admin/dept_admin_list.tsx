import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  StatusBar,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

type Staff = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number: string;
  department: string;
  designation: string;
  avatar_url: string;
};

export default function DeptAdminListScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [filteredStaffs, setFilteredStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStaffs = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

      const res = await axios.get(`${API_BASE_URL}/api/staff/list/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allStaff = res.data;
      const deptAdmins = allStaff.filter((s: Staff) => s.role === "DEPT_ADMIN");
      
      setStaffs(deptAdmins);
      setFilteredStaffs(deptAdmins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStaffs();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStaffs(staffs);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = staffs.filter(
        (s) =>
          s.username.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
      setFilteredStaffs(filtered);
    }
  }, [searchQuery, staffs]);

  const renderStaffItem = ({ item }: { item: Staff }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={() => router.push({ pathname: "/admin/staff_details", params: { id: item.id } } as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#10B98115' }]}>
            <Text style={[styles.avatarInitial, { color: '#10B981' }]}>{item.first_name ? item.first_name[0] : item.username[0]}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: themeColors.text }]}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={[styles.username, { color: themeColors.subText }]}>@{item.username}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: '#10B98110' }]}>
              <Text style={[styles.tagText, { color: '#10B981' }]}>{item.department} HOD</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.outline} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Department Admins</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>{staffs.length} HEADS OF DEPARTMENTS</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <Ionicons name="search" size={20} color={themeColors.subText} style={{ marginLeft: 15 }} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search by name, username or dept..."
              placeholderTextColor={themeColors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={{ marginRight: 15 }}>
                <Ionicons name="close-circle" size={18} color={themeColors.subText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><EduLoading size={60} /></View>
        ) : (
          <FlatList
            data={filteredStaffs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStaffItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStaffs(); }} colors={["#10B981"]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="shield-search" size={80} color={themeColors.border} />
                <Text style={[styles.emptyText, { color: themeColors.subText }]}>No department admins found matching your search.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  headerTitleBox: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },

  searchSection: { paddingHorizontal: 20, marginBottom: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, height: 50 },
  searchInput: { flex: 1, paddingHorizontal: 15, fontSize: 14, fontWeight: '600' },

  listContent: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 20 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 24, fontWeight: '900', color: '#10B981' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  username: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 20, paddingHorizontal: 50, lineHeight: 22 },
});
