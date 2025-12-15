// app/admin/create-staff.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../config";

export default function CreateStaff() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateStaff = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/student/admin/create-staff/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Create Staff Response:", data);

      if (response.ok) {
        Alert.alert("Success", "Staff created successfully!");
        router.replace({ pathname: "./admin/dashboard", params: { token } });
      } else {
        Alert.alert("Error", data.detail || "Failed to create staff");
      }
    } catch (err) {
      console.error("Create staff error:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍🏫 Create Staff</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#30e4deff" />
      ) : (
        <Button title="Create Staff" onPress={handleCreateStaff} color="#30e4deff" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
});
