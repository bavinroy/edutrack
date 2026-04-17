import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import StudentBottomNav from "../../components/StudentBottomNav";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

type Notice = {
  id: number;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  acknowledgements_count?: number;
  category?: string;
};

export default function StudentNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const tabs = ["ALL", "ACADEMIC", "EVENTS", "EXAMS", "SPORTS"];

  const fetchNotices = async () => {
    setFetching(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/api/notice/list/`, { 
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      const enhancedData = Array.isArray(data) ? data.map(n => ({
        ...n,
        category: inferCategory(n.title)
      })) : [];
      setNotices(enhancedData);
    } catch (err) { }
    finally { setLoading(false); setFetching(false); }
  };

  const inferCategory = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("exam") || t.includes("schedule")) return "EXAMS";
    if (t.includes("event") || t.includes("fest")) return "EVENTS";
    if (t.includes("sport")) return "SPORTS";
    return "ACADEMIC";
  };

  useEffect(() => { fetchNotices(); }, []);

  const getFilteredNotices = () => {
    let filtered = notices;
    if (selectedTab !== "ALL") filtered = filtered.filter(n => n.category === selectedTab);
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const getBadgeMeta = (category: string) => {
    switch (category) {
      case "EVENTS": return { color: "#3B82F6", icon: "calendar-star" };
      case "EXAMS": return { color: "#EF4444", icon: "file-certificate" };
      case "ACADEMIC": return { color: "#F59E0B", icon: "book-open-variant" };
      case "SPORTS": return { color: "#10B981", icon: "trophy-outline" };
      default: return { color: "#6366F1", icon: "information-variant" };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notice Board</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchShell, { backgroundColor: themeColors.bg }]}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={20} color={themeColors.subText} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search announcements..."
              placeholderTextColor={themeColors.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  selectedTab === tab && styles.activeTabBtn,
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  { color: themeColors.subText },
                  selectedTab === tab && styles.activeTabText
                ]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            data={getFilteredNotices()}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchNotices} />}
            renderItem={({ item }) => {
              const meta = getBadgeMeta(item.category || "ACADEMIC");
              return (
                <TouchableOpacity style={[styles.noticeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: `${meta.color}15` }]}>
                      <MaterialCommunityIcons name={meta.icon as any} size={14} color={meta.color} />
                      <Text style={[styles.badgeText, { color: meta.color }]}>{item.category}</Text>
                    </View>
                    <Text style={[styles.date, { color: themeColors.subText }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  
                  <Text style={[styles.noticeTitle, { color: themeColors.text }]}>{item.title}</Text>
                  <Text style={[styles.noticeContent, { color: themeColors.subText }]} numberOfLines={3}>{item.content}</Text>
                  
                  {item.image && (
                    <Image source={{ uri: item.image }} style={styles.noticeImage} />
                  )}

                  <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                    <View style={styles.authorBox}>
                      <View style={[styles.authorAvatar, { backgroundColor: isDark ? '#374151' : '#F3F4F6', overflow: 'hidden' }]}>
                        {item.author_avatar ? (
                            <Image source={{ uri: item.author_avatar }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Ionicons name="person" size={12} color={themeColors.subText} />
                        )}
                      </View>
                      <Text style={[styles.authorName, { color: themeColors.text }]}>{item.author_name}</Text>
                    </View>
                    <TouchableOpacity style={styles.ackBtn}>
                       <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                       <Text style={styles.ackText}>Sign View</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  backBtn: { padding: 4 },

  searchShell: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500' },

  tabContainer: { marginBottom: 15 },
  tabScroll: { paddingHorizontal: 20, gap: 10 },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  activeTabBtn: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  activeTabText: { color: '#FFFFFF' },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  noticeCard: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  date: { fontSize: 11, fontWeight: '600' },
  noticeTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  noticeContent: { fontSize: 14, lineHeight: 22 },
  noticeImage: { width: '100%', height: 200, borderRadius: 16, marginTop: 15 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1 },
  authorBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  authorName: { fontSize: 13, fontWeight: '700' },
  ackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ackText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' }
});
