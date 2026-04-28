import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, StatusBar,
  KeyboardAvoidingView, Platform, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

type UserRole = 'DEPT_STAFF' | 'DEPT_STUDENT' | 'DEPT_ADMIN';

export default function CreateUserScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [role, setRole] = useState<UserRole>('DEPT_STAFF');
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setForm(prev => ({ 
      ...prev, 
      year: "", semester: "", section: "", register_number: "", course: "",
      mobile_number: "", dob: "", gender: "", blood_group: "", aadhaar_number: "",
      address: "", father_name: "", mother_name: "", parent_contact: "",
      tenth_marks: "", twelfth_marks: ""
    }));
  };
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDepts, setFetchingDepts] = useState(true);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    department_id: "",
    year: "", // Only for students
    semester: "",
    section: "",
    register_number: "",
    course: "",
    mobile_number: "",
    dob: "",
    gender: "",
    blood_group: "",
    aadhaar_number: "",
    address: "",
    father_name: "",
    mother_name: "",
    parent_contact: "",
    tenth_marks: "",
    twelfth_marks: "",
  });

  const [activeSection, setActiveSection] = useState<'BASIC' | 'PERSONAL' | 'ACADEMIC'>('BASIC');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    
    // Validation
    if (!username || !email || !password || !first_name || !last_name || !department_id) {
      return Alert.alert("Required Fields", "Please fill in all the details.");
    }

    if (role === 'DEPT_STUDENT' && !year) {
      return Alert.alert("Required Field", "Please select the academic year for the student.");
    }

    if (password !== form.confirm_password) {
      return Alert.alert("Password Error", "Passwords do not match.");
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      let endpoint = "";
      
      if (role === 'DEPT_STAFF') endpoint = "/api/accounts/create/dept-staff/";
      else if (role === 'DEPT_STUDENT') endpoint = "/api/accounts/create/dept-student/";
      else if (role === 'DEPT_ADMIN') endpoint = "/api/accounts/create/dept-admin/";

      const { confirm_password, ...payload } = form;
      (payload as any).role = role;
      
      // Only include student fields for students
      if (role !== 'DEPT_STUDENT') {
         const studentFields = [
           'year', 'semester', 'section', 'register_number', 'course',
           'mobile_number', 'dob', 'gender', 'blood_group', 'aadhaar_number',
           'address', 'father_name', 'mother_name', 'parent_contact',
           'tenth_marks', 'twelfth_marks'
         ];
         studentFields.forEach(f => delete (payload as any)[f]);
      }

      await axios.post(`${API_BASE_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Alert.alert("Success", `The new ${role === 'DEPT_STUDENT' ? 'student' : role === 'DEPT_ADMIN' ? 'HOD' : 'staff'} account has been created.`);
      router.back();
    } catch (err: any) {
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : "The username or email might already be in use.";
      Alert.alert("Error", `Could not create account. ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleTheme = () => {
    if (role === 'DEPT_STUDENT') return { color: '#F97316', icon: 'school', title: 'Student' };
    if (role === 'DEPT_ADMIN') return { color: '#10B981', icon: 'shield-account', title: 'HOD / Admin' };
    return { color: '#6366F1', icon: 'account-tie', title: 'Staff' };
  };

  const currentTheme = getRoleTheme();

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
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Add New User</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>CREATE ACCOUNT</Text>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Role Selector */}
            <View style={styles.roleSelectorWrapper}>
              <Text style={[styles.clusterLab, { color: themeColors.subText, marginBottom: 15 }]}>SELECT USER TYPE</Text>
              <View style={[styles.roleContainer, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                {(['DEPT_STAFF', 'DEPT_STUDENT', 'DEPT_ADMIN'] as UserRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleTab, 
                      role === r && { backgroundColor: themeColors.card, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
                    ]}
                    onPress={() => handleRoleChange(r)}
                  >
                    <Text style={[styles.roleTabTxt, { color: role === r ? getRoleTheme().color : themeColors.subText }]}>
                      {r === 'DEPT_STAFF' ? 'Staff' : r === 'DEPT_STUDENT' ? 'Student' : 'Admin'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Header Overlay */}
            <View style={[styles.identityShell, { borderBottomColor: themeColors.border }]}>
              <View style={[styles.suiteIcon, { backgroundColor: `${currentTheme.color}15` }]}>
                <MaterialCommunityIcons name={currentTheme.icon as any} size={48} color={currentTheme.color} />
              </View>
              <Text style={[styles.suiteTitle, { color: themeColors.text }]}>{currentTheme.title} Details</Text>
              <Text style={[styles.suiteDesc, { color: themeColors.subText }]}>Fill in the form below to create a new {currentTheme.title.toLowerCase()} account.</Text>
            </View>

            <View style={[styles.noteBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: themeColors.border }]}>
                <Ionicons name="information-circle" size={18} color={currentTheme.color} style={{ marginRight: 10 }} />
                <Text style={[styles.noteText, { color: themeColors.subText }]}>
                    <Text style={{ fontWeight: '900', color: currentTheme.color }}>Note: </Text>
                    This screen is for creating a basic account with minimal details. For a complete user profile with full information, we recommend using the main Administrative Panel.
                </Text>
            </View>

            <View style={styles.formStack}>
              <View style={styles.inputCluster}>
                <Text style={[styles.clusterLab, { color: themeColors.subText }]}>LOGIN DETAILS</Text>
                <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                  <Ionicons name="person-outline" size={20} color={currentTheme.color} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder={role === 'DEPT_STUDENT' ? "Roll No / Register No" : "Username / Employee ID"}
                    value={form.username}
                    onChangeText={(v) => setForm({ ...form, username: v })}
                    placeholderTextColor={themeColors.outline}
                  />
                </View>
                <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={currentTheme.color} />
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
                  <Ionicons name="lock-closed-outline" size={20} color={currentTheme.color} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Password"
                    value={form.password}
                    onChangeText={(v) => setForm({ ...form, password: v })}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={themeColors.outline}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.outline} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={currentTheme.color} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Confirm Password"
                    value={form.confirm_password}
                    onChangeText={(v) => setForm({ ...form, confirm_password: v })}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={themeColors.outline}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.outline} />
                  </TouchableOpacity>
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
                {fetchingDepts ? <EduLoading size={25} /> : (
                  <View style={styles.deptWrap}>
                    {departments.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        style={[
                          styles.deptPill, 
                          { borderColor: themeColors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }, 
                          form.department_id === d.id.toString() && { backgroundColor: currentTheme.color, borderColor: currentTheme.color }
                        ]}
                        onPress={() => setForm({ ...form, department_id: d.id.toString() })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.deptTxt, { color: form.department_id === d.id.toString() ? '#fff' : themeColors.subText }]}>{d.name.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {role === 'DEPT_STUDENT' && (
                  <View style={styles.sectionNav}>
                    <TouchableOpacity 
                      onPress={() => setActiveSection('BASIC')}
                      style={[styles.sectionTab, activeSection === 'BASIC' && { borderBottomColor: currentTheme.color }]}>
                      <Text style={[styles.sectionTabTxt, { color: activeSection === 'BASIC' ? currentTheme.color : themeColors.subText }]}>BASIC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setActiveSection('PERSONAL')}
                      style={[styles.sectionTab, activeSection === 'PERSONAL' && { borderBottomColor: currentTheme.color }]}>
                      <Text style={[styles.sectionTabTxt, { color: activeSection === 'PERSONAL' ? currentTheme.color : themeColors.subText }]}>PERSONAL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setActiveSection('ACADEMIC')}
                      style={[styles.sectionTab, activeSection === 'ACADEMIC' && { borderBottomColor: currentTheme.color }]}>
                      <Text style={[styles.sectionTabTxt, { color: activeSection === 'ACADEMIC' ? currentTheme.color : themeColors.subText }]}>ENTRY MARKS</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {role === 'DEPT_STUDENT' && activeSection === 'BASIC' && (
                  <View style={{ marginTop: 25 }}>
                    <Text style={[styles.clusterLab, { color: themeColors.subText }]}>ACADEMIC INFORMATION</Text>
                    <View style={styles.inputHoleRow}>
                      <View style={[styles.inputHole, { flex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                        <TextInput
                          style={[styles.input, { color: themeColors.text }]}
                          placeholder="Section (e.g. A)"
                          value={form.section}
                          onChangeText={(v) => setForm({ ...form, section: v })}
                          placeholderTextColor={themeColors.outline}
                        />
                      </View>
                      <View style={[styles.inputHole, { flex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                        <TextInput
                          style={[styles.input, { color: themeColors.text }]}
                          placeholder="Semester"
                          value={form.semester}
                          onChangeText={(v) => setForm({ ...form, semester: v })}
                          keyboardType="numeric"
                          placeholderTextColor={themeColors.outline}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputHole, { marginTop: 12, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Course (e.g. B.E. CSE)"
                        value={form.course}
                        onChangeText={(v) => setForm({ ...form, course: v })}
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>
                    <View style={[styles.inputHole, { marginTop: 12, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Register Number"
                        value={form.register_number}
                        onChangeText={(v) => setForm({ ...form, register_number: v })}
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>

                    <Text style={[styles.clusterLab, { color: themeColors.subText, marginTop: 25 }]}>SELECT YEAR</Text>
                    <View style={styles.yearGrid}>
                      {['1', '2', '3', '4'].map((y) => (
                        <TouchableOpacity
                          key={y}
                          style={[
                            styles.yearBox, 
                            { borderColor: themeColors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }, 
                            form.year === y && { backgroundColor: '#F97316', borderColor: '#F97316' }
                          ]}
                          onPress={() => setForm({ ...form, year: y })}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.yearTxt, { color: form.year === y ? '#fff' : themeColors.subText }]}>YEAR {y}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {role === 'DEPT_STUDENT' && activeSection === 'PERSONAL' && (
                  <View style={{ marginTop: 25 }}>
                    <Text style={[styles.clusterLab, { color: themeColors.subText }]}>PERSONAL DETAILS</Text>
                    <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <Ionicons name="call-outline" size={20} color={currentTheme.color} />
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Mobile Number"
                        value={form.mobile_number}
                        onChangeText={(v) => setForm({ ...form, mobile_number: v })}
                        keyboardType="phone-pad"
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>
                    <View style={styles.inputHoleRow}>
                      <View style={[styles.inputHole, { flex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                        <TextInput
                          style={[styles.input, { color: themeColors.text }]}
                          placeholder="DOB (YYYY-MM-DD)"
                          value={form.dob}
                          onChangeText={(v) => setForm({ ...form, dob: v })}
                          placeholderTextColor={themeColors.outline}
                        />
                      </View>
                      <View style={[styles.inputHole, { flex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                        <TextInput
                          style={[styles.input, { color: themeColors.text }]}
                          placeholder="Gender"
                          value={form.gender}
                          onChangeText={(v) => setForm({ ...form, gender: v })}
                          placeholderTextColor={themeColors.outline}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputHoleRow, { marginTop: 12 }]}>
                      <View style={[styles.inputHole, { flex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                        <TextInput
                          style={[styles.input, { color: themeColors.text }]}
                          placeholder="Blood Group"
                          value={form.blood_group}
                          onChangeText={(v) => setForm({ ...form, blood_group: v })}
                          placeholderTextColor={themeColors.outline}
                        />
                      </View>
                      <View style={[styles.inputHole, { flex: 2, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                        <TextInput
                          style={[styles.input, { color: themeColors.text }]}
                          placeholder="Aadhaar Number"
                          value={form.aadhaar_number}
                          onChangeText={(v) => setForm({ ...form, aadhaar_number: v })}
                          keyboardType="numeric"
                          placeholderTextColor={themeColors.outline}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputHole, { marginTop: 12, height: 100, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <TextInput
                        style={[styles.input, { color: themeColors.text, height: 80, textAlignVertical: 'top', paddingTop: 15 }]}
                        placeholder="Full Address"
                        value={form.address}
                        onChangeText={(v) => setForm({ ...form, address: v })}
                        multiline
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>

                    <Text style={[styles.clusterLab, { color: themeColors.subText, marginTop: 35 }]}>FAMILY & BACKGROUND</Text>
                    <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <Ionicons name="person-outline" size={20} color={currentTheme.color} />
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Father's Name"
                        value={form.father_name}
                        onChangeText={(v) => setForm({ ...form, father_name: v })}
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>
                    <View style={[styles.inputHole, { marginTop: 12, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <Ionicons name="woman-outline" size={20} color={currentTheme.color} />
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Mother's Name"
                        value={form.mother_name}
                        onChangeText={(v) => setForm({ ...form, mother_name: v })}
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>
                    <View style={[styles.inputHole, { marginTop: 12, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <Ionicons name="call-outline" size={20} color={currentTheme.color} />
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Parent Contact"
                        value={form.parent_contact}
                        onChangeText={(v) => setForm({ ...form, parent_contact: v })}
                        keyboardType="phone-pad"
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>
                  </View>
                )}

                {role === 'DEPT_STUDENT' && activeSection === 'ACADEMIC' && (
                  <View style={{ marginTop: 25 }}>
                    <Text style={[styles.clusterLab, { color: themeColors.subText }]}>ACADEMIC PERFORMANCE (ENTRY)</Text>
                    <View style={[styles.inputHole, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <MaterialCommunityIcons name="label-percent" size={20} color={currentTheme.color} />
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="10th Marks (%)"
                        value={form.tenth_marks}
                        onChangeText={(v) => setForm({ ...form, tenth_marks: v })}
                        keyboardType="numeric"
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>
                    <View style={[styles.inputHole, { marginTop: 12, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <MaterialCommunityIcons name="label-percent" size={20} color={currentTheme.color} />
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="12th Marks (%)"
                        value={form.twelfth_marks}
                        onChangeText={(v) => setForm({ ...form, twelfth_marks: v })}
                        keyboardType="numeric"
                        placeholderTextColor={themeColors.outline}
                      />
                    </View>
                    <View style={[styles.noteBox, { marginTop: 30, backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 10 }} />
                      <Text style={[styles.noteText, { color: themeColors.subText }]}>
                        Complete these fields to ensure a perfect student profile from day one.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.provisionBtn, { backgroundColor: currentTheme.color }, loading && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <EduLoading size={25} /> :
                <>
                  <Text style={styles.provisionTxt}>PROVISION {role === 'DEPT_STUDENT' ? 'STUDENT' : role === 'DEPT_ADMIN' ? 'HOD' : 'STAFF'}</Text>
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

  roleSelectorWrapper: { paddingHorizontal: 25, paddingTop: 25 },
  roleContainer: { flexDirection: 'row', padding: 5, borderRadius: 16 },
  roleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  roleTabTxt: { fontSize: 13, fontWeight: '800' },

  scrollContent: { paddingBottom: 40 },
  identityShell: { alignItems: 'center', paddingVertical: 35, borderBottomWidth: 1, marginHorizontal: 25 },
  suiteIcon: { width: 84, height: 84, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 4 },
  suiteTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  suiteDesc: { fontSize: 12, textAlign: 'center', marginTop: 8, paddingHorizontal: 20, lineHeight: 20, fontWeight: '600' },

  formStack: { padding: 25 },
  inputCluster: { gap: 14 },
  clusterLab: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, marginLeft: 6, textTransform: 'uppercase' },
  inputHole: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 20, height: 62, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, fontWeight: '700', marginLeft: 14 },

  deptWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptPill: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  deptTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  yearGrid: { flexDirection: 'row', gap: 10 },
  yearBox: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  yearTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  provisionBtn: { height: 68, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginHorizontal: 25, marginTop: 30, elevation: 12, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
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
  },
  sectionNav: { 
    flexDirection: 'row', 
    marginTop: 25, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' 
  },
  sectionTab: { 
    paddingBottom: 10, 
    marginRight: 20, 
    borderBottomWidth: 2, 
    borderBottomColor: 'transparent' 
  },
  sectionTabTxt: { 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  inputHoleRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 12 
  }
});
