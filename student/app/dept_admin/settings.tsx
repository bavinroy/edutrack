import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import DeptAdminBottomNav from '../../components/DeptAdminBottomNav';

const { width } = Dimensions.get("window");

export default function DeptAdminSettings() {
  const router = useRouter();
  const { isDark, toggleTheme, theme: themeColors } = useTheme();

  // Settings State
  const [pushNotifs, setPushNotifs] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const push = await AsyncStorage.getItem('@hod_push_notifs');
        if (push !== null) setPushNotifs(push === 'true');

        const bio = await AsyncStorage.getItem('@hod_biometric');
        if (bio !== null) setBiometricAuth(bio === 'true');
      } catch (e) { }
    };
    loadSettings();
  }, []);

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) { }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Purge System Cache",
      "This will reset all local UI states and data caches for the HOD portal. Your secure session will remain active. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purge",
          style: "destructive",
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const keysToClear = keys.filter(k => !['accessToken', 'refreshToken', 'userRole'].includes(k));
              await AsyncStorage.multiRemove(keysToClear);
              Alert.alert("Success", "Administrative local cache cleared.");
            } catch (e) {
              Alert.alert("Error", "Failed to clear cache.");
            }
          }
        }
      ]
    );
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: themeColors.subText }]}>{title}</Text>
  );

  const renderRow = (icon: string, title: string, value: boolean | string, onChange?: (v: boolean) => void, onPress?: () => void, isDanger = false) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: themeColors.border }]}
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }, isDanger && { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name={icon as any} size={20} color={isDanger ? '#EF4444' : '#6366F1'} />
        </View>
        <Text style={[styles.rowTitle, { color: themeColors.text }]}>{title}</Text>
      </View>
      {typeof value === 'boolean' ? (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
          thumbColor={Platform.OS === 'ios' ? '#fff' : value ? '#6366F1' : '#F4F3F4'}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.rowVal, { color: themeColors.subText }]}>{value}</Text>
          {onPress && <Ionicons name="chevron-forward" size={16} color={themeColors.subText} style={{ marginLeft: 5 }} />}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>HOD Settings</Text>
          <Text style={styles.headerSub}>ADMINISTRATIVE CONSOLE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {renderSectionHeader("INSTITUTIONAL IDENTITY")}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {renderRow("person-outline", "HOD Profile", "View Identity", undefined, () => router.push("/dept_admin/profile"))}
          {renderRow("business-outline", "Department Registry", "Manage", undefined, () => router.push("/dept_admin/my_department" as any))}
        </View>

        {renderSectionHeader("INTERFACE & DISPLAY")}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {renderRow("moon-outline", "Dark Environment", isDark, toggleTheme)}
          {renderRow("language-outline", "Display Language", "English", undefined, () => Alert.alert("Localization", "Institutional languages coming soon."))}
        </View>

        {renderSectionHeader("SECURITY & CONTROL")}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {renderRow("notifications-outline", "Admin Push Alerts", pushNotifs, (v) => { setPushNotifs(v); saveSetting('@hod_push_notifs', v); })}

        </View>

        {renderSectionHeader("DATA MANAGEMENT")}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {renderRow("refresh-outline", "Reset Portal Local Cache", "Purge Data", undefined, handleClearCache, true)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>EduTrack Enterprise Mobility • HOD Command Center</Text>
          <Text style={styles.footerSub}>Institutional Release v1.4.2</Text>
        </View>
      </ScrollView>

      <DeptAdminBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  backBtn: { padding: 4 },
  headerTitleBox: { marginLeft: 15 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 2, marginTop: 2 },

  scrollBody: { paddingHorizontal: 20, paddingBottom: 110 },
  sectionHeader: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 25, marginBottom: 12, marginLeft: 5 },
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { marginLeft: 15, fontSize: 15, fontWeight: '700' },
  rowVal: { fontSize: 13, fontWeight: '700' },

  footer: { marginTop: 60, marginBottom: 20, alignItems: 'center' },
  footerText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  footerSub: { fontSize: 9, color: '#CBD5E1', marginTop: 4, letterSpacing: 1 },
});
