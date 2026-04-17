import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function CreateStudentScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDepts, setFetchingDepts] = useState(true);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    department_id: "",
    year: "",
  });

  const fetchDepartments = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

      const res = await axios.get(`${API_BASE_URL}/api/accounts/departments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingDepts(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDepartments();
    }, [])
  );

  const handleCreate = async () => {
    const { username, email, password, first_name, last_name, department_id, year } = form;
    if (!username || !email || !password || !first_name || !last_name || !department_id || !year) {
      return Alert.alert("Required Fields", "Please fill in all the student details.");
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await axios.post(`${API_BASE_URL}/api/accounts/create/dept-student/`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", "The new student account has been created.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", "Could not create account. The Registration Number or Email might already be in use.");
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
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Add Student</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>CREATE NEW ACCOUNT</Text>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Form Header Overlay */}
            <View style={[styles.identityShell, { borderBottomColor: themeColors.border }]}>
              <View style={[styles.suiteIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="school" size={48} color="#10B981" />
              </View>
              <Text style={[styles.suiteTitle, { color: themeColors.text }]}>Student Details</Text>
              <Text style={[styles.suiteDesc, { color: themeColors.subText }]}>Fill in the form below to create a new student account.</Text>
            </View>

            <View style={[styles.noteBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: themeColors.border }]}>
                <Ionicons name="information-circle" size={18} color="#6366F1" style={{ marginRight: 10 }} />
                <Text style={[styles.noteText, { color: themeColors.subText }]}>
                    <Text style={{ fontWeight: '900', color: '#6366F1' }}>Note: </Text>
                    This screen is for creating a basic account with minimal details. For a complete user profile with full information, we recommend using the main Administrative Panel.
                </Text>
            </View>

            <View style={{ padding: 25 }}>
            <View style={styles.formStack}>
              <View style={styles.inputCluster}>
                <Text style={[styles.clusterLab, { color: themeColors.subText }]}>LOGIN DETAILS</Text>
                <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                  <Ionicons name="id-card-outline" size={20} color="#6366F1" />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Registration Number / Username"
                    value={form.username}
                    onChangeText={(v) => setForm({ ...form, username: v })}
                    placeholderTextColor={themeColors.outline}
                  />
                </View>
                <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                  <Ionicons name="mail-outline" size={20} color="#6366F1" />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Email Address"
                    value={form.email}
                    onChangeText={(v) => setForm({ ...form, email: v })}
                    keyboardType="email-address"
                    placeholderTextColor={themeColors.outline}
                  />
                </View>
                <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6366F1" />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Password"
                    value={form.password}
                    onChangeText={(v) => setForm({ ...form, password: v })}
                    secureTextEntry
                    placeholderTextColor={themeColors.outline}
                  />
                </View>
              </View>

              <View style={[styles.inputCluster, { marginTop: 35 }]}>
                <Text style={[styles.clusterLab, { color: themeColors.subText }]}>PERSONAL DETAILS</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputHole, { flex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      placeholder="First Name"
                      value={form.first_name}
                      onChangeText={(v) => setForm({ ...form, first_name: v })}
                      placeholderTextColor={themeColors.outline}
                    />
                  </View>
                  <View style={[styles.inputHole, { flex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      placeholder="Last Name"
                      value={form.last_name}
                      onChangeText={(v) => setForm({ ...form, last_name: v })}
                      placeholderTextColor={themeColors.outline}
                    />
                  </View>
                </View>

                <Text style={[styles.clusterLab, { color: themeColors.subText, marginTop: 25 }]}>SELECT DEPARTMENT</Text>
                {fetchingDepts ? <ActivityIndicator size="small" color="#6366F1" /> : (
                  <View style={styles.deptWrap}>
                    {departments.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.deptPill, { borderColor: themeColors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }, form.department_id === d.id.toString() && { backgroundColor: '#6366F1', borderColor: '#6366F1' }]}
                        onPress={() => setForm({ ...form, department_id: d.id.toString() })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.deptTxt, { color: form.department_id === d.id.toString() ? '#fff' : themeColors.subText }]}>{d.name.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={[styles.clusterLab, { color: themeColors.subText, marginTop: 25 }]}>SELECT YEAR</Text>
                <View style={styles.yearGrid}>
                  {['1', '2', '3', '4'].map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearBox, { borderColor: themeColors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }, form.year === y && { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                      onPress={() => setForm({ ...form, year: y })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.yearTxt, { color: form.year === y ? '#fff' : themeColors.subText }]}>YEAR {y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            </View>

            <TouchableOpacity
              style={[styles.provisionBtn, loading && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#fff" /> :
                <>
                  <Text style={styles.provisionTxt}>CREATE ACCOUNT</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </>}
            </TouchableOpacity>
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  headerTitleBox: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },

  scrollContent: { paddingBottom: 40 },
  identityShell: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, marginHorizontal: 25 },
  suiteIcon: { width: 96, height: 96, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 4 },
  suiteTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  suiteDesc: { fontSize: 13, textAlign: 'center', marginTop: 10, paddingHorizontal: 35, lineHeight: 22, fontWeight: '600' },

  formStack: {  },
  inputCluster: { gap: 14 },
  clusterLab: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, marginLeft: 6, textTransform: 'uppercase' },
  inputHole: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 20, height: 62, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, fontWeight: '700', marginLeft: 14 },

  deptWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  deptPill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5 },
  deptTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  yearGrid: { flexDirection: 'row', gap: 10 },
  yearBox: { flex: 1, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  yearTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  provisionBtn: { backgroundColor: '#6366F1', height: 68, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginHorizontal: 25, marginTop: 40, elevation: 12, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15 },
  provisionTxt: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  noteBox: { 
    marginHorizontal: 25, 
    marginTop: 20, 
    padding: 15, 
    borderRadius: 16, 
    borderWidth: 1, 
    flexDirection: 'row', 
    alignItems: 'flex-start' 
  },
  noteText: { 
    flex: 1, 
    fontSize: 12, 
    lineHeight: 18, 
    fontWeight: '600' 
  }
});
