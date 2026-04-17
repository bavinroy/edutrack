// app/login.tsx
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Notifications from "expo-notifications";
import { API_BASE_URL } from "./config";

// 🔹 Utility: fetch with auto-refresh
const fetchWithAuth = async (url: string, options: any = {}) => {
  let token = await AsyncStorage.getItem("accessToken");

  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const refresh = await AsyncStorage.getItem("refreshToken");
    if (!refresh) throw new Error("No refresh token found");

    const refreshRes = await fetch(`${API_BASE_URL}/api/accounts/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (refreshRes.ok) {
      const newTokens = await refreshRes.json();
      await AsyncStorage.setItem("accessToken", newTokens.access);

      res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newTokens.access}`,
        },
      });
    } else {
      throw new Error("Session expired. Please log in again.");
    }
  }

  return res;
};

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Student' | 'Staff' | 'Admin'>('Student');

  // Contact Admin Modal State
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactStep, setContactStep] = useState<1 | 2>(1); // 1: Category, 2: Details
  const [deptCategory, setDeptCategory] = useState<'UG' | 'PG' | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  // Form Data
  const [reqName, setReqName] = useState("");
  const [reqRegNo, setReqRegNo] = useState("");
  const [reqYear, setReqYear] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Missing Info", "Please enter username and password.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Login API
      const response = await fetch(`${API_BASE_URL}/api/accounts/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login Response:", data);

      if (!response.ok) {
        Alert.alert("Login Failed", data.detail || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Step 2: Save tokens
      await AsyncStorage.setItem("accessToken", data.access);
      await AsyncStorage.setItem("refreshToken", data.refresh);

      // Step 2.5: Register Push Token
      try {
        const pushStatus = await Notifications.getPermissionsAsync();
        if (pushStatus.granted) {
          const tokenResponse = await Notifications.getExpoPushTokenAsync();
          const pushToken = tokenResponse.data;
          await fetch(`${API_BASE_URL}/api/accounts/notifications/push-token/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${data.access}`
            },
            body: JSON.stringify({ token: pushToken }),
          });
          console.log("Push token registered successfully");
        }
      } catch (e) {
        console.log("Failed to register push token during login", e);
      }

      // Step 3: Get role with token
      const roleResponse = await fetchWithAuth(`${API_BASE_URL}/api/accounts/whoami/`);
      const roleData = await roleResponse.json();
      console.log("Role Data:", roleData);

      if (!roleResponse.ok || !roleData.role) {
        Alert.alert("Error", "Could not determine user role");
        setLoading(false);
        return;
      }

      // Step 4: Save role & navigate
      await AsyncStorage.setItem("userRole", roleData.role);

      switch (roleData.role.toUpperCase()) {
        case "SUPER_ADMIN":
        case "PRINCIPAL":
          router.push("./admin/dashboard");
          break;
        case "DEPT_ADMIN":
          router.push("./dept_admin/dashboard");
          break;
        case "DEPT_STAFF":
          router.push("./staff/dashboard");
          break;
        case "DEPT_STUDENT":
          router.push("./student/dashboard");
          break;
        default:
          Alert.alert("Error", `Unknown role: ${roleData.role}`);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (cat: 'UG' | 'PG') => {
    setLoadingDepts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/public/departments/?category=${cat}`);
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
        setContactStep(2);
      } else {
        Alert.alert("Error", "Failed to fetch departments");
      }
    } catch (err) {
      Alert.alert("Error", "Network error fetching departments");
    } finally {
      setLoadingDepts(false);
    }
  };

  const submitAccountRequest = async () => {
    if (!reqName || !reqRegNo || !reqYear || !selectedDeptId) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/account-request/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: reqName,
          register_number: reqRegNo,
          year: parseInt(reqYear),
          department: selectedDeptId
        })
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Request sent to Department Admin!");
        setContactModalVisible(false);
        // Reset
        setReqName(""); setReqRegNo(""); setReqYear(""); setSelectedDeptId(null); setContactStep(1);
      } else {
        Alert.alert("Error", JSON.stringify(data));
      }
    } catch (err) {
      Alert.alert("Error", "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/background.jpeg")}
      style={styles.background}
      imageStyle={{ resizeMode: "stretch" }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Logo & Title */}
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/images/logo.png")}
                style={{ width: 60, height: 60, resizeMode: 'contain' }}
              />
            </View>
            <Text style={styles.title}>EduTrack</Text>
          </View>

          <View style={styles.cardContainer}>
            {/* Role Tabs */}
            <View style={styles.tabContainer}>
              {['Student', 'Staff', 'Admin'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                  onPress={() => setActiveTab(tab as any)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form */}
            <View style={styles.formContent}>
              <Text style={styles.label}>{activeTab === 'Student' ? "Register Number" : "Username"}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                <TextInput
                  placeholder={activeTab === 'Student' ? "Enter register number" : "Enter username"}
                  style={styles.inputField}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="••••••••"
                  style={styles.inputField}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#0056D2" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginRight: 8 }} />
                  <Text style={{ color: '#000', fontSize: 14 }}>Remember Me</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={{ color: '#0056D2', fontWeight: 'bold' }}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#0056D2" style={{ marginTop: 20 }} />
              ) : (
                <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={{ marginTop: 25, alignSelf: 'center' }}
                onPress={() => setContactModalVisible(true)}
              >
                <Text style={{ color: '#666' }}>Don't have an account? <Text style={{ color: '#0056D2', fontWeight: 'bold', textDecorationLine: 'underline' }}>Contact Admin</Text></Text>
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>



      </KeyboardAvoidingView>

      {/* Account Request Modal */}
      <Modal visible={contactModalVisible} transparent animationType="slide" onRequestClose={() => setContactModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Request Account</Text>

            {contactStep === 1 && (
              <View>
                <Text style={{ marginBottom: 15, textAlign: 'center' }}>Select your Division</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, padding: 15, backgroundColor: '#e0f7fa', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#00B9BD' }}
                    onPress={() => fetchDepartments('UG')}
                  >
                    <Text style={{ fontWeight: 'bold', color: '#00695c' }}>UG (Under Graduate)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, padding: 15, backgroundColor: '#fff3e0', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#ff9800' }}
                    onPress={() => fetchDepartments('PG')}
                  >
                    <Text style={{ fontWeight: 'bold', color: '#e65100' }}>PG (Post Graduate)</Text>
                  </TouchableOpacity>
                </View>
                {loadingDepts && <ActivityIndicator color="#0056D2" style={{ marginTop: 10 }} />}
              </View>
            )}

            {contactStep === 2 && (
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={[styles.inputWrapper, { height: 45, marginBottom: 15 }]} placeholder="Enter Name" value={reqName} onChangeText={setReqName} />

                <Text style={styles.label}>Register Number</Text>
                <TextInput style={[styles.inputWrapper, { height: 45, marginBottom: 15 }]} placeholder="Enter Register No" value={reqRegNo} onChangeText={setReqRegNo} />

                <Text style={styles.label}>Year (1-4)</Text>
                <TextInput style={[styles.inputWrapper, { height: 45, marginBottom: 15 }]} placeholder="e.g. 1" value={reqYear} onChangeText={setReqYear} keyboardType="numeric" />

                <Text style={styles.label}>Select Department</Text>
                <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 20 }}>
                  {departments.map(dept => (
                    <TouchableOpacity
                      key={dept.id}
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: selectedDeptId === dept.id ? '#e3f2fd' : 'transparent' }}
                      onPress={() => setSelectedDeptId(dept.id)}
                    >
                      <Text style={{ fontWeight: selectedDeptId === dept.id ? 'bold' : 'normal' }}>{dept.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.signInButton, { backgroundColor: loading ? '#ccc' : '#0056D2' }]}
                  onPress={submitAccountRequest}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInButtonText}>Submit Request</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}

            <TouchableOpacity
              style={{ marginTop: 15, alignSelf: 'center', padding: 10 }}
              onPress={() => { setContactModalVisible(false); setContactStep(1); }}
            >
              <Text style={{ color: 'red' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 60,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  cardContainer: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#0056D2',
  },
  formContent: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    height: 50,
  },
  inputField: {
    flex: 1,
    height: '100%',
    color: '#333',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#0056D2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#0056D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});