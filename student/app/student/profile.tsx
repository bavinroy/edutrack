import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";

export default function StudentProfileScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const [profile, setProfile] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    department: "",
    year: "",
    semester: "",
    course: "",
    student_id: "",
  });
  const [editableProfile, setEditableProfile] = useState<any>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const DEPARTMENTS = [
    "Computer Science",
    "Information Technology", 
    "Civil Engineering",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering"
  ];

  const COURSES = ["B.E", "B.Tech"];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
          router.replace("/");
          return;
      }

      const res = await fetch(`${API_BASE_URL}/api/student/profile/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();

      if (res.status === 401) {
        router.replace("/");
        return;
      }

      if (res.ok) {
        if (data.avatar && typeof data.avatar === "string" && !data.avatar.startsWith("http")) {
          data.avatar = `${API_BASE_URL}${data.avatar}`;
        }
        setProfile(data);
        setEditableProfile(data);
        if (data.avatar) setAvatarUri(data.avatar);
      }
    } catch (err) { 
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setAvatarUri(selectedUri);
      uploadAvatar(selectedUri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();
      
      const fileName = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(fileName || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('avatar', { uri, name: fileName, type } as any);

      const res = await fetch(`${API_BASE_URL}/api/student/profile/update/`, {
        method: "PATCH",
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        Alert.alert("Success", "Avatar updated successfully");
        fetchProfile();
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.detail || "Failed to upload image");
      }
    } catch (err) {
      Alert.alert("Error", "Network request failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/student/profile/update/`, {
        method: "PATCH",
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            first_name: editableProfile.first_name,
            last_name: editableProfile.last_name,
            email: editableProfile.email,
            phone_number: editableProfile.phone_number,
            department: editableProfile.department,
            course: editableProfile.course,
            year: editableProfile.year,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchProfile();
        Alert.alert("Success", "Profile updated successfully");
      } else {
          Alert.alert("Error", "Failed to update profile details");
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to exit?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userRole"]);
            router.replace("/");
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Profile & Account</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.identityShell}>
             <View style={styles.avatarVault}>
               <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarTouch}>
                 {avatarUri ? (
                   <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                 ) : (
                   <View style={styles.avatarPlaceholder}>
                     <Text style={styles.avatarInt}>{profile.first_name?.[0]?.toUpperCase() || "S"}</Text>
                   </View>
                 )}
                 <View style={styles.editBadge}>
                    <Ionicons name="camera" size={14} color="#fff" />
                 </View>
               </TouchableOpacity>
             </View>
             <Text style={[styles.scholarName, { color: themeColors.text }]}>{profile.first_name} {profile.last_name}</Text>
             <Text style={[styles.scholarUID, { color: themeColors.subText }]}>{profile.student_id ? `ID: ${profile.student_id}` : "Student Portal"}</Text>
          </View>

          {/* Academic Info - READ ONLY */}
          <View style={[styles.metaSuite, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             <View style={styles.suiteHeader}>
                <Text style={[styles.suiteLab, { color: themeColors.subText }]}>ACADEMIC IDENTITY</Text>
                <MaterialCommunityIcons name="school-outline" size={18} color={themeColors.subText} />
             </View>

             <View style={styles.academicGrid}>
                <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Department</Text>
                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{profile.department || "N/A"}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Course / Branch</Text>
                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{profile.course || "N/A"}</Text>
                </View>
             </View>

             <View style={styles.academicGrid}>
                <View style={[styles.gridItem, { flex: 0.5 }]}>
                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Current Year</Text>
                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{profile.year ? `${profile.year} Year` : "N/A"}</Text>
                </View>
                <View style={[styles.gridItem, { flex: 0.5 }]}>
                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Semester</Text>
                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{profile.semester ? `Semester ${profile.semester}` : "N/A"}</Text>
                </View>
             </View>
          </View>

          {/* Personal Info - EDITABLE */}
          <View style={[styles.metaSuite, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 20 }]}>
             <View style={styles.suiteHeader}>
                <Text style={[styles.suiteLab, { color: themeColors.subText }]}>PERSONAL DETAILS</Text>
                <TouchableOpacity onPress={() => { if(isEditing) handleUpdateProfile(); else setIsEditing(true); }}>
                    {updating ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                        <Text style={[styles.editBtnText, { color: isEditing ? '#10B981' : '#3B82F6' }]}>{isEditing ? "SAVE" : "EDIT"}</Text>
                    )}
                </TouchableOpacity>
             </View>
             
             <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.label, { color: themeColors.subText }]}>First Name</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', color: themeColors.text, borderColor: isEditing ? '#3B82F6' : themeColors.border }]} 
                        value={editableProfile.first_name} 
                        onChangeText={(txt) => setEditableProfile({...editableProfile, first_name: txt})}
                        editable={isEditing} 
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: themeColors.subText }]}>Last Name</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', color: themeColors.text, borderColor: isEditing ? '#3B82F6' : themeColors.border }]} 
                        value={editableProfile.last_name} 
                        onChangeText={(txt) => setEditableProfile({...editableProfile, last_name: txt})}
                        editable={isEditing} 
                    />
                </View>
             </View>

             <Text style={[styles.label, { color: themeColors.subText }]}>Email Address</Text>
             <TextInput 
                style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', color: themeColors.text, borderColor: isEditing ? '#3B82F6' : themeColors.border }]} 
                value={editableProfile.email} 
                onChangeText={(txt) => setEditableProfile({...editableProfile, email: txt})}
                editable={isEditing} 
                keyboardType="email-address"
             />

             <Text style={[styles.label, { color: themeColors.subText }]}>Phone Number</Text>
             <TextInput 
                style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', color: themeColors.text, borderColor: isEditing ? '#3B82F6' : themeColors.border }]} 
                value={editableProfile.phone_number} 
                onChangeText={(txt) => setEditableProfile({...editableProfile, phone_number: txt})}
                editable={isEditing} 
                keyboardType="phone-pad"
             />

             <Text style={[styles.label, { color: themeColors.subText }]}>Department</Text>
             <View 
                style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', borderColor: themeColors.border, justifyContent: 'center', opacity: 0.6 }]} 
             >
                <Text style={{ color: themeColors.text, fontSize: 15 }}>
                    {editableProfile.department || "Not Set"}
                </Text>
                <View style={{ position: 'absolute', right: 12 }}>
                   <Ionicons name="lock-closed" size={14} color={themeColors.subText} />
                </View>
             </View>

             <Text style={[styles.label, { color: themeColors.subText }]}>Course / Branch</Text>
             <View 
                style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', borderColor: themeColors.border, justifyContent: 'center', opacity: 0.6 }]} 
             >
                <Text style={{ color: themeColors.text, fontSize: 15 }}>
                    {editableProfile.course || "Not Set"}
                </Text>
                <View style={{ position: 'absolute', right: 12 }}>
                   <Ionicons name="lock-closed" size={14} color={themeColors.subText} />
                </View>
             </View>

             <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '600', marginTop: -8, marginBottom: 15, marginLeft: 4 }}>
                * Academic details can only be changed by Faculty or Administrator.
             </Text>

             <Text style={[styles.label, { color: themeColors.subText }]}>Year of Study</Text>
             <TextInput 
                style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F9FAFB', color: themeColors.text, borderColor: isEditing ? '#3B82F6' : themeColors.border }]} 
                value={editableProfile.year?.toString()} 
                onChangeText={(txt) => setEditableProfile({...editableProfile, year: txt})}
                editable={isEditing} 
                keyboardType="numeric"
             />
          </View>

          <View style={[styles.metaSuite, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 20 }]}>
            <Text style={[styles.suiteLab, { color: themeColors.subText }]}>SECURITY & ACCOUNT</Text>
            
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/student/changepassword")}>
                <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="key-outline" size={20} color="#6366F1" />
                </View>
                <Text style={[styles.actionText, { color: themeColors.text }]}>Change Password</Text>
                <Ionicons name="chevron-forward" size={18} color={themeColors.subText} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/student/active_sessions")}>
                <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#10B981" />
                </View>
                <Text style={[styles.actionText, { color: themeColors.text }]}>Active Sessions</Text>
                <Ionicons name="chevron-forward" size={18} color={themeColors.subText} />
            </TouchableOpacity>
          </View>

          <View style={styles.footerInfo}>
             <Text style={[styles.versionText, { color: themeColors.subText }]}>EduTrack Student Portal v2.0.4</Text>
             <Text style={[styles.versionText, { color: themeColors.subText }]}>Last Login: {profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Just now'}</Text>
          </View>
        </ScrollView>

        <Modal visible={showDeptModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, maxHeight: '60%' }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text, marginBottom: 15 }]}>Select Department</Text>
              <ScrollView style={{ width: '100%' }}>
                {DEPARTMENTS.map((dept, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.listItemSelected, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]} 
                    onPress={() => {
                      setEditableProfile({...editableProfile, department: dept});
                      setShowDeptModal(false);
                    }}
                  >
                    <Text style={[styles.listItemText, { color: themeColors.text, paddingVertical: 15 }]}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.modalCancel, { marginTop: 15, width: '100%' }]} onPress={() => setShowDeptModal(false)}>
                <Text style={[styles.modalCancelTxt, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showCourseModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card, maxHeight: '40%' }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text, marginBottom: 15 }]}>Select Course</Text>
              <ScrollView style={{ width: '100%' }}>
                {COURSES.map((course, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.listItemSelected, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]} 
                    onPress={() => {
                      setEditableProfile({...editableProfile, course: course});
                      setShowCourseModal(false);
                    }}
                  >
                    <Text style={[styles.listItemText, { color: themeColors.text, paddingVertical: 15 }]}>{course}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.modalCancel, { marginTop: 15, width: '100%' }]} onPress={() => setShowCourseModal(false)}>
                <Text style={[styles.modalCancelTxt, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  scrollContent: { paddingBottom: 100 },
  
  identityShell: { alignItems: 'center', paddingBottom: 20, paddingTop: 10 },
  avatarVault: { width: 100, height: 100, borderRadius: 50, position: 'relative' },
  avatarTouch: { width: '100%', height: '100%', borderRadius: 50 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 50, borderWidth: 3, borderColor: '#3B82F6' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarInt: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  
  scholarName: { fontSize: 22, fontWeight: '700', marginTop: 15 },
  scholarUID: { fontSize: 13, fontWeight: '600', marginTop: 4 },

  metaSuite: { marginHorizontal: 20, borderRadius: 20, padding: 20, borderWidth: 1, elevation: 1 },
  suiteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  suiteLab: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  editBtnText: { fontSize: 13, fontWeight: '800' },

  academicGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  gridItem: { flex: 1 },
  gridLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  gridValue: { fontSize: 14, fontWeight: '600' },

  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 8, marginLeft: 4 },
  input: { borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, marginBottom: 15 },

  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)', marginVertical: 5 },

  footerInfo: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  versionText: { fontSize: 11, fontWeight: '500', opacity: 0.6, marginBottom: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  modalCancel: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalCancelTxt: { fontSize: 14, fontWeight: '600' },
  listItemSelected: { width: '100%' },
  listItemText: { fontSize: 16, fontWeight: '500', textAlign: 'center' }
});
