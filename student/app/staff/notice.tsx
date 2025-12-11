import React, { useState, useEffect } from "react";
import { 
  View, TextInput, Alert, FlatList, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

type Notice = {
  id: number;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  author_name: string;
};

export default function NoticePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get("http://10.193.11.125:8000/api/notice/list/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!title || !content) return Alert.alert("Error", "Title & content are required");
    const token = await AsyncStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (image) {
      formData.append("image", { uri: image, type: "image/jpeg", name: "notice.jpg" } as any);
    }
    try {
      await axios.post("http://10.193.11.125:8000/api/notice/create/", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      Alert.alert("Success", "Notice posted!");
      setTitle(""); setContent(""); setImage(null);
      fetchNotices();
    } catch (err) { console.log(err); }
  };

  const handleDelete = async (id: number) => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      await axios.delete(`http://10.193.11.125:8000/api/notice/${id}/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Deleted", "Notice removed successfully");
      fetchNotices();
    } catch (err) { console.log(err); }
  };

  const renderNotice = ({ item }: { item: Notice }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        {item.author_name} • {new Date(item.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.content}>{item.content}</Text>
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text style={{ color: "red", marginTop: 5 }}>🗑 Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#30e4de" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f9fc", paddingBottom: 80 }}>
      

      {/* 🔹 Notices List */}
      <FlatList
  data={notices}
  keyExtractor={(item) => item.id.toString()}
  renderItem={renderNotice}
  contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
  ListHeaderComponent={
    <View>
      {/* 🔹 Post Form */}
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Content / Date & Place"
        value={content}
        onChangeText={setContent}
        style={[styles.input, { height: 80 }]}
        multiline
      />
      <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
        <Text style={styles.pickBtnText}>{image ? "Change Image" : "Pick Image"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Post Notice</Text>
      </TouchableOpacity>
    </View>
  }
/>


      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons name="home" size={24} color={pathname === "/staff/dashboard" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/staff/dashboard")} />
        <Ionicons name="search" size={24} color={pathname === "/staff/search" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/staff/search")} />
        <Ionicons name="desktop-outline" size={24} color={pathname === "/staff/notice" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/staff/notice")} />
        <Ionicons name="download-outline" size={24} color={pathname === "/staff/downloads" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/staff/documents")} />
        <Ionicons name="person-circle-outline" size={24} color={pathname === "/staff/profile" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/staff/profile")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginBottom: 12, backgroundColor: "#fff" },
  pickBtn: { backgroundColor: "#30e4de", padding: 12, borderRadius: 25, alignItems: "center", marginBottom: 12 },
  pickBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  submitBtn: { backgroundColor: "#0bbdd8", padding: 14, borderRadius: 25, alignItems: "center", marginBottom: 20 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  card: { padding: 12, marginVertical: 8, borderRadius: 10, backgroundColor: "#fff", elevation: 3 },
  title: { fontSize: 16, fontWeight: "bold", color: "#222", marginBottom: 4 },
  meta: { fontSize: 12, color: "#666", marginBottom: 8 },
  content: { fontSize: 14, marginBottom: 8, color: "#333" },
  image: { width: "100%", height: 180, borderRadius: 10, marginBottom: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12, position: "absolute", bottom: 0, width: "100%", borderTopLeftRadius: 16, borderTopRightRadius: 16, elevation: 8 },
});
