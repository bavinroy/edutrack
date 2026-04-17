import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";

export default function FeedbackScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(false);

  const categories = ["General", "Bug Report", "Suggestion", "Academic Issue"];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in both subject and message.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/student/feedback/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject, message, category }),
      });

      if (res.ok) {
        Alert.alert("Success", "Feedback submitted successfully. Thank you!");
        setSubject("");
        setMessage("");
        setCategory("General");
        router.back();
      } else {
        const data = await res.json();
        Alert.alert("Error", data.detail || "Failed to submit feedback.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Send Feedback</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#3B82F6" />
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>We value your input!</Text>
          <Text style={[styles.infoSub, { color: themeColors.subText }]}>
            Your feedback helps us improve the EduTrack experience. 
            All submissions are reviewed directly by the Administration.
          </Text>
        </View>

        <Text style={[styles.label, { color: themeColors.subText }]}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setCategory(cat)}
              style={[
                styles.categoryBtn, 
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                category === cat && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
              ]}
            >
              <Text style={[styles.categoryText, { color: themeColors.text }, category === cat && { color: '#fff' }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: themeColors.subText }]}>SUBJECT</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]} 
          placeholder="Briefly describe the topic"
          placeholderTextColor={themeColors.subText}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={[styles.label, { color: themeColors.subText }]}>MESSAGE</Text>
        <TextInput 
          style={[styles.textArea, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]} 
          placeholder="Enter your detailed feedback here..."
          placeholderTextColor={themeColors.subText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>SUBMIT FEEDBACK</Text>
              <Ionicons name="send" size={18} color="#fff" style={{marginLeft: 8}} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingTop: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollBody: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 },
  
  infoCard: { alignItems: 'center', marginBottom: 30 },
  infoTitle: { fontSize: 20, fontWeight: '800', marginTop: 15, marginBottom: 8 },
  infoSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, opacity: 0.8 },

  label: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: '600' },

  input: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, marginBottom: 20 },
  textArea: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, height: 160, marginBottom: 30 },

  submitBtn: { 
    backgroundColor: '#3B82F6', 
    height: 56, 
    borderRadius: 18, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});
