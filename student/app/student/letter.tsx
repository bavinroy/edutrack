import React, { useEffect, useState } from "react";
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
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";

interface Letter {
  id: number;
  title: string;
  content: string;
  owner: string;
  is_shared: boolean;
}

export default function StudentLettersScreen() {
  const router = useRouter();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState<"all" | "shared" | "private">("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const API_URL = `${API_BASE_URL}/api/letters/`;

  // Fetch current logged-in user and letters
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const username = await AsyncStorage.getItem("username"); // adjust key if different
      setCurrentUser(username);
    };
    fetchCurrentUser();
    fetchLetters();
  }, []);

  // Fetch letters
  const fetchLetters = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLetters(data);
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Error", "Failed to fetch letters");
    } finally {
      setLoading(false);
    }
  };

  // Save or update letter
  const handleSave = async () => {
    if (!title || !content) {
      Alert.alert("Error", "Please enter title and content");
      return;
    }
    const token = await AsyncStorage.getItem("accessToken");
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_URL}${editingId}/` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, is_shared: isShared }),
      });

      if (res.ok) {
        setTitle("");
        setContent("");
        setIsShared(false);
        setEditingId(null);
        setModalVisible(false);
        fetchLetters();
      } else {
        console.log("Save failed:", await res.json());
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // Edit letter
  const handleEdit = (letter: Letter) => {
    setTitle(letter.title);
    setContent(letter.content);
    setIsShared(letter.is_shared);
    setEditingId(letter.id);
    setModalVisible(true); // open full screen editor
  };

  // Delete letter
  const handleDelete = async (id: number) => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchLetters();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredLetters =
    filter === "all"
      ? letters
      : letters.filter((l) => (filter === "shared" ? l.is_shared : !l.is_shared));

  const handleNav = (path: string) => router.push(path as any);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Dropdown */}
      <TouchableOpacity style={styles.header} onPress={() => setShowMenu(!showMenu)}>
        <Ionicons name="arrow-back" size={22} color="#30e4de" />
        <Text style={styles.headerTitle}>LETTERS</Text>
        <Ionicons name={showMenu ? "chevron-up" : "chevron-down"} size={22} color="#30e4de" />
      </TouchableOpacity>

      {showMenu && (
        <View style={styles.menuBox}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/student/fees")}>
            <Ionicons name="cash-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Fees</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/student/results")}>
            <Ionicons name="ribbon-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Results</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/student/time table")}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Time Table</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Button to open full screen typing */}
      <TouchableOpacity
        style={styles.newLetterBtn}
        onPress={() => {
          setTitle("");
          setContent("");
          setIsShared(false);
          setEditingId(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.newLetterText}>Create New Letter</Text>
      </TouchableOpacity>

      {/* Filter */}
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 10 }}>
        {["all", "shared", "private"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && { backgroundColor: "#30e4de" }]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.menuText, filter === f && { color: "#0a0101ff" }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Letters List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#30e4de" />
        </View>
      ) : filteredLetters.length === 0 ? (
        <Text style={styles.empty}>📭 No letters available</Text>
      ) : (
        <FlatList
          data={filteredLetters}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.content}>{item.content}</Text>
              <Text style={styles.meta}>
                By {item.owner} | {item.is_shared ? "Shared" : "Private"}
              </Text>


              <View style={{ flexDirection: "row", marginTop: 5 }}>
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: "#30e4de" }]}
                  onPress={() => handleEdit(item)}
                >
                  <Ionicons name="create-outline" size={16} color="#3a2929ff" />
                  <Text style={styles.smallButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: "#ff4d4d" }]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.smallButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>

            </View>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Modal for full screen letter typing */}
      <Modal animationType="slide" visible={modalVisible}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.modalHeading}>{editingId ? "Edit Letter" : "Create Letter"}</Text>
            <TextInput
              style={styles.modalTitleInput}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.modalContentInput}
              placeholder="Type your letter here..."
              value={content}
              onChangeText={setContent}
              multiline
            />
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsShared(!isShared)}>
              <Text style={{ fontSize: 18 }}>{isShared ? "✅" : "⬜"}</Text>
              <Text style={{ marginLeft: 8 }}>Share with all students</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>{editingId ? "Update Letter" : "Save Letter"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#aaa", marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons name="home" size={24} color="#fff" onPress={() => handleNav("/student/dashboard")} />
        <Ionicons name="search" size={24} color="#fff" onPress={() => handleNav("/student/search")} />
        <Ionicons name="desktop-outline" size={24} color="#fff" onPress={() => handleNav("/student/letters")} />
        <Ionicons name="person-circle-outline" size={24} color="#fff" onPress={() => handleNav("/student/profile")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de" },
  menuBox: { backgroundColor: "#eff4f4", borderRadius: 12, paddingVertical: 10, marginBottom: 15, alignItems: "center", elevation: 5 },
  menuBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 20, width: "80%", backgroundColor: "#30e4de", borderRadius: 8, marginVertical: 6, justifyContent: "center" },
  menuText: { color: "#090000ff", fontSize: 16, marginLeft: 8, fontWeight: "600" },
  heading: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  newLetterBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#30e4de", padding: 12, borderRadius: 8, marginBottom: 15, justifyContent: "center" },
  newLetterText: { color: "#fff", marginLeft: 6, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: "#fff" },
  modalContainer: { flex: 1, backgroundColor: "#f2f2f2", padding: 16 },
  scrollContainer: { flexGrow: 1 },
  modalHeading: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalTitleInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
  modalContentInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 10, height: 500, textAlignVertical: "top", backgroundColor: "#fff" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  button: { backgroundColor: "#30e4de", padding: 12, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  card: { backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 10, elevation: 2 },
  title: { fontSize: 16, fontWeight: "bold" },
  content: { marginVertical: 5, color: "#333" },
  meta: { fontSize: 12, color: "#666" },
  smallButton: { flexDirection: "row", alignItems: "center", padding: 6, borderRadius: 6, marginRight: 6 },
  smallButtonText: { color: "#fff", marginLeft: 4 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: "#30e4de" },
  empty: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#333" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12, position: "absolute", bottom: 0, width: "100%" },
});

