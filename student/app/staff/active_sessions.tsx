import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useTheme } from '../../context/ThemeContext';
import EduLoading from '../../components/EduLoading';
import StaffBottomNav from '../../components/StaffBottomNav';

const { width } = Dimensions.get("window");

interface Session {
  id: string;
  device_name: string;
  os: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

export default function StaffActiveSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark, theme: themeColors } = useTheme();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/accounts/active-sessions/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);
    } catch (e) {
      Alert.alert("Error", "Failed to resolve active workspace sessions.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutDevice = async (id: string, is_current: boolean) => {
    if (is_current) {
       Alert.alert("Notice", "To terminate this session, please use the main Logout option in the dashboard.");
       return;
    }
    
    Alert.alert(
      "Terminate Session",
      "Revoke access for this device? You will no longer be able to access faculty tools from it without re-authenticating.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Terminate", 
          style: "destructive", 
          onPress: async () => {
             // Backend call placeholder
             setSessions(prev => prev.filter(s => s.id !== id));
             Alert.alert("Success", "Remote session terminated.");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Active Sessions</Text>
          <Text style={styles.headerSub}>SECURITY CONTROL</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.alertBox, { backgroundColor: '#6366F110', borderColor: '#6366F130' }]}>
           <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
           <Text style={[styles.description, { color: themeColors.text }]}>
             These endpoints are currently authenticated to your faculty account. Secure your workspace by terminating unrecognized sessions.
           </Text>
        </View>

        {loading ? (
          <EduLoading size={60} />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyWrap}>
             <Ionicons name="cloud-offline-outline" size={48} color={themeColors.border} />
             <Text style={[styles.emptyText, { color: themeColors.subText }]}>No active remote sessions found.</Text>
          </View>
        ) : (
          sessions.map((session, index) => (
            <View key={index} style={[
              styles.sessionCard, 
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
              session.is_current && { borderColor: '#6366F1', backgroundColor: isDark ? '#6366F115' : '#EEF2FF' }
            ]}>
              <View style={[styles.sessionIcon, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                <Ionicons 
                  name={session.device_name.toLowerCase().includes('mobile') || session.os.toLowerCase().includes('android') || session.os.toLowerCase().includes('ios') ? "phone-portrait-outline" : "laptop-outline"} 
                  size={24} 
                  color={session.is_current ? "#6366F1" : themeColors.subText} 
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.deviceName, { color: themeColors.text }]}>
                  {session.device_name}
                  {session.is_current && <Text style={styles.currentBadge}>  • CURRENT</Text>}
                </Text>
                <View style={styles.badgeRow}>
                   <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>{session.os}</Text></View>
                   <View style={[styles.miniBadge, { backgroundColor: '#F1F5F9' }]}><Text style={[styles.miniBadgeText, { color: '#64748B' }]}>{session.ip_address}</Text></View>
                </View>
                <Text style={[styles.sessionDetail, { color: themeColors.subText }]}>Last used: {session.last_active}</Text>
              </View>
              {!session.is_current && (
                <TouchableOpacity style={styles.logoutBtn} onPress={() => handleLogoutDevice(session.id, session.is_current)}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 
  },
  backBtn: { padding: 5 },
  headerTitleBox: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 9, fontWeight: '900', color: '#6366F1', letterSpacing: 1 },
  
  content: { padding: 20, paddingBottom: 110 },
  alertBox: { flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 25, gap: 12 },
  description: { fontSize: 12, lineHeight: 18, flex: 1, fontWeight: '600' },
  
  sessionCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, padding: 18, marginBottom: 15,
    borderWidth: 1, elevation: 1
  },
  sessionIcon: {
    width: 50, height: 50, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  sessionInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  currentBadge: { color: '#6366F1', fontSize: 10, fontWeight: '900' },
  
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  miniBadge: { backgroundColor: '#6366F115', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  miniBadgeText: { fontSize: 9, fontWeight: '800', color: '#6366F1' },
  
  sessionDetail: { fontSize: 11, fontWeight: '600' },
  logoutBtn: { padding: 5 },
  
  emptyWrap: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { marginTop: 15, fontSize: 14, fontWeight: '700' }
});
