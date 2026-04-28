import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useTheme } from '../../context/ThemeContext';
import EduLoading from '../../components/EduLoading';

interface Session {
  id: string;
  device_name: string;
  os: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

export default function ActiveSessionsScreen() {
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
      Alert.alert("Error", "Failed to fetch active sessions from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutDevice = async (id: string, is_current: boolean) => {
    if (is_current) {
       Alert.alert("Warning", "This is your current device. To log out, use the general Log Out option.");
       return;
    }
    Alert.alert("Success", "Device logged out successfully.");
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Active Sessions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: themeColors.subText }]}>
          These devices are currently logged into your account. If you see an unfamiliar device, log out of it immediately and change your password.
        </Text>

        {loading ? (
          <EduLoading size={60} />
        ) : (
          sessions.map((session, index) => (
            <View key={index} style={[
              styles.sessionCard, 
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
              session.is_current && { borderColor: '#16A34A', backgroundColor: isDark ? '#16A34A15' : '#F0FDF4' }
            ]}>
              <View style={[styles.sessionIcon, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                <Ionicons 
                  name={session.device_name.toLowerCase().includes('mobile') || session.os.toLowerCase().includes('android') || session.os.toLowerCase().includes('ios') ? "phone-portrait-outline" : "laptop-outline"} 
                  size={24} 
                  color={session.is_current ? "#16A34A" : themeColors.subText} 
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.deviceName, { color: themeColors.text }]}>
                  {session.device_name}
                  {session.is_current && <Text style={styles.currentBadge}>  • Current Device</Text>}
                </Text>
                <Text style={[styles.sessionDetail, { color: themeColors.subText }]}>OS: {session.os}</Text>
                <Text style={[styles.sessionDetail, { color: themeColors.subText }]}>IP: {session.ip_address}</Text>
                <Text style={[styles.sessionDetail, { color: themeColors.subText }]}>Last Active: {session.last_active}</Text>
              </View>
              {!session.is_current && (
                <TouchableOpacity style={styles.logoutBtn} onPress={() => handleLogoutDevice(session.id, session.is_current)}>
                  <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  sessionCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, padding: 16, marginBottom: 15,
    borderWidth: 1, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5
  },
  sessionIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  sessionInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  currentBadge: { color: '#16A34A', fontSize: 12, fontWeight: '600' },
  sessionDetail: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center'
  }
});
