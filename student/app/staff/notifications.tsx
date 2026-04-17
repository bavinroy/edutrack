import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import StaffBottomNav from "../../components/StaffBottomNav";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");

type Notification = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  target_url: string | null;
  created_at: string;
};

export default function StaffNotifications() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotices = async () => {
    setFetching(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/api/accounts/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) { }
    finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await axios.post(`${API_BASE_URL}/api/accounts/notifications/read-all/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotices();
    } catch (err) { }
  };

  const handlePress = async (item: Notification) => {
    if (!item.is_read) {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            await axios.post(`${API_BASE_URL}/api/accounts/notifications/${item.id}/read/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        } catch (e) { }
    }
    
    if (item.target_url) {
        try { router.push(item.target_url as any); } catch (e) { }
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.is_read;
    return (
      <TouchableOpacity 
        style={[styles.nCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }, isUnread && styles.unreadCard]} 
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.nIconBox, { backgroundColor: isUnread ? '#6366F1' : isDark ? '#374151' : '#F1F5F9' }]}>
           <Ionicons name={isUnread ? "notifications" : "notifications-outline"} size={22} color={isUnread ? "#fff" : themeColors.subText} />
        </View>
        <View style={styles.nContent}>
           <View style={styles.nHeader}>
              <Text style={[styles.nTitle, { color: themeColors.text }, isUnread && { fontWeight: '800' }]}>{item.title}</Text>
              {isUnread && <View style={styles.unreadDot} />}
           </View>
           <Text style={[styles.nMsg, { color: themeColors.subText }]} numberOfLines={2}>{item.message}</Text>
           <Text style={styles.nTime}>{new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Activity Log</Text>
        <TouchableOpacity style={styles.readAllBtn} onPress={markAllRead}>
          <Text style={styles.readAllText}>CLEAR ALL</Text>
        </TouchableOpacity>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listBody}
          refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchNotices} colors={["#6366F1"]} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
               <View style={[styles.emptyCircle, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <Ionicons name="notifications-off" size={60} color={isDark ? '#334155' : '#CBD5E1'} />
               </View>
               <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Inbox is Clean</Text>
               <Text style={[styles.emptySub, { color: themeColors.subText }]}>You're all caught up! No recent activity requiring your attention.</Text>
            </View>
          }
        />
      )}

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
     paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  readAllBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#6366F115', borderRadius: 8 },
  readAllText: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 0.5 },

  listBody: { padding: 20, paddingBottom: 110 },
  nCard: { flexDirection: 'row', padding: 18, borderRadius: 24, borderWidth: 1, marginBottom: 12, elevation: 1 },
  unreadCard: { borderColor: '#6366F115', borderLeftWidth: 4, borderLeftColor: '#6366F1' },
  nIconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  nContent: { flex: 1, marginLeft: 15 },
  nHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nTitle: { fontSize: 15, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  nMsg: { fontSize: 13, lineHeight: 20, opacity: 0.8 },
  nTime: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginTop: 8, letterSpacing: 0.5 },

  emptyWrap: { alignItems: 'center', marginTop: 100 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginHorizontal: 40, lineHeight: 22 },
});
