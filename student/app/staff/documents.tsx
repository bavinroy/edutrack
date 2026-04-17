import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import StaffBottomNav from "../../components/StaffBottomNav";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

interface Document {
  id: number;
  title: string;
  description: string;
  subject_name: string;
  subject_code: string;
  staff_name: string;
  file: string;
  created_at?: string;
}

export default function DocumentLibrary() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  // Upload State
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setFetching(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/api/accounts/documents/list/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const absoluteData = res.data.map((doc: any) => ({
        ...doc,
        file: doc.file.startsWith("http") ? doc.file : `${API_BASE_URL}${doc.file}`,
      }));
      setDocs(absoluteData);
    } catch (err) { }
    finally { setLoading(false); setFetching(false); }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const uploadFile = async () => {
    if (!title || !subjectName || !file) return Alert.alert("Missing Details", "Provide title, subject and select a file.");
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject_name", subjectName);
      formData.append("subject_code", subjectCode);
      formData.append("file", {
        uri: file.uri,
        name: file.name || "document.pdf",
        type: file.mimeType || "application/pdf",
      } as any);

      await axios.post(`${API_BASE_URL}/api/accounts/documents/upload/`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      Alert.alert("Success", "Academic asset uploaded.");
      setUploadModalVisible(false);
      setTitle(""); setSubjectName(""); setSubjectCode(""); setFile(null);
      fetchDocuments();
    } catch (err) {
      Alert.alert("Upload Error", "Failed to sync document.");
    } finally { setUploading(false); }
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Purge Document", "Permanently remove this academic asset?", [
      { text: "Cancel" },
      { text: "Purge", style: "destructive", onPress: async () => {
          const token = await AsyncStorage.getItem("accessToken");
          await axios.delete(`${API_BASE_URL}/api/accounts/documents/delete/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchDocuments();
      }}
    ]);
  };

  const getFilteredDocs = () => {
    let res = docs;
    if (searchQuery) {
        res = res.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.subject_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedSubject !== "ALL") {
        res = res.filter(d => d.subject_name === selectedSubject);
    }
    return res;
  };

  const getFileStyle = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { color: '#EF4444', icon: 'file-pdf' };
    if (ext === 'doc' || ext === 'docx') return { color: '#3B82F6', icon: 'file-word' };
    if (ext === 'xls' || ext === 'xlsx') return { color: '#10B981', icon: 'file-excel' };
    return { color: '#6366F1', icon: 'file-alt' };
  };

  const subjects = ["ALL", ...Array.from(new Set(docs.map(d => d.subject_name)))];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Study Assets</Text>
        <TouchableOpacity style={styles.uploadTrigger} onPress={() => setUploadModalVisible(true)}>
          <Ionicons name="cloud-upload" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Global Filter Bar */}
      <View style={styles.searchSection}>
         <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={20} color={themeColors.subText} />
            <TextInput 
               style={[styles.searchInput, { color: themeColors.text }]}
               placeholder="Search by title or subject..."
               placeholderTextColor={themeColors.subText}
               value={searchQuery}
               onChangeText={setSearchQuery}
            />
         </View>
      </View>

      {/* Subject Selector */}
      <View style={styles.subjectRow}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScroll}>
            {subjects.map(s => (
              <TouchableOpacity 
                 key={s} 
                 style={[styles.subjectChip, { backgroundColor: themeColors.card, borderColor: themeColors.border }, selectedSubject === s && styles.activeChip]}
                 onPress={() => setSelectedSubject(s)}
              >
                 <Text style={[styles.subjectText, { color: themeColors.text }, selectedSubject === s && { color: '#fff' }]}>{s.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
         </ScrollView>
      </View>

      <FlatList
        data={getFilteredDocs()}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listBody}
        refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchDocuments} colors={["#6366F1"]} />}
        ListHeaderComponent={<Text style={[styles.sectionTitle, { color: themeColors.subText }]}>RECENTLY ADDED ASSETS</Text>}
        renderItem={({ item }) => {
          const style = getFileStyle(item.file);
          return (
            <View style={[styles.docCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.docIconBox, { backgroundColor: `${style.color}15` }]}>
                 <FontAwesome5 name={style.icon} size={24} color={style.color} />
              </View>
              <View style={styles.docInfo}>
                 <Text style={[styles.docTitle, { color: themeColors.text }]} numberOfLines={1}>{item.title}</Text>
                 <Text style={styles.docMeta}>{item.subject_name} • {item.subject_code}</Text>
              </View>
              <View style={styles.docActions}>
                 <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.docDelete}>
                    <Ionicons name="trash" size={18} color="#EF4444" />
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => router.push(`/staff/document_viewer?url=${encodeURIComponent(item.file)}&title=${encodeURIComponent(item.title)}` as any)} style={styles.docOpen}>
                    <Ionicons name="eye" size={18} color="#6366F1" />
                 </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyShell}>
             <Ionicons name="document-text-outline" size={60} color={themeColors.border} />
             <Text style={[styles.emptyText, { color: themeColors.subText }]}>No documents found matching your criteria.</Text>
          </View>
        }
      />

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} animationType="slide">
        <SafeAreaView style={[styles.modalArea, { backgroundColor: themeColors.bg }]}>
           <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Publish Study Asset</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={styles.closeModal}>
                 <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
           </View>

           <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>DOCUMENT TITLE</Text>
              <TextInput 
                 style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                 placeholder="e.g. Unit 3: Thermodynamics Notes"
                 placeholderTextColor={themeColors.subText}
                 value={title}
                 onChangeText={setTitle}
              />

              <View style={styles.inputRow}>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>SUBJECT NAME</Text>
                    <TextInput 
                       style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                       placeholder="e.g. Physics"
                       placeholderTextColor={themeColors.subText}
                       value={subjectName}
                       onChangeText={setSubjectName}
                    />
                 </View>
                 <View style={{ width: 15 }} />
                 <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>CODE</Text>
                    <TextInput 
                       style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                       placeholder="PH101"
                       placeholderTextColor={themeColors.subText}
                       value={subjectCode}
                       onChangeText={setSubjectCode}
                    />
                 </View>
              </View>

              <TouchableOpacity style={[styles.filePicker, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={pickFile}>
                 <View style={[styles.pickerIcon, { backgroundColor: file ? '#10B98115' : '#6366F115' }]}>
                    <Ionicons name={file ? "checkmark-circle" : "document-attach"} size={28} color={file ? "#10B981" : "#6366F1"} />
                 </View>
                 <View style={styles.pickerInfo}>
                    <Text style={[styles.pickerTitle, { color: themeColors.text }]}>{file ? file.name : "Select Document File"}</Text>
                    <Text style={styles.pickerMeta}>{file ? `${(file.size!/1024).toFixed(1)} KB` : "Supports PDF, DOC, XLS (MAX 50MB)"}</Text>
                 </View>
              </TouchableOpacity>

              <TouchableOpacity 
                 style={[styles.publishBtn, (!file || !title) && { opacity: 0.5 }]} 
                 disabled={!file || !title || uploading}
                 onPress={uploadFile}
              >
                 {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.publishBtnText}>PUBLISH TO STUDENTS</Text>}
              </TouchableOpacity>
           </ScrollView>
        </SafeAreaView>
      </Modal>

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
     paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  uploadTrigger: { padding: 4 },

  searchSection: { padding: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, borderRadius: 16, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600' },

  subjectRow: { marginBottom: 20 },
  subjectScroll: { paddingHorizontal: 20, gap: 10 },
  subjectChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  activeChip: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  subjectText: { fontSize: 11, fontWeight: '800' },

  listBody: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 24, borderWidth: 1, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03 },
  docIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 15 },
  docTitle: { fontSize: 15, fontWeight: '800' },
  docMeta: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  docActions: { flexDirection: 'row', gap: 10 },
  docDelete: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EF444410', justifyContent: 'center', alignItems: 'center' },
  docOpen: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#6366F110', justifyContent: 'center', alignItems: 'center' },

  emptyShell: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 13, fontWeight: '600', marginTop: 15, textAlign: 'center', marginHorizontal: 40 },

  modalArea: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeModal: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 25 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
  input: { padding: 18, borderRadius: 16, borderWidth: 1, fontSize: 15, fontWeight: '600', marginBottom: 20 },
  inputRow: { flexDirection: 'row' },
  filePicker: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginTop: 10, marginBottom: 30 },
  pickerIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  pickerInfo: { flex: 1 },
  pickerTitle: { fontSize: 15, fontWeight: '800' },
  pickerMeta: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  publishBtn: { backgroundColor: '#6366F1', height: 62, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
