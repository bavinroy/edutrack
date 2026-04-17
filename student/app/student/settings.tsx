// app/student/settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useTheme } from '../../context/ThemeContext';
import StudentBottomNav from '../../components/StudentBottomNav';

export default function SettingsScreen() {
  const router = useRouter();
  const { expoPushToken, registerToken } = usePushNotifications();
  const { isDark, toggleTheme, theme: themeColors } = useTheme();


  // Settings State Toggles
  const [profileVis, setProfileVis] = useState("My Department");
  const [isProfileVisExpanded, setIsProfileVisExpanded] = useState(false);
  const [showCGPA, setShowCGPA] = useState(false);
  const [showAttendance, setShowAttendance] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const profileVisOptions = ["All Students", "My Department", "Faculty Only"];

  // Load Settings on Mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const vis = await AsyncStorage.getItem('@settings_profile_vis');
        if (vis) setProfileVis(vis);

        const cgpa = await AsyncStorage.getItem('@settings_show_cgpa');
        if (cgpa !== null) setShowCGPA(cgpa === 'true');

        const att = await AsyncStorage.getItem('@settings_show_attendance');
        if (att !== null) setShowAttendance(att === 'true');

        const push = await AsyncStorage.getItem('@settings_push_notifs');
        if (push !== null) setPushNotifs(push === 'true');
      } catch (e) { }
    };
    loadSettings();
  }, []);

  // Save Helpers
  const saveSetting = async (key: string, value: string | boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) { }
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: themeColors.subText }]}>{title}</Text>
  );

  const renderSettingRow = (
    icon: string,
    title: string,
    value: string | boolean,
    onValueChange?: (val: boolean) => void,
    onPress?: () => void,
    isDanger?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: themeColors.border }]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#374151' : '#EFF6FF' }, isDanger && { backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2' }]}>
          <Ionicons name={icon as any} size={20} color={isDanger ? '#EF4444' : '#3B82F6'} />
        </View>
        <Text style={[styles.settingTitle, { color: themeColors.text }]}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        {typeof value === 'boolean' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : value ? '#3B82F6' : '#F3F4F6'}
          />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.settingValueText, { color: themeColors.subText }]}>{value}</Text>
            {onPress && <Ionicons name="chevron-forward" size={20} color={themeColors.subText} />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

        {renderSectionHeader("Account & Security")}
        <View style={[styles.cardGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {renderSettingRow("person-outline", "Personal Details", "", undefined, () => router.push("/student/profile"))}
          {renderSettingRow("key-outline", "Change Password", "", undefined, () => router.push("/student/changepassword"))}
          {renderSettingRow("phone-portrait-outline", "Active Sessions", "Active", undefined, () => router.push("/student/active_sessions"))}
        </View>

        {renderSectionHeader("Dashboard Privacy")}
        <View style={[styles.cardGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {renderSettingRow("eye-outline", "Profile Visibility", profileVis, undefined, () => setIsProfileVisExpanded(!isProfileVisExpanded))}

          {isProfileVisExpanded && (
            <View style={[styles.dropdownContainer, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderBottomColor: themeColors.border }]}>
              {profileVisOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropdownOption, { borderBottomColor: themeColors.border }]}
                  onPress={() => {
                    setProfileVis(opt);
                    saveSetting('@settings_profile_vis', opt);
                    setIsProfileVisExpanded(false);
                  }}
                >
                  <Text style={[styles.dropdownText, { color: themeColors.subText }, profileVis === opt && { color: '#3B82F6', fontWeight: '700' }]}>
                    {opt}
                  </Text>
                  {profileVis === opt && <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {renderSettingRow("ribbon-outline", "Display CGPA on Dashboard", showCGPA, (val) => { setShowCGPA(val); saveSetting('@settings_show_cgpa', val); })}
          {renderSettingRow("calendar-outline", "Show Attendance Logs", showAttendance, (val) => { setShowAttendance(val); saveSetting('@settings_show_attendance', val); })}
        </View>

        {renderSectionHeader("App Preferences")}
        <View style={[styles.cardGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {renderSettingRow("notifications-outline", "Push Notifications", pushNotifs, async (val) => {
            setPushNotifs(val);
            saveSetting('@settings_push_notifs', val);

            try {
              if (val) {
                if (expoPushToken) { await registerToken(expoPushToken); }
              } else {
                const token = await AsyncStorage.getItem("accessToken");
                if (token) {
                  await axios.delete(`${API_BASE_URL}/api/accounts/notifications/push-token/`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                }
              }
            } catch (e) {
              console.log("Failed to sync push notification setting with server", e);
            }
          })}
          {renderSettingRow("moon-outline", "Dark Mode", isDark, () => toggleTheme())}
          {renderSettingRow("language-outline", "Language", "English", undefined, () => alert("Language Selection (Upcoming)"))}
        </View>

        {renderSectionHeader("System")}
        <View style={[styles.cardGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>

          {renderSettingRow("trash-outline", "Clear App Cache", "Wipe Local Data", undefined, async () => {
            Alert.alert(
              "Clear Cache",
              "This will reset all your app preferences and local data. You will stay logged in. Continue?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const keys = await AsyncStorage.getAllKeys();
                      const keysToClear = keys.filter(k => k !== 'accessToken' && k !== 'refreshToken' && k !== 'userRole');
                      await AsyncStorage.multiRemove(keysToClear);
                      setShowCGPA(false);
                      setShowAttendance(true);
                      setProfileVis("My Department");
                      Alert.alert("Success", "Application cache has been wiped successfully.");
                    } catch (e) {
                      Alert.alert("Error", "Failed to clear app cache.");
                    }
                  }
                }
              ]
            );
          }, true)}
        </View>

      </ScrollView>
      <StudentBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 25,
    marginBottom: 10,
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardGroup: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    marginRight: 8,
  },
  dropdownContainer: {
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 15,
  },
});
