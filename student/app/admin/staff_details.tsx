import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
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
  date_joined: string;
};

export default function StaffDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStaffDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

      const res = await axios.get(`${API_BASE_URL}/api/staff/profile/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not fetch staff details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <EduLoading size={60} />
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <Text style={{ color: themeColors.text }}>Staff not found.</Text>
      </View>
    );
  }

  const DetailItem = ({ label, value, icon, type = "text" }: any) => (
    <View style={styles.detailItem}>
      <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
         <Ionicons name={icon} size={20} color="#6366F1" />
      </View>
      <View style={styles.detailTexts}>
        <Text style={[styles.detailLabel, { color: themeColors.subText }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: themeColors.text }]}>{value || 'Not specified'}</Text>
      </View>
      {type === "phone" && value && (
         <TouchableOpacity onPress={() => Linking.openURL(`tel:${value}`)}>
            <Ionicons name="call" size={20} color="#10B981" />
         </TouchableOpacity>
      )}
      {type === "email" && value && (
         <TouchableOpacity onPress={() => Linking.openURL(`mailto:${value}`)}>
            <Ionicons name="mail" size={20} color="#6366F1" />
         </TouchableOpacity>
      )}
    </View>
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
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Profile Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Profile Card */}
          <View style={styles.profileHeader}>
            {staff.avatar_url ? (
              <Image source={{ uri: staff.avatar_url }} style={styles.largeAvatar} />
            ) : (
              <View style={[styles.largeAvatarPlaceholder, { backgroundColor: '#6366F115' }]}>
                <Ionicons name="person" size={50} color="#6366F1" />
              </View>
            )}
            <Text style={[styles.profileName, { color: themeColors.text }]}>{staff.first_name} {staff.last_name}</Text>
            <Text style={[styles.profileRole, { color: staff.role === 'DEPT_ADMIN' ? '#10B981' : '#6366F1' }]}>
                {staff.role === 'DEPT_ADMIN' ? 'DEPARTMENT ADMIN' : 'STAFF MEMBER'}
            </Text>
          </View>

          {/* Quick Info Grid */}
          <View style={styles.quickGrid}>
             <View style={[styles.quickCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.quickVal, { color: themeColors.text }]}>{staff.department}</Text>
                <Text style={[styles.quickLab, { color: themeColors.subText }]}>DEPARTMENT</Text>
             </View>
             <View style={[styles.quickCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.quickVal, { color: themeColors.text }]}>{staff.designation || 'None'}</Text>
                <Text style={[styles.quickLab, { color: themeColors.subText }]}>DESIGNATION</Text>
             </View>
          </View>

          {/* Details Section */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             <Text style={[styles.sectionTitle, { color: themeColors.text }]}>CONTACT INFORMATION</Text>
             <DetailItem label="Email Address" value={staff.email} icon="mail-outline" type="email" />
             <DetailItem label="Phone Number" value={staff.phone_number} icon="call-outline" type="phone" />
             <DetailItem label="Username" value={staff.username} icon="at-outline" />
          </View>

          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             <Text style={[styles.sectionTitle, { color: themeColors.text }]}>EMPLOYMENT DETAILS</Text>
             <DetailItem label="Date Joined" value={staff.date_joined ? new Date(staff.date_joined).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown'} icon="calendar-outline" />
             <DetailItem label="User ID" value={`#${staff.id}`} icon="finger-print-outline" />
          </View>

          <TouchableOpacity 
            style={[styles.editBtn, { backgroundColor: '#6366F1' }]}
            onPress={() => Alert.alert("Coming Soon", "Edit functionality will be available in the next update.")}
          >
             <Ionicons name="create-outline" size={20} color="#fff" />
             <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },

  profileHeader: { alignItems: 'center', marginVertical: 20 },
  largeAvatar: { width: 120, height: 120, borderRadius: 40, marginBottom: 15 },
  largeAvatarPlaceholder: { width: 120, height: 120, borderRadius: 40, marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  profileRole: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginTop: 5 },

  quickGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  quickCard: { flex: 1, padding: 15, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  quickVal: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  quickLab: { fontSize: 9, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },

  section: { borderRadius: 28, padding: 20, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
  
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  detailTexts: { flex: 1, marginLeft: 15 },
  detailLabel: { fontSize: 11, fontWeight: '700' },
  detailValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },

  editBtn: { flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
