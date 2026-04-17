import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    StatusBar,
    ActivityIndicator,
    Modal,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function DeptAdminProfileScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    
    const [profile, setProfile] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE_URL}/api/staff/profile/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            if (data.avatar && !data.avatar.startsWith("http")) {
                data.avatar = `${API_BASE_URL}${data.avatar}`;
            }
            setProfile(data);
            setEditForm({
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                email: data.email || "",
                phone_number: data.phone_number || "",
                designation: data.designation || ""
            });
            if (data.avatar) setAvatarUri(data.avatar);
        } catch (err) {
            console.error("Profile fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return Alert.alert("Permissions Required", "We need access to your photos.");

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7
        });
        if (!result.canceled) {
            const selectedUri = result.assets[0].uri;
            setAvatarUri(selectedUri);
            uploadAvatar(selectedUri);
        }
    };

    const uploadAvatar = async (uri: string) => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const formData = new FormData();
            const filename = uri.split("/").pop() || "profile.jpg";
            formData.append("avatar", { uri, name: filename, type: "image/jpeg" } as any);

            await axios.put(`${API_BASE_URL}/api/staff/profile/update/`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
        } catch (err) {
            console.error("Avatar upload error:", err);
        }
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const payload = {
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                email: editForm.email,
                phone_number: editForm.phone_number,
                designation: editForm.designation
            };

            await axios.put(`${API_BASE_URL}/api/staff/profile/update/`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Success", "Personnel records updated.");
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading || !profile) {
        return (
            <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    const initials = (profile?.first_name?.[0] || profile?.username?.[0] || "A").toUpperCase();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>My Profile</Text>
                <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: '#6366F120' }]}>
                                <Text style={styles.avatarTxt}>{initials}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickImage} disabled={updating}>
                            <Ionicons name="camera" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.name, { color: themeColors.text }]}>
                        {profile.first_name} {profile.last_name}
                    </Text>
                    <Text style={[styles.subtitle, { color: themeColors.subText }]}>
                        {profile.designation || "Department Head"}
                    </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionLabel, { color: themeColors.subText }]}>PROFILE INFORMATION</Text>
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editToggle}>
                            <Text style={[styles.editToggleTxt, { color: isEditing ? "#EF4444" : "#6366F1" }]}>
                                {isEditing ? "Cancel" : "Edit Profile"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: themeColors.border }]}>
                        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>NAME</Text>
                        {isEditing ? (
                            <View style={styles.rowInputs}>
                                <TextInput 
                                    style={[styles.input, { color: themeColors.text, flex: 1 }]} 
                                    value={editForm.first_name} 
                                    onChangeText={t => setEditForm({...editForm, first_name: t})}
                                    placeholder="First Name"
                                />
                                <TextInput 
                                    style={[styles.input, { color: themeColors.text, flex: 1, marginLeft: 10 }]} 
                                    value={editForm.last_name} 
                                    onChangeText={t => setEditForm({...editForm, last_name: t})}
                                    placeholder="Last Name"
                                />
                            </View>
                        ) : (
                            <Text style={[styles.val, { color: themeColors.text }]}>{profile.first_name || 'N/A'} {profile.last_name || ''}</Text>
                        )}
                    </View>

                    <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: themeColors.border }]}>
                        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>EMAIL ADDRESS</Text>
                        {isEditing ? (
                            <TextInput 
                                style={[styles.input, { color: themeColors.text }]} 
                                value={editForm.email} 
                                onChangeText={t => setEditForm({...editForm, email: t})}
                                keyboardType="email-address"
                            />
                        ) : (
                            <Text style={[styles.val, { color: themeColors.text }]}>{profile.email || 'N/A'}</Text>
                        )}
                    </View>

                    <View style={[styles.inputGroup, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: themeColors.border }]}>
                        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>MOBILE NUMBER</Text>
                        {isEditing ? (
                            <TextInput 
                                style={[styles.input, { color: themeColors.text }]} 
                                value={editForm.phone_number} 
                                onChangeText={t => setEditForm({...editForm, phone_number: t})}
                                placeholder="Add your contact number"
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={[styles.val, { color: themeColors.text }]}>{profile.phone_number || 'Not Linked'}</Text>
                        )}
                    </View>

                    <Text style={[styles.sectionLabel, { color: themeColors.subText, marginTop: 40 }]}>OFFICIAL ASSIGNMENT</Text>
                    
                    <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: themeColors.border }]}>
                        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>DESIGNATION</Text>
                        {isEditing ? (
                            <TextInput 
                                style={[styles.input, { color: themeColors.text }]} 
                                value={editForm.designation} 
                                onChangeText={t => setEditForm({...editForm, designation: t})}
                                placeholder="e.g. Associate Professor"
                            />
                        ) : (
                            <Text style={[styles.val, { color: themeColors.text }]}>{profile.designation || 'Department Head'}</Text>
                        )}
                    </View>

                    <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: themeColors.border }]}>
                        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>DEPARTMENT</Text>
                        <Text style={[styles.val, { color: themeColors.text, opacity: 0.7 }]}>{profile.department || "General"}</Text>
                    </View>

                    <View style={[styles.inputGroup, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: themeColors.border }]}>
                        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>SYSTEM ID</Text>
                        <Text style={[styles.val, { color: themeColors.text, opacity: 0.7 }]}>{profile.username?.toUpperCase()}</Text>
                    </View>

                    {isEditing && (
                        <TouchableOpacity 
                            style={[styles.saveBtn, updating && { opacity: 0.7 }]} 
                            onPress={handleUpdate}
                            disabled={updating}
                        >
                            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnTxt}>Save Changes</Text>}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={[styles.passwordBtn, { borderColor: themeColors.border, marginTop: isEditing ? 15 : 40 }]} 
                        onPress={() => router.push("/staff/changepassword")}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color="#6366F1" />
                        <Text style={[styles.passwordBtnTxt, { color: themeColors.text }]}>Change Password</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Logout Modal */}
            <Modal visible={showLogoutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: themeColors.card }]}>
                        <Text style={[styles.modalTitle, { color: themeColors.text }]}>Logout</Text>
                        <Text style={[styles.modalSub, { color: themeColors.subText }]}>Are you sure you want to sign out?</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogoutModal(false)}>
                                <Text style={[styles.cancelBtnTxt, { color: themeColors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmLogoutBtn} onPress={async () => {
                                await AsyncStorage.clear();
                                router.replace("/");
                            }}>
                                <Text style={styles.confirmLogoutTxt}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60, borderBottomColor: '#ccc', borderBottomWidth: 0.5 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    logoutBtn: { padding: 4 },
    
    scroll: { paddingBottom: 60 },
    profileSection: { alignItems: 'center', paddingVertical: 40 },
    avatarWrapper: { position: 'relative', marginBottom: 20 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 32, fontWeight: '700', color: '#6366F1' },
    editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366F1', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    
    name: { fontSize: 22, fontWeight: '800' },
    subtitle: { fontSize: 14, fontWeight: '600', marginTop: 4 },

    formSection: { paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    editToggle: { padding: 5 },
    editToggleTxt: { fontSize: 12, fontWeight: '800' },

    inputGroup: { paddingVertical: 18 },
    inputLabel: { fontSize: 9, fontWeight: '800', marginBottom: 10 },
    val: { fontSize: 16, fontWeight: '600' },
    input: { fontSize: 16, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#6366F1', paddingVertical: 2 },
    rowInputs: { flexDirection: 'row' },

    saveBtn: { backgroundColor: '#10B981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
    saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
    
    passwordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16, borderWidth: 1 },
    passwordBtnTxt: { fontSize: 14, fontWeight: '800' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalBox: { width: '100%', borderRadius: 24, padding: 25 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
    modalSub: { fontSize: 14, marginBottom: 25, lineHeight: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
    cancelBtn: { padding: 10 },
    cancelBtnTxt: { fontWeight: '700' },
    confirmLogoutBtn: { backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    confirmLogoutTxt: { color: '#fff', fontWeight: '700' }
});
