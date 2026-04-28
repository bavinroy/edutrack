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
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
import StaffBottomNav from "../../components/StaffBottomNav";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

export default function StaffProfileScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const [profile, setProfile] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    department: "",
    designation: "",
    username: "",
  });
  const [editableProfile, setEditableProfile] = useState<any>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

      const res = await axios.get(`${API_BASE_URL}/api/staff/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;

      if (data.avatar && typeof data.avatar === "string" && !data.avatar.startsWith("http")) {
        data.avatar = `${API_BASE_URL}${data.avatar}`;
      }
      setProfile(data);
      setEditableProfile(data);
      if (data.avatar) setAvatarUri(data.avatar);
    } catch (err) { }
    finally { setLoading(false); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('avatar', { uri, name: fileName, type } as any);

      const res = await fetch(`${API_BASE_URL}/api/staff/profile/update/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        Alert.alert("Success", "Professional avatar updated.");
        fetchProfile();
      }
    } catch (err) { }
    finally { setUpdating(false); }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("accessToken");
      
      const payload: any = {};
      if (editableProfile.first_name !== undefined) payload.first_name = editableProfile.first_name;
      if (editableProfile.last_name !== undefined) payload.last_name = editableProfile.last_name;
      if (editableProfile.phone_number !== undefined) payload.phone_number = editableProfile.phone_number;
      if (editableProfile.designation !== undefined) payload.designation = editableProfile.designation;

      const res = await fetch(`${API_BASE_URL}/api/staff/profile/update/`, {
        method: "PATCH",
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchProfile();
        Alert.alert("Success", "Personnel records synchronized.");
      } else {
          Alert.alert("Error", "Failed to update profile details.");
      }
    } catch (err) { }
    finally { setUpdating(false); }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "role"]);
    router.replace("/");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <EduLoading size={60} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      <View style={[styles.profileHeader, { backgroundColor: themeColors.headerBg }]}>
         <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
         </TouchableOpacity>
         <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
         
         <View style={styles.identitySection}>
            <View style={styles.avatarWrapper}>
               <TouchableOpacity onPress={pickImage} style={[styles.avatarBox, { borderColor: isDark ? '#374151' : '#E5E7EB' }]}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={styles.placeholderAvatar}>
                       <Text style={styles.placeholderText}>{profile.first_name?.[0] || profile.username?.[0]}</Text>
                    </View>
                  )}
                  <View style={styles.camBadge}><Ionicons name="camera" size={12} color="#fff" /></View>
               </TouchableOpacity>
               {updating && <EduLoading size={25} />}
            </View>
            <Text style={[styles.userName, { color: themeColors.text }]}>{profile.first_name || profile.username} {profile.last_name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: '#6366F115' }]}>
               <Text style={styles.roleText}>{(!profile.designation || profile.designation === "null") ? 'FACULTY MEMBER' : profile.designation.toUpperCase()}</Text>
            </View>
         </View>

         <View style={styles.infoBlock}>
            <View style={styles.blockHeader}>
               <Text style={[styles.blockTitle, { color: themeColors.subText }]}>PERSONAL IDENTITY</Text>
               {!isEditing ? (
                 <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.editLink}>Edit Info</Text>
                 </TouchableOpacity>
               ) : (
                 <TouchableOpacity onPress={handleUpdateProfile}>
                    <Text style={[styles.editLink, { color: '#10B981' }]}>Save Changes</Text>
                 </TouchableOpacity>
               )}
            </View>

            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FIRST NAME</Text>
                  {isEditing ? (
                    <TextInput 
                       style={[styles.editingInput, { color: themeColors.text }]}
                       value={editableProfile.first_name === "null" ? "" : (editableProfile.first_name || "")}
                       onChangeText={t => setEditableProfile({...editableProfile, first_name: t})}
                       placeholder="Required"
                       placeholderTextColor={themeColors.subText}
                    />
                  ) : (
                    <Text style={[styles.readOnlyText, { color: (!profile.first_name || profile.first_name === "null") ? themeColors.subText : themeColors.text }]}>{(!profile.first_name || profile.first_name === "null") ? 'Not Provided' : profile.first_name}</Text>
                  )}
               </View>
               <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>LAST NAME</Text>
                  {isEditing ? (
                    <TextInput 
                       style={[styles.editingInput, { color: themeColors.text }]}
                       value={editableProfile.last_name === "null" ? "" : (editableProfile.last_name || "")}
                       onChangeText={t => setEditableProfile({...editableProfile, last_name: t})}
                       placeholder="Optional"
                       placeholderTextColor={themeColors.subText}
                    />
                  ) : (
                    <Text style={[styles.readOnlyText, { color: (!profile.last_name || profile.last_name === "null") ? themeColors.subText : themeColors.text }]}>{(!profile.last_name || profile.last_name === "null") ? 'Not Provided' : profile.last_name}</Text>
                  )}
               </View>
               <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DESIGNATION</Text>
                  {isEditing ? (
                    <TextInput 
                       style={[styles.editingInput, { color: themeColors.text }]}
                       value={editableProfile.designation === "null" ? "" : (editableProfile.designation || "")}
                       onChangeText={t => setEditableProfile({...editableProfile, designation: t})}
                       placeholder="e.g. Assistant Professor"
                       placeholderTextColor={themeColors.subText}
                    />
                  ) : (
                    <Text style={[styles.readOnlyText, { color: (!profile.designation || profile.designation === "null") ? themeColors.subText : themeColors.text }]}>{(!profile.designation || profile.designation === "null") ? 'Faculty Member' : profile.designation}</Text>
                  )}
               </View>
            </View>

            <Text style={[styles.blockTitle, { color: themeColors.subText, marginTop: 25 }]}>CONTACT DETAILS</Text>
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                  {isEditing ? (
                    <TextInput 
                       style={[styles.editingInput, { color: themeColors.text }]}
                       value={editableProfile.phone_number === "null" ? "" : (editableProfile.phone_number || "")}
                       onChangeText={t => setEditableProfile({...editableProfile, phone_number: t})}
                       keyboardType="phone-pad"
                       placeholder="10 Digits"
                       placeholderTextColor={themeColors.subText}
                    />
                  ) : (
                    <Text style={[styles.readOnlyText, { color: (!profile.phone_number || profile.phone_number === "null") ? themeColors.subText : themeColors.text }]}>{(!profile.phone_number || profile.phone_number === "null") ? 'Not Linked' : profile.phone_number}</Text>
                  )}
               </View>
               <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <Text style={[styles.readOnlyText, { color: themeColors.text }]}>{profile.email || 'N/A'}</Text>
               </View>
            </View>

            <Text style={[styles.blockTitle, { color: themeColors.subText, marginTop: 25 }]}>OFFICIAL ASSIGNMENT</Text>
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STAFF ID</Text>
                  <Text style={[styles.readOnlyText, { color: themeColors.text }]}>{profile.username || 'N/A'}</Text>
               </View>
               <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DEPARTMENT</Text>
                  <Text style={[styles.readOnlyText, { color: themeColors.text }]}>{profile.department || 'General'}</Text>
               </View>
            </View>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => router.push("/staff/changepassword")}>
               <View style={styles.actionIcon}><Ionicons name="key" size={18} color="#6366F1" /></View>
               <Text style={[styles.actionText, { color: themeColors.text }]}>Security & Password</Text>
               <Ionicons name="chevron-forward" size={16} color={themeColors.subText} />
            </TouchableOpacity>
         </View>

         <View style={styles.footer}>
            <Text style={styles.version}>EduTrack Enterprise Mobility • v2.1.0</Text>
            <Text style={styles.copyright}>© 2024 EDU CORP. ALL RIGHTS RESERVED.</Text>
         </View>
      </ScrollView>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
           <View style={[styles.modalBox, { backgroundColor: themeColors.card }]}>
              <View style={styles.mIcon}><Ionicons name="log-out" size={32} color="#EF4444" /></View>
              <Text style={[styles.mTitle, { color: themeColors.text }]}>Signing Out?</Text>
              <Text style={styles.mSub}>You will need to re-authenticate to access your faculty workspace.</Text>
              <View style={styles.mRow}>
                 <TouchableOpacity style={styles.mCancel} onPress={() => setShowLogoutModal(false)}>
                    <Text style={[styles.mCancelText, { color: themeColors.text }]}>STAY</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.mConfirm} onPress={handleLogout}>
                    <Text style={styles.mConfirmText}>LOGOUT</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10 },
  backBtn: { padding: 5 },
  logoutBtn: { padding: 5 },

  scrollBody: { paddingBottom: 120 },
  identitySection: { alignItems: 'center', paddingVertical: 20 },
  avatarWrapper: { position: 'relative' },
  avatarBox: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, padding: 4, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  placeholderAvatar: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  camBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#6366F1', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  loaderPos: { position: 'absolute', top: 40, left: 40 },
  
  userName: { fontSize: 22, fontWeight: '800', marginTop: 15 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginTop: 8 },
  roleText: { color: '#6366F1', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  infoBlock: { padding: 20 },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  blockTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  editLink: { fontSize: 12, fontWeight: '800', color: '#6366F1' },

  formCard: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  inputGroup: { padding: 20 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: '#9CA3AF', marginBottom: 6 },
  readOnlyText: { fontSize: 15, fontWeight: '700' },
  editingInput: { fontSize: 15, fontWeight: '700', padding: 0 },
  divider: { height: 1, opacity: 0.1 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1, marginTop: 15 },
  actionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '700' },

  footer: { alignItems: 'center', marginTop: 40, paddingBottom: 20 },
  version: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
  copyright: { fontSize: 8, color: '#CBD5E1', fontWeight: '800', marginTop: 4, letterSpacing: 1 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', borderRadius: 32, padding: 30, alignItems: 'center' },
  mIcon: { width: 70, height: 70, borderRadius: 24, backgroundColor: '#EF444410', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  mSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  mRow: { flexDirection: 'row', gap: 12 },
  mCancel: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  mCancelText: { fontWeight: '800', letterSpacing: 1 },
  mConfirm: { flex: 2, height: 50, backgroundColor: '#EF4444', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mConfirmText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
});
