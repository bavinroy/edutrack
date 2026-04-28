import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

interface Letter {
  id: number;
  title: string;
  content: string;
  owner: string;
  is_shared: boolean;
}

export default function StudentLettersScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "shared" | "private">("all");
  const [modalVisible, setModalVisible] = useState(false);

  const API_URL = `${API_BASE_URL}/api/letters/`;

  useEffect(() => { fetchLetters(); }, []);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setLetters(data);
    } catch (err) { }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!title || !content) { Alert.alert("Error", "Missing title or content"); return; }
    const token = await AsyncStorage.getItem("accessToken");
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_URL}${editingId}/` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, is_shared: isShared }),
      });
      if (res.ok) {
        setModalVisible(false);
        fetchLetters();
      }
    } catch (err) { }
  };

  const handleDelete = async (id: number) => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_URL}${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchLetters();
    } catch (err) { }
  };

  const filteredLetters = filter === "all" ? letters : letters.filter((l) => (filter === "shared" ? l.is_shared : !l.is_shared));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Form Center</Text>
          <TouchableOpacity onPress={() => {
              setEditingId(null); setTitle(""); setContent(""); setIsShared(false); setModalVisible(true);
          }}>
            <Ionicons name="add-circle-outline" size={28} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterBar}>
            {["all", "shared", "private"].map((f) => (
                <TouchableOpacity
                    key={f}
                    style={[styles.filterTab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, filter === f && { backgroundColor: isDark ? '#3B82F6' : '#111827', borderColor: isDark ? '#3B82F6' : '#111827' }]}
                    onPress={() => setFilter(f as any)}
                >
                    <Text style={[styles.filterTabText, { color: themeColors.subText }, filter === f && { color: '#ffffff' }]}>
                        {f.toUpperCase()}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        {loading ? (
            <View style={styles.loader}>
                <EduLoading size={60} />
            </View>
        ) : (
            <FlatList
                data={filteredLetters}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listBody}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <View style={styles.cardMain}>
                            <View style={[styles.iconBox, { backgroundColor: isDark ? '#374151' : '#F5F3FF' }]}>
                                <MaterialCommunityIcons name="file-document-outline" size={24} color="#6366F1" />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.letterTitle, { color: themeColors.text }]}>{item.title}</Text>
                                <Text style={[styles.letterPreview, { color: themeColors.subText }]} numberOfLines={2}>{item.content}</Text>
                                <View style={styles.metaRow}>
                                    <View style={[styles.statusPill, { backgroundColor: item.is_shared ? (isDark ? '#065F46' : '#ECFDF5') : (isDark ? '#374151' : '#F9FAFB') }]}>
                                        <Text style={[styles.statusText, { color: item.is_shared ? (isDark ? '#34D399' : '#10B981') : themeColors.subText }]}>
                                            {item.is_shared ? "SHARED" : "PRIVATE"}
                                        </Text>
                                    </View>
                                    <Text style={[styles.ownerText, { color: themeColors.subText }]}>By {item.owner}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.cardActions, { borderTopColor: themeColors.border }]}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => {
                                setEditingId(item.id); setTitle(item.title); setContent(item.content); setIsShared(item.is_shared); setModalVisible(true);
                            }}>
                                <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="document-text-outline" size={64} color={themeColors.border} />
                        <Text style={[styles.emptyText, { color: themeColors.subText }]}>No documents found in this category.</Text>
                    </View>
                }
            />
        )}

        {/* Modal Editor */}
        <Modal visible={modalVisible} animationType="slide">
            <SafeAreaView style={[styles.modalBg, { backgroundColor: themeColors.bg }]}>
                <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backBtn}>
                        <Ionicons name="close" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>{editingId ? "Edit Document" : "New Document"}</Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveBtnText}>SAVE</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.modalBody}>
                    <TextInput
                        style={[styles.titleInput, { color: themeColors.text }]}
                        placeholder="Document Title"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor={themeColors.subText}
                    />
                    <TextInput
                        style={[styles.contentInput, { color: themeColors.text }]}
                        placeholder="Type your content here..."
                        value={content}
                        onChangeText={setContent}
                        multiline
                        placeholderTextColor={themeColors.subText}
                    />
                    <TouchableOpacity style={styles.shareToggle} onPress={() => setIsShared(!isShared)}>
                        <Ionicons name={isShared ? "checkbox" : "square-outline"} size={22} color={isShared ? "#3B82F6" : themeColors.subText} />
                        <Text style={[styles.shareText, { color: themeColors.subText }]}>Share with institution directory</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },

  filterBar: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 20, paddingTop: 10 },
  filterTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  filterTabText: { fontSize: 10, fontWeight: '800' },

  listBody: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  cardMain: { flexDirection: 'row' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 15 },
  letterTitle: { fontSize: 15, fontWeight: '700' },
  letterPreview: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800' },
  ownerText: { fontSize: 11, fontWeight: '500' },

  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10, borderTopWidth: 1, paddingTop: 10 },
  actionBtn: { padding: 5 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 14 },

  modalBg: { flex: 1 },
  modalBody: { padding: 24 },
  titleInput: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  contentInput: { fontSize: 16, lineHeight: 24, minHeight: 400, textAlignVertical: 'top' },
  saveBtnText: { fontWeight: '800', color: '#3B82F6', letterSpacing: 1 },
  shareToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 10 },
  shareText: { fontSize: 14, fontWeight: '600' }
});
