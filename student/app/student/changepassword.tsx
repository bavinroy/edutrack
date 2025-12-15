import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config";

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [secureOld, setSecureOld] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem("accessToken");
      if (!storedToken) {
        Alert.alert("Error", "User not authenticated");
        return;
      }
      setToken(storedToken);
    };
    fetchToken();
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match");
      return;
    }
    if (!token) {
      Alert.alert("Error", "Authentication token missing");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/student/profile/change-password/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", data.error || JSON.stringify(data));
      }
    } catch (err) {
      console.error("Change password error:", err);
      Alert.alert("Error", "Failed to change password. Check network or server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../assets/images/background.jpeg")}
        style={styles.background}
        resizeMode="stretch"
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>EDU TRACK</Text>
          <Text style={styles.subtitle}>Change Password</Text>

          {/* Old Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter old password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry={secureOld}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setSecureOld(!secureOld)}
            >
              <Ionicons name={secureOld ? "eye-off" : "eye"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={secureNew}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setSecureNew(!secureNew)}
            >
              <Ionicons name={secureNew ? "eye-off" : "eye"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureConfirm}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setSecureConfirm(!secureConfirm)}
            >
              <Ionicons name={secureConfirm ? "eye-off" : "eye"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Updating..." : "Change Password"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  scrollContainer: {
    alignItems: "center", // center horizontally
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 115,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00B9BD",
    marginBottom: 30,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00B9BD",
    marginBottom: 30,
    textAlign: "center",
  },
  inputWrapper: {
    width: "80%", // make input wrapper take 90% of screen width
    position: "relative",
    marginBottom: 25,
  },
  input: {
    width: "100%", // input fills wrapper
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 16,
  },
  button: {
    backgroundColor: "#00B9BD",
    borderRadius: 12,
    paddingVertical: 16,
    width: "80%", // button same width as inputs
    alignItems: "center",
    marginTop: 20,
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
