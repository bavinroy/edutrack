import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";

export default function ChangePasswordScreen() {
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
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match");
      return;
    }

    setLoading(true);
    const token = await AsyncStorage.getItem("accessToken");

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/profile/change-password/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Password changed successfully");
        router.back();
      } else {
        Alert.alert("Security Error", data.error || "Failed to update password.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Security Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.cardSubtitle}>Account Protection</Text>
          <Text style={styles.cardTitle}>Change Password</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.label, { color: themeColors.subText }]}>Old Password</Text>
          <View style={[styles.inputBox, { backgroundColor: isDark ? '#111827' : '#F9FAFB', borderColor: themeColors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={themeColors.subText} />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Current password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry={secureOld}
              placeholderTextColor={themeColors.subText}
            />
            <TouchableOpacity onPress={() => setSecureOld(!secureOld)}>
              <Ionicons name={secureOld ? "eye-off" : "eye"} size={20} color={themeColors.subText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: themeColors.subText }]}>New Password</Text>
          <View style={[styles.inputBox, { backgroundColor: isDark ? '#111827' : '#F9FAFB', borderColor: themeColors.border }]}>
            <Ionicons name="key-outline" size={20} color={themeColors.subText} />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={secureNew}
              placeholderTextColor={themeColors.subText}
            />
            <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
              <Ionicons name={secureNew ? "eye-off" : "eye"} size={20} color={themeColors.subText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: themeColors.subText }]}>Confirm Password</Text>
          <View style={[styles.inputBox, { backgroundColor: isDark ? '#111827' : '#F9FAFB', borderColor: themeColors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={themeColors.subText} />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Re-type new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureConfirm}
              placeholderTextColor={themeColors.subText}
            />
            <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
              <Ionicons name={secureConfirm ? "eye-off" : "eye"} size={20} color={themeColors.subText} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.submitText}>{loading ? "PROCESSING..." : "UPDATE PASSWORD"}</Text>
            {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
          <Ionicons name="information-circle-outline" size={18} color={themeColors.subText} />
          <Text style={[styles.infoText, { color: themeColors.subText }]}>Password changes will terminate all other active mobile sessions.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },

  scrollBody: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 },

  welcomeCard: {
    backgroundColor: '#EF4444',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  cardTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 5 },

  formCard: { borderRadius: 24, padding: 24, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    marginBottom: 20
  },
  input: { flex: 1, marginLeft: 12, fontSize: 15 },

  submitBtn: {
    backgroundColor: '#111827',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10
  },
  submitText: { color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  infoBox: { flexDirection: 'row', padding: 20, borderRadius: 16, marginTop: 25, gap: 12 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' }
});
