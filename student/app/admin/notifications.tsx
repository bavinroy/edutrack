import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";

type Notification = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  target_url: string | null;
  created_at: string;
};

export default function AdminNotifications() {
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
    } catch (err) {
      console.log(err);
    } finally {
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
        try {
            router.push(item.target_url as any);
        } catch (e) {
            console.log("Nav failed");
        }
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notifCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }, !item.is_read && { backgroundColor: '#6366F105', borderColor: '#6366F130' }]} 
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }, !item.is_read && { backgroundColor: '#6366F115' }]}>
        <Ionicons name="notifications" size={20} color={!item.is_read ? '#6366F1' : themeColors.outline} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }, !item.is_read && { color: '#6366F1' }]}>{item.title}</Text>
        <Text style={[styles.message, { color: themeColors.subText }]} numberOfLines={2}>{item.message}</Text>
        <Text style={[styles.time, { color: themeColors.outline }]}>{new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short'})}</Text>
      </View>
      {!item.is_read && <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />}
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
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notifications</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>UPDATES & ALERTS</Text>
          </View>
          <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
            <Ionicons name="checkmark-done" size={22} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={n => n.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchNotices} colors={["#6366F1"]} />}
            ListEmptyComponent={
              <View style={styles.emptyContent}>
                <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <Ionicons name="notifications-off-outline" size={48} color={themeColors.border} />
                </View>
                <Text style={[styles.emptyText, { color: themeColors.text }]}>All Caught Up!</Text>
                <Text style={[styles.emptySubText, { color: themeColors.subText }]}>No new notifications for you right now.</Text>
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
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitleBox: { flex: 1, marginLeft: 15 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerSub: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  markReadBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#6366F115', justifyContent: "center", alignItems: "center" },

  listContent: { padding: 20, paddingBottom: 100 },
  notifCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 18, marginBottom: 15, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  message: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  time: { fontSize: 11, marginTop: 8, fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },

  emptyContent: { alignItems: 'center', marginTop: 100 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyText: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
  emptySubText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40, fontWeight: '600' },
});
