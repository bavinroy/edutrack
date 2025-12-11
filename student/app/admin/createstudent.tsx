import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function CreateStudentScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    department: "",
    year: "",
    roll_number: "",
  });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("accessToken");
      setToken(storedToken);
    };
    loadToken();
  }, []);

  const handleCreateStudent = async () => {
    if (!token) {
      Alert.alert("Unauthorized", "No access token found. Please log in again.");
      router.push("./login");
      return;
    }

    try {
      const res = await fetch("http://10.193.11.125:8000/api/admin/create-student/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("Create Student Response:", data);

      if (res.ok) {
        Alert.alert("Success", "Student created successfully!");
        router.push("/student/dashboard");
      } else {
        Alert.alert("Error", data.detail || "Failed to create student");
      }
    } catch (err) {
      console.error("Create student error:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎓 Create Student</Text>

      <TextInput style={styles.input} placeholder="Username"
        value={form.username} onChangeText={(t) => setForm({ ...form, username: t })} />
      <TextInput style={styles.input} placeholder="Email"
        value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry
        value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} />
      <TextInput style={styles.input} placeholder="Phone Number"
        value={form.phone_number} onChangeText={(t) => setForm({ ...form, phone_number: t })} />
      <TextInput style={styles.input} placeholder="Department"
        value={form.department} onChangeText={(t) => setForm({ ...form, department: t })} />
      <TextInput style={styles.input} placeholder="Year"
        value={form.year} onChangeText={(t) => setForm({ ...form, year: t })} />
      <TextInput style={styles.input} placeholder="Roll Number"
        value={form.roll_number} onChangeText={(t) => setForm({ ...form, roll_number: t })} />

      <Button title="Create Student" onPress={handleCreateStudent} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
});
