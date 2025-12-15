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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <ImageBackground
      source={require("../assets/images/background.jpeg")}
      style={styles.background}
      imageStyle={{ resizeMode: "stretch" }}
    >
      <View>
        <Text style={styles.title}>EDU TRACK</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Enter username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Enter Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eye} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
          </TouchableOpacity>
        </View>



        {loading ? (
          <ActivityIndicator size="large" color="#00B9BD" />
        ) : (
          <View style={{ alignItems: "center", width: "100%" }}>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={{ color: "white", fontWeight: "bold" }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center", // vertical center
    alignItems: "center",     // horizontal center
    paddingHorizontal: 20,
    backgroundColor: "#f0f2f5", // subtle background
  },
  title: {
    textAlign: "center",
    fontSize: 26,
    color: "#00B9BD",
    marginBottom: 40,
    fontWeight: "bold",
  },
  label: {
    alignSelf: "flex-start", // keep label aligned left
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 10,
    width: 265,
    backgroundColor: "#fff",
  },
  passwordWrapper: {
    position: "relative",
    width: 265, // wrap the input width
  },
  eye: {
    position: "absolute",
    right: 10,
    top: 15,
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: 15,
    color: "#00B9BD",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#00B9BD",
    paddingVertical: 16,
    borderRadius: 7,
    alignItems: "center",
    width: 260,
    marginTop: 30,
    alignSelf: "center",   // ✅ centers the button horizontally
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
