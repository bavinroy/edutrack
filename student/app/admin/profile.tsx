import React, { useState, useEffect, useCallback } from "react";
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
    Modal,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

export default function AdminProfileScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    
    const [profile, setProfile] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

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

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return Alert.alert("Required", "We need access to your photos to update your profile image.");

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
            fetchProfile();
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

            Alert.alert("Success", "Your profile has been updated.");
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            Alert.alert("Error", "Could not update profile info.");
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        setShowLogoutModal(false);
        await AsyncStorage.clear();
        router.replace("/login");
    };

    if (loading || !profile) {
        return (
            <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
                <EduLoading size={60} />
                <Text style={[styles.loaderText, { color: themeColors.subText }]}>Loading Profile...</Text>
            </View>
        );
    }

    const initials = (profile?.first_name?.[0] || profile?.username?.[0] || "P").toUpperCase();

    return (
        <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
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
                                <View style={[styles.avatarPlaceholder, { backgroundColor: '#6366F115' }]}>
                                    <Text style={styles.avatarTxt}>{initials}</Text>
                                </View>
                            )}
                            <TouchableOpacity 
                                style={[styles.editAvatarBtn, { borderColor: themeColors.card }]} 
                                onPress={handlePickImage} 
                                disabled={updating}
                            >
                                <Ionicons name="camera" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.name, { color: themeColors.text }]}>
                            {profile.first_name} {profile.last_name || profile.username}
                        </Text>
                        <View style={styles.roleBadge}>
                            <MaterialCommunityIcons name="account-search" size={12} color="#6366F1" />
                            <Text style={styles.roleTxt}>PRINCIPAL</Text>
                        </View>
                    </View>

                    {/* Data Section */}
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionLabel, { color: themeColors.subText }]}>GENERAL INFO</Text>
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
                                        placeholderTextColor={themeColors.outline}
                                    />
                                    <TextInput 
                                        style={[styles.input, { color: themeColors.text, flex: 1, marginLeft: 15 }]} 
                                        value={editForm.last_name} 
                                        onChangeText={t => setEditForm({...editForm, last_name: t})}
                                        placeholder="Last Name"
                                        placeholderTextColor={themeColors.outline}
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
                                    placeholder="Enter email"
                                    placeholderTextColor={themeColors.outline}
                                />
                            ) : (
                                <Text style={[styles.val, { color: themeColors.text }]}>{profile.email || 'N/A'}</Text>
                            )}
                        </View>

                        <View style={[styles.inputGroup, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: themeColors.border }]}>
                            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>PHONE NUMBER</Text>
                            {isEditing ? (
                                <TextInput 
                                    style={[styles.input, { color: themeColors.text }]} 
                                    value={editForm.phone_number} 
                                    onChangeText={t => setEditForm({...editForm, phone_number: t})}
                                    placeholder="Enter phone number"
                                    keyboardType="phone-pad"
                                    placeholderTextColor={themeColors.outline}
                                />
                            ) : (
                                <Text style={[styles.val, { color: themeColors.text }]}>{profile.phone_number || 'Not Added'}</Text>
                            )}
                        </View>

                        <Text style={[styles.sectionLabel, { color: themeColors.subText, marginTop: 45 }]}>POSITION INFO</Text>
                        
                        <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: themeColors.border }]}>
                            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>DESIGNATION</Text>
                            {isEditing ? (
                                <TextInput 
                                    style={[styles.input, { color: themeColors.text }]} 
                                    value={editForm.designation} 
                                    onChangeText={t => setEditForm({...editForm, designation: t})}
                                    placeholder="e.g. Principal"
                                    placeholderTextColor={themeColors.outline}
                                />
                            ) : (
                                <Text style={[styles.val, { color: themeColors.text }]}>{profile.designation || 'Principal'}</Text>
                            )}
                        </View>

                        <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: themeColors.border }]}>
                            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>DEPARTMENT</Text>
                            <Text style={[styles.val, { color: themeColors.text, opacity: 0.7 }]}>{profile.department || "General"}</Text>
                        </View>

                        <View style={[styles.inputGroup, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: themeColors.border }]}>
                            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>USER ID</Text>
                            <Text style={[styles.val, { color: themeColors.text, opacity: 0.7 }]}>{profile.username?.toUpperCase()}</Text>
                        </View>

                        {isEditing && (
                            <TouchableOpacity 
                                style={[styles.saveBtn, updating && { opacity: 0.7 }]} 
                                onPress={handleUpdate}
                                disabled={updating}
                                activeOpacity={0.8}
                            >
                                {updating ? <EduLoading size={25} /> : <Text style={styles.saveBtnTxt}>SAVE CHANGES</Text>}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            style={[styles.passwordBtn, { borderColor: themeColors.border, marginTop: isEditing ? 15 : 45 }]} 
                            onPress={() => router.push("/admin/changepassword")}
                            activeOpacity={0.7}
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
                            <View style={styles.modalIconBox}>
                                <Ionicons name="log-out" size={28} color="#EF4444" />
                            </View>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Logout?</Text>
                            <Text style={[styles.modalSub, { color: themeColors.subText }]}>Are you sure you want to logout from your account?</Text>
                            <View style={[styles.modalActions, { marginTop: 10 }]}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogoutModal(false)}>
                                    <Text style={[styles.cancelBtnTxt, { color: themeColors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmLogoutBtn} onPress={handleLogout}>
                                    <Text style={styles.confirmLogoutTxt}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 15, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 65, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    logoutBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
    
    scroll: { paddingBottom: 60 },
    profileSection: { alignItems: 'center', paddingVertical: 45 },
    avatarWrapper: { position: 'relative', marginBottom: 20 },
    avatar: { width: 110, height: 110, borderRadius: 38 },
    avatarPlaceholder: { width: 110, height: 110, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 38, fontWeight: '900', color: '#6366F1' },
    editAvatarBtn: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#6366F1', width: 38, height: 38, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 4 },
    
    name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366F110', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#6366F120' },
    roleTxt: { fontSize: 9, fontWeight: '900', color: '#6366F1', letterSpacing: 1 },

    formSection: { paddingHorizontal: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
    editToggle: { paddingVertical: 5 },
    editToggleTxt: { fontSize: 12, fontWeight: '900' },

    inputGroup: { paddingVertical: 22 },
    inputLabel: { fontSize: 9, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
    val: { fontSize: 17, fontWeight: '800' },
    input: { fontSize: 17, fontWeight: '900', paddingVertical: 4, borderBottomWidth: 1.5, borderBottomColor: '#6366F1' },
    rowInputs: { flexDirection: 'row' },

    saveBtn: { backgroundColor: '#10B981', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 35, elevation: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
    saveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    
    passwordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 20, borderWidth: 1.5 },
    passwordBtnTxt: { fontSize: 13, fontWeight: '900' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalBox: { width: '100%', borderRadius: 32, padding: 30, alignItems: 'center' },
    modalIconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#EF444415', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
    modalSub: { fontSize: 14, marginBottom: 30, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
    modalActions: { flexDirection: 'row', width: '100%', gap: 15 },
    cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 14 },
    cancelBtnTxt: { fontWeight: '800', fontSize: 14 },
    confirmLogoutBtn: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 15, borderRadius: 14, alignItems: 'center', elevation: 4 },
    confirmLogoutTxt: { color: '#fff', fontWeight: '900', fontSize: 14 }
});
