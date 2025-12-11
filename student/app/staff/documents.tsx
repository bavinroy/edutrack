import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

interface Document {
  id: number;
  title: string;
  description: string;
  subject_name: string;
  subject_code: string;
  staff_name: string;
  file: string;
}

export default function StaffUpload() {
  const router = useRouter();
  const pathname = usePathname();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [staffName, setStaffName] = useState("");
  const [file, setFile] = useState<any>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const formHeight = useRef(new Animated.Value(0)).current;

  const [openDocId, setOpenDocId] = useState<number | null>(null);
  const dropdownHeights = useRef<{ [key: number]: Animated.Value }>({}).current;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch("http://10.193.11.125:8000/api/accounts/documents/list/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      const absoluteData = data.map((doc: any) => ({
        ...doc,
        file: doc.file.startsWith("http") ? doc.file : `http://10.193.11.125:8000${doc.file}`,
      }));
      setDocs(absoluteData);

      absoluteData.forEach((doc: Document) => {
        if (!dropdownHeights[doc.id]) dropdownHeights[doc.id] = new Animated.Value(0);
      });

      setTimeout(() => setLoading(false), 500);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch documents");
      setLoading(false);
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const uploadFile = async () => {
    if (!title || !subjectName || !subjectCode || !staffName || !file) {
      Alert.alert("Error", "Please fill all required fields and pick a file");
      return;
    }
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return Alert.alert("Error", "Please login again");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", desc);
    formData.append("subject_name", subjectName);
    formData.append("subject_code", subjectCode);
    formData.append("staff_name", staffName);
    formData.append("file", {
      uri: file.uri,
      name: file.name || "upload",
      type: file.mimeType || "application/octet-stream",
    } as any);

    try {
      const res = await fetch("http://10.193.11.125:8000/api/accounts/documents/upload/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });
      if (res.ok) {
        Alert.alert("Success", "Document uploaded successfully");
        setTitle(""); setDesc(""); setSubjectName(""); setSubjectCode(""); setStaffName(""); setFile(null);
        fetchDocuments();
      } else {
        const data = await res.json();
        Alert.alert("Error", data.detail || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const deleteFile = async (id: number) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch(`http://10.193.11.125:8000/api/accounts/documents/delete/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Alert.alert("Deleted", "Document removed successfully");
        fetchDocuments();
      } else Alert.alert("Error", "Failed to delete file");
    } catch (err) { console.error(err); }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    Animated.timing(formHeight, {
      toValue: showForm ? 0 : 350,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const toggleDropdown = (id: number) => {
    if (openDocId === id) {
      Animated.timing(dropdownHeights[id], {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => setOpenDocId(null));
    } else {
      if (openDocId && dropdownHeights[openDocId])
        Animated.timing(dropdownHeights[openDocId], {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();

      setOpenDocId(id);
      Animated.timing(dropdownHeights[id], {
        toValue: 100,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleNav = (path: string) => router.push(path as any);

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#30e4de" />
      <Text style={{ marginTop: 10 }}>Loading documents...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={22} color="#30e4de" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>MATERIALS</Text>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push("/staff/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#30e4de" />
        </TouchableOpacity>
      </View>

      {/* Upload Button */}
      <View style={{ alignItems: "center", marginVertical: 10 }}>
        <TouchableOpacity
          style={[styles.uploadBtn, { width: "70%", justifyContent: "center" }]}
          onPress={toggleForm}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={[styles.uploadText, { marginLeft: 6 }]}>Upload Materials</Text>
        </TouchableOpacity>
      </View>

      {/* Animated Form */}
      <Animated.View style={[styles.form, { height: formHeight, overflow: "hidden" }]}>
        <TextInput placeholder="Title *" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput placeholder="Description" value={desc} onChangeText={setDesc} style={styles.input} />
        <TextInput placeholder="Subject Name *" value={subjectName} onChangeText={setSubjectName} style={styles.input} />
        <TextInput placeholder="Subject Code *" value={subjectCode} onChangeText={setSubjectCode} style={styles.input} />
        <TextInput placeholder="Staff Name *" value={staffName} onChangeText={setStaffName} style={styles.input} />
        <TouchableOpacity style={styles.uploadBtn} onPress={pickFile}>
          <Ionicons name="document-outline" size={18} color="#fff" />
          <Text style={styles.uploadText}>{file ? file.name : "Pick File"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: "#28a745" }]} onPress={uploadFile}>
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Documents List */}
      <FlatList
  contentContainerStyle={{ paddingBottom: 120 }}
  data={docs}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View style={styles.card}>
      {/* Tap title to view document */}
      <TouchableOpacity onPress={() => handleNav(`/staff/document/${item.id}`)}>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </TouchableOpacity>
      <Text>{item.description}</Text>
      <Text>📘 {item.subject_name} ({item.subject_code})</Text>
      <Text>👨‍🏫 {item.staff_name}</Text>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this document?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteFile(item.id) },
            ]
          )
        }
      >
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  )}
/>


      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons name="home" size={24} color={pathname === "/staff/dashboard" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/staff/dashboard")} />
        <Ionicons name="search" size={24} color={pathname === "/staff/search" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/staff/search")} />
        <Ionicons name="desktop-outline" size={24} color={pathname === "/staff/notice" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/staff/notice")} />
        <Ionicons name="person-circle-outline" size={24} color={pathname === "/staff/profile" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/staff/profile")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de", alignItems: "center" },
  form: { paddingHorizontal: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginVertical: 6 },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#30e4de", paddingVertical: 10, borderRadius: 8, marginVertical: 6 },
  uploadText: { color: "#fff", fontSize: 16, marginLeft: 6, fontWeight: "600" },
  card: { padding: 12, marginVertical: 8, borderRadius: 10, backgroundColor: "#fff", elevation: 3 },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12, position: "absolute", bottom: 0, width: "100%" },
  dropdown: { overflow: "hidden", backgroundColor: "#30e4de", borderRadius: 6, marginTop: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 5, paddingHorizontal: 10 },
  menuText: { color: "#fff", marginLeft: 6 },
  notificationBtn: { position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: "#dc3545", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", paddingHorizontal: 2 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  deleteBtn: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#dc3545",
  paddingVertical: 10,
  borderRadius: 8,
  marginTop: 10,
},
deleteText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
  marginLeft: 6,
},

});
