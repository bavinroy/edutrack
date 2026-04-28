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

type Student = {
  id: number;
  user: {
     id: number;
     username: string;
     email: string;
     first_name: string;
     last_name: string;
  };
  roll_no: string;
  register_number: string;
  year: number;
  semester: number;
  section: string;
  course: string;
  department_name: string;
  avatar_url: string;
  mobile_number: string;
  dob: string;
  gender: string;
  blood_group: string;
  aadhaar_number: string;
  address: string;
  father_name: string;
  mother_name: string;
  parent_contact: string;
  tenth_marks: string;
  twelfth_marks: string;
  academic_status: string;
};

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

      const res = await axios.get(`${API_BASE_URL}/api/academic/students/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudent(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not fetch student details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <EduLoading size={60} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <Text style={{ color: themeColors.text }}>Student not found.</Text>
      </View>
    );
  }

  const DetailItem = ({ label, value, icon, type = "text" }: any) => (
    <View style={styles.detailItem}>
      <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
         <Ionicons name={icon} size={18} color="#F97316" />
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
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Student Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Profile Card */}
          <View style={styles.profileHeader}>
            <View>
              {student.avatar_url ? (
                <Image source={{ uri: student.avatar_url }} style={styles.largeAvatar} />
              ) : (
                <View style={[styles.largeAvatarPlaceholder, { backgroundColor: '#F9731615' }]}>
                  <Ionicons name="person" size={50} color="#F97316" />
                </View>
              )}
              {student.academic_status && (
                <View style={[styles.statusBadge, { backgroundColor: student.academic_status === 'Active' ? '#10B981' : '#EF4444' }]}>
                   <Text style={styles.statusText}>{student.academic_status.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.profileName, { color: themeColors.text }]}>{student.user.first_name} {student.user.last_name}</Text>
            <Text style={[styles.profileRole, { color: '#F97316' }]}>ROLL NO: {student.roll_no}</Text>
          </View>

          {/* Academic Info */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             <Text style={[styles.sectionTitle, { color: themeColors.text }]}>ACADEMIC INFORMATION</Text>
             <DetailItem label="Department" value={student.department_name} icon="business-outline" />
             <DetailItem label="Course" value={student.course} icon="school-outline" />
             <View style={styles.row}>
                <View style={{ flex: 1 }}><DetailItem label="Year" value={`${student.year} Year`} icon="calendar-outline" /></View>
                <View style={{ flex: 1 }}><DetailItem label="Semester" value={`${student.semester} Sem`} icon="layers-outline" /></View>
                <View style={{ flex: 1 }}><DetailItem label="Section" value={student.section || 'N/A'} icon="grid-outline" /></View>
             </View>
             <DetailItem label="Register Number" value={student.register_number} icon="barcode-outline" />
          </View>

          {/* Personal Info */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             <Text style={[styles.sectionTitle, { color: themeColors.text }]}>PERSONAL DETAILS</Text>
             <DetailItem label="Email" value={student.user.email} icon="mail-outline" />
             <DetailItem label="Mobile" value={student.mobile_number} icon="call-outline" type="phone" />
             <DetailItem label="Date of Birth" value={student.dob} icon="gift-outline" />
             <View style={styles.row}>
                <View style={{ flex: 1 }}><DetailItem label="Gender" value={student.gender} icon="people-outline" /></View>
                <View style={{ flex: 1 }}><DetailItem label="Blood Group" value={student.blood_group} icon="water-outline" /></View>
             </View>
             <DetailItem label="Aadhaar Number" value={student.aadhaar_number} icon="card-outline" />
             <DetailItem label="Address" value={student.address} icon="location-outline" />
          </View>

          {/* Family Info */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             <Text style={[styles.sectionTitle, { color: themeColors.text }]}>FAMILY & BACKGROUND</Text>
             <DetailItem label="Father's Name" value={student.father_name} icon="man-outline" />
             <DetailItem label="Mother's Name" value={student.mother_name} icon="woman-outline" />
             <DetailItem label="Parent Contact" value={student.parent_contact} icon="call-outline" type="phone" />
          </View>

          {/* Academic History */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             <Text style={[styles.sectionTitle, { color: themeColors.text }]}>ACADEMIC PERFORMANCE (ENTRY)</Text>
             <View style={styles.row}>
                <View style={{ flex: 1 }}><DetailItem label="10th Marks (%)" value={student.tenth_marks} icon="stats-chart-outline" /></View>
                <View style={{ flex: 1 }}><DetailItem label="12th Marks (%)" value={student.twelfth_marks} icon="stats-chart-outline" /></View>
             </View>
          </View>

          <TouchableOpacity 
            style={[styles.editBtn, { backgroundColor: '#F97316' }]}
            onPress={() => Alert.alert("Coming Soon", "Edit functionality will be available in the next update.")}
          >
             <Ionicons name="create-outline" size={20} color="#fff" />
             <Text style={styles.editBtnText}>Edit Student Info</Text>
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
  statusBadge: { position: 'absolute', bottom: 15, right: -5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 3, borderColor: '#fff' },
  statusText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  profileName: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  profileRole: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 5, textTransform: 'uppercase' },

  section: { borderRadius: 28, padding: 20, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
  
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailTexts: { flex: 1, marginLeft: 15 },
  detailLabel: { fontSize: 10, fontWeight: '700' },
  detailValue: { fontSize: 14, fontWeight: '700', marginTop: 1 },

  row: { flexDirection: 'row', gap: 10 },

  editBtn: { flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
