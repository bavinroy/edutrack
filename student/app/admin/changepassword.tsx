// app/admin/changepassword.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";

const { width } = Dimensions.get("window");

export default function StaffChangePasswordScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [secureOld, setSecureOld] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Required Fields", "Please fill in all the details.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Match Error", "Passwords do not match. Please try again.");
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await axios.post(
        `${API_BASE_URL}/api/accounts/staff/profile/change-password/`,
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Your password has been changed successfully.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Current password verify failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Change Password</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>SECURITY SETTINGS</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Icon */}
          <View style={styles.identityShell}>
            <View style={[styles.suiteIcon, { backgroundColor: '#EF444415' }]}>
              <MaterialCommunityIcons name="shield-key" size={48} color="#EF4444" />
            </View>
            <Text style={[styles.suiteTitle, { color: themeColors.text }]}>Manage Password</Text>
            <Text style={[styles.suiteDesc, { color: themeColors.subText }]}>Change your password regularly to keep your account secure.</Text>
          </View>

          <View style={styles.formStack}>
            <View style={styles.inputCluster}>
              <Text style={[styles.clusterLab, { color: themeColors.subText }]}>CURRENT PASSWORD</Text>
              <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.outline} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Type current password"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry={secureOld}
                  placeholderTextColor={themeColors.outline}
                />
                <TouchableOpacity onPress={() => setSecureOld(!secureOld)}>
                  <Ionicons name={secureOld ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.outline} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.inputCluster, { marginTop: 30 }]}>
              <Text style={[styles.clusterLab, { color: themeColors.subText }]}>NEW PASSWORD</Text>
              <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                <Ionicons name="key-outline" size={20} color="#6366F1" />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Type new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={secureNew}
                  placeholderTextColor={themeColors.outline}
                />
                <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
                  <Ionicons name={secureNew ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.outline} />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#6366F1" />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirm}
                  placeholderTextColor={themeColors.outline}
                />
                <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
                  <Ionicons name={secureConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.outline} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Guidance */}
            <View style={[styles.guidanceBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="information-circle-outline" size={20} color={themeColors.subText} />
              <Text style={[styles.guidanceTxt, { color: themeColors.subText }]}>Choose a strong password with at least 8 characters for better security.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.provisionBtn, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> :
              <>
                <Text style={styles.provisionTxt}>SAVE PASSWORD</Text>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
              </>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitleBox: { flex: 1, marginLeft: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  scrollContent: { paddingBottom: 40 },
  identityShell: { alignItems: 'center', padding: 35 },
  suiteIcon: { width: 90, height: 90, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2 },
  suiteTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
  suiteDesc: { fontSize: 13, textAlign: 'center', marginTop: 10, paddingHorizontal: 25, lineHeight: 20, fontWeight: '500' },

  formStack: { padding: 25 },
  inputCluster: { gap: 12 },
  clusterLab: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  inputHole: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 20, height: 58, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, fontWeight: '700', marginLeft: 12 },

  guidanceBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginTop: 30 },
  guidanceTxt: { flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16 },

  provisionBtn: { backgroundColor: '#6366F1', height: 64, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginHorizontal: 25, marginTop: 20, elevation: 8, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  provisionTxt: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});
