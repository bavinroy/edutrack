import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import StudentBottomNav from '../../components/StudentBottomNav';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
      <View style={[styles.divider, { backgroundColor: themeColors.border, opacity: 0.3 }]} />
      <Text style={[styles.sectionContent, { color: themeColors.subText }]}>{content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
            <Ionicons name="shield-checkmark" size={40} color="#3B82F6" />
          </View>
          <Text style={[styles.introTitle, { color: themeColors.text }]}>Your Privacy Matters</Text>
          <Text style={[styles.introSub, { color: themeColors.subText }]}>
            EduTrack Student Portal is committed to protecting your personal and academic data.
            Last Updated: April 17, 2026
          </Text>
        </View>

        {renderSection(
            "1. Information We Collect",
            "We collect information that allows us to manage your academic profile effectively. This includes your Name, Student ID (Roll Number), Email Address, Phone Number, Department, and Year of Study. Additionally, the app accesses academic data like your Attendance records, Timetable, and Examination Results."
        )}

        {renderSection(
            "2. How We Use Your Data",
            "Your data is used solely for educational and administrative purposes within the institution. This includes marking attendance, generating academic reports, providing notifications for important notices, and enabling communication between students and faculty members."
        )}

        {renderSection(
            "3. Data Sharing & Disclosure",
            "We do not sell or trade your personal data to third parties. Your information is only accessible to authorized institution personnel, including the Principal, Department Heads, and your assigned Class Advisors, to ensure seamless academic management."
        )}

        {renderSection(
            "4. Security of Your Information",
            "We implement industry-standard security measures to protect your data from unauthorized access. This includes encrypted transmission (HTTPS), secure session management, and restricted database access. However, no method of transmission over the internet is 100% secure."
        )}

        {renderSection(
            "5. Push Notifications",
            "If enabled, the app uses device-specific tokens to send you real-time notifications about notices, timetable changes, and attendance updates. You can manage these permissions at any time through the App Settings."
        )}

        {renderSection(
            "6. Data Retention",
            "We retain your personal and academic information for the duration of your enrollment in the academic program. Upon graduation or withdrawal, your data may be archived as per the institution's record-keeping policy."
        )}

        {renderSection(
            "7. Contact Us",
            "If you have any questions or concerns regarding this Privacy Policy or your data, please contact the IT Administration office or your HOD."
        )}

        <View style={styles.footerSpacing} />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  introCard: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  introSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  divider: {
    height: 2,
    width: 40,
    borderRadius: 1,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
  },
  footerSpacing: {
    height: 20,
  },
});
