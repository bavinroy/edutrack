import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { API_BASE_URL } from "../config";

interface Document {
  id: number;
  title: string;
  description: string;
  subject_name: string;
  subject_code: string;
  staff_name: string;
  file: string;
}

export default function StudentDocuments() {
  const router = useRouter();
  const pathname = usePathname();

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [showSubjects, setShowSubjects] = useState(false);

  const fetchDocs = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/accounts/documents/list/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch documents");

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.log("Documents data is not array:", data);
        setDocs([]);
        setLoading(false);
        return;
      }

      const absoluteData = data.map((doc: any) => ({
        ...doc,
        file: doc.file.startsWith("http")
          ? doc.file
          : `${API_BASE_URL}${doc.file}`,
      }));

      setTimeout(() => {
        setDocs(absoluteData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch documents");
      setLoading(false);
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const dir = FileSystem.documentDirectory;

      if (!dir) {
        Alert.alert("Error", "File system unavailable");
        return;
      }

      const downloadDir = `${dir}studentDocs/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

      // Create unique local filename with extension
      const extension = fileUrl.substring(fileUrl.lastIndexOf("."));
      const fileUri = `${downloadDir}${fileName}${extension}`;

      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      if (uri) {
        Alert.alert("Downloaded", `File saved to: ${uri}`);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Download failed");
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const subjects = [...new Set(docs.map((doc) => doc.subject_code))];
  const filteredDocs = filter
    ? docs.filter((doc) => doc.subject_code === filter)
    : docs;

  const handleNav = (path: string) => router.push(path as any);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setShowMenu(!showMenu)}
      >
        <Ionicons name="arrow-back" size={22} color="#30e4de" />
        <Text style={styles.headerTitle}>MATERIALS</Text>
        <Ionicons
          name={showMenu ? "chevron-up" : "chevron-down"}
          size={22}
          color="#30e4de"
        />
      </TouchableOpacity>

      {/* Menu */}
      {showMenu && (
        <View style={styles.menuBox}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/fees")}
          >
            <Ionicons name="cash-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Fees</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/results")}
          >
            <Ionicons name="ribbon-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Results</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/time table")}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Time Table</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter by subject */}
      {subjects.length > 0 && (
        <View style={styles.menuBox}>
          <TouchableOpacity
            style={[styles.menuBtn, { backgroundColor: "#00B9BD" }]}
            onPress={() => setShowSubjects(!showSubjects)}
          >
            <Ionicons name="book-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Filter by Subject</Text>
            <Ionicons
              name={showSubjects ? "chevron-up" : "chevron-down"}
              size={18}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>

          {showSubjects &&
            subjects.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[
                  styles.menuBtn,
                  { width: "70%" },
                  filter === sub && { backgroundColor: "#b0cbc7ff" },
                ]}
                onPress={() => setFilter(filter === sub ? null : sub)}
              >
                <Text style={styles.menuText}>
                  {docs.find((d) => d.subject_code === sub)?.subject_name} ({sub})
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Main content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#30e4de" />
          <Text style={{ marginTop: 10 }}>Loading documents...</Text>
        </View>
      ) : filteredDocs.length === 0 ? (
        <Text style={styles.empty}>📭 No documents available</Text>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 100 }}
          data={filteredDocs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
              <Text>
                📘 {item.subject_name} ({item.subject_code})
              </Text>
              <Text>👨‍🏫 {item.staff_name}</Text>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() =>
                  downloadFile(item.file, `${item.title}_${item.id}`)
                }
              >
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.downloadText}>Download</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Ionicons
          name="home"
          size={24}
          color={pathname === "/student/dashboard" ? "#0e0e0dff" : "#fff"}
          onPress={() => handleNav("/student/dashboard")}
        />
        <Ionicons
          name="search"
          size={24}
          color={pathname === "/student/search" ? "#0e0e0dff" : "#fff"}
          onPress={() => handleNav("/student/search")}
        />
        <Ionicons
          name="desktop-outline"
          size={24}
          color={pathname === "/student/notice" ? "#0e0e0dff" : "#fff"}
          onPress={() => handleNav("/student/notice")}
        />
        <Ionicons
          name="download-outline"
          size={24}
          color={pathname === "/student/downloads" ? "#0e0e0dff" : "#fff"}
          onPress={() => handleNav("/student/downloads")}
        />
        <Ionicons
          name="person-circle-outline"
          size={24}
          color={pathname === "/student/profile" ? "#0e0e0dff" : "#fff"}
          onPress={() => handleNav("/student/profile")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de" },
  menuBox: {
    backgroundColor: "#eff4f4",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 5,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "80%",
    backgroundColor: "#30e4de",
    borderRadius: 8,
    marginVertical: 6,
    justifyContent: "center",
  },
  menuText: { color: "#fff", fontSize: 16, marginLeft: 8, fontWeight: "600" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#333" },
  card: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  downloadBtn: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "#30e4de",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#30e4de",
    paddingVertical: 12,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});
