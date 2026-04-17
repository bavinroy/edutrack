import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import DeptAdminBottomNav from '../../components/DeptAdminBottomNav';

export default function DeptAdminDeveloperInfoScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const developers = [
    {
      name: "Bavin Kumar",
      role: "Lead Full-Stack Developer",
      desc: "Architected and implemented the entire core platform including cross-platform mobile frontend, robust RESTful backend APIs, and database schematics.",
      icon: "code-working"
    },
    {
      name: "Parvesh",
      role: "Lead UI/UX Designer",
      desc: "Conceptualized and designed the premium interface, focusing on high-fidelity user experiences, theme-aware aesthetics, and intuitive navigation flows.",
      icon: "color-palette"
    },
    {
      name: "Vishnu",
      role: "Product Visionary & Architect",
      desc: "Pioneered the initial concept of EduTrack and planned the strategic system architecture to bridges the gap between students and administration.",
      icon: "bulb"
    },
    {
      name: "Moideen",
      role: "Database & App Manager",
      desc: "Optimizing data integrity and managing the overall application lifecycle, ensuring seamless system stability and efficient data pipelines.",
      icon: "server"
    }
  ];

  const techStack = [
    { name: "React Native", icon: "react", color: "#61DBFB" },
    { name: "TypeScript", icon: "language-typescript", color: "#3178C6" },
    { name: "Expo", icon: "flash", color: "#FFFFFF" },
    { name: "Django REST Framework", icon: "api", color: "#092E20" },
    { name: "PostgreSQL", icon: "database", color: "#336791" },
    { name: "Axios & JWT", icon: "lock", color: "#FBBF24" }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Developer Credits</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
          <View style={[styles.logoCircle, { backgroundColor: '#6366F1' }]}>
            <Ionicons name="rocket" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.appTitle, { color: themeColors.text }]}>EduTrack Project</Text>
          <Text style={[styles.appVersion, { color: themeColors.subText }]}>Version 1.0.0 (Stable Release)</Text>
          <Text style={[styles.appDescription, { color: themeColors.subText }]}>
            EduTrack is an all-in-one academic ecosystem designed to modernize institution-student interactions.
            Built from the ground up with a focus on speed, reliability, and modern aesthetics.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>MEET THE DEVELOPERS</Text>
        {developers.map((dev, idx) => (
          <View key={idx} style={[styles.devCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.devIconBox, { backgroundColor: isDark ? '#1E293B' : '#6366F115' }]}>
              <Ionicons name={dev.icon as any} size={24} color="#6366F1" />
            </View>
            <View style={styles.devInfo}>
              <Text style={[styles.devName, { color: themeColors.text }]}>{dev.name}</Text>
              <Text style={[styles.devRole, { color: '#6366F1' }]}>{dev.role}</Text>
              <Text style={[styles.devDesc, { color: themeColors.subText }]}>{dev.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 40 }]}>POWERING EDUTRACK</Text>
        <View style={[styles.techGrid, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {techStack.map((tech, idx) => (
            <View key={idx} style={styles.techItem}>
              <MaterialCommunityIcons name={tech.icon as any} size={28} color={tech.color} />
              <Text style={[styles.techName, { color: themeColors.text }]}>{tech.name}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 40 }]}>PROJECT INQUIRIES</Text>
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: '#6366F1' }]}
          onPress={() => Linking.openURL('mailto:bavingeetha@gmail.com')}
        >
          <Ionicons name="mail" size={28} color="#FFFFFF" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Official Contact</Text>
            <Text style={styles.contactEmail}>bavingeetha@gmail.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" style={{ opacity: 0.7 }} />
        </TouchableOpacity>

        <View style={styles.footerSpacing} />
      </ScrollView>

      <DeptAdminBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollBody: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 120 },
  introBox: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  appTitle: { fontSize: 24, fontWeight: '800' },
  appVersion: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  appDescription: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 15, paddingHorizontal: 10, opacity: 0.8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2, marginBottom: 20, marginLeft: 5 },
  devCard: { flexDirection: 'row', borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 15, alignItems: 'flex-start' },
  devIconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  devInfo: { flex: 1 },
  devName: { fontSize: 18, fontWeight: '700' },
  devRole: { fontSize: 14, fontWeight: '800', marginVertical: 4, textTransform: 'uppercase' },
  devDesc: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 24, padding: 20, borderWidth: 1, gap: 15, justifyContent: 'center' },
  techItem: { width: '30%', alignItems: 'center', marginVertical: 10 },
  techName: { fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  contactCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 24, marginBottom: 20 },
  contactInfo: { flex: 1, marginLeft: 20 },
  contactLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  contactEmail: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 2 },
  footerSpacing: { height: 20 }
});
