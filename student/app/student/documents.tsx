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
  StatusBar,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";

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
  const { isDark, theme: themeColors } = useTheme();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchDocs = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/documents/list/`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const absoluteData = data.map((doc: any) => ({
          ...doc,
          file: doc.file.startsWith("http") ? doc.file : `${API_BASE_URL}${doc.file}`,
        }));
        setDocs(absoluteData);
      }
    } catch (err) { }
    finally { setLoading(false); }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const dir = FileSystem.documentDirectory;
      if (!dir) return;
      const downloadDir = `${dir}studentDocs/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      const extension = fileUrl.substring(fileUrl.lastIndexOf("."));
      const fileUri = `${downloadDir}${fileName}${extension}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      if (uri) {
        Alert.alert("Success", "File downloaded and ready to open.");
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      }
    } catch (e) { Alert.alert("Error", "Download failed"); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const subjects = [...new Set(docs.map((doc) => doc.subject_code))];
  const filteredDocs = filter ? docs.filter((doc) => doc.subject_code === filter) : docs;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Study Materials</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.subjectContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScroll}>
                <TouchableOpacity style={[styles.subjectTab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, !filter && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }]} onPress={() => setFilter(null)}>
                    <Text style={[styles.subjectTabText, { color: themeColors.subText }, !filter && { color: '#ffffff' }]}>ALL</Text>
                </TouchableOpacity>
                {subjects.map(sub => (
                    <TouchableOpacity 
                        key={sub} 
                        style={[styles.subjectTab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, filter === sub && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }]} 
                        onPress={() => setFilter(sub)}
                    >
                        <Text style={[styles.subjectTabText, { color: themeColors.subText }, filter === sub && { color: '#ffffff' }]}>{sub}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listBody}
            data={filteredDocs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.cardMain}>
                    <View style={[styles.fileIcon, { backgroundColor: isDark ? '#374151' : '#FEF2F2' }]}>
                        <MaterialCommunityIcons name="file-pdf-box" size={32} color="#EF4444" />
                    </View>
                    <View style={styles.docInfo}>
                        <Text style={[styles.docTitle, { color: themeColors.text }]}>{item.title}</Text>
                        <Text style={[styles.docSub, { color: themeColors.subText }]}>{item.subject_name}</Text>
                    </View>
                    <TouchableOpacity style={[styles.dlBtn, { backgroundColor: isDark ? '#374151' : '#EFF6FF' }]} onPress={() => downloadFile(item.file, `${item.title}_${item.id}`)}>
                        <Ionicons name="cloud-download-outline" size={22} color="#3B82F6" />
                    </TouchableOpacity>
                </View>
                <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                    <View style={styles.staffMeta}>
                        <Ionicons name="person-outline" size={12} color={themeColors.subText} />
                        <Text style={[styles.staffName, { color: themeColors.subText }]}>{item.staff_name}</Text>
                    </View>
                    <Text style={[styles.descText, { color: themeColors.subText }]} numberOfLines={1}>{item.description}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="folder-open-outline" size={64} color={themeColors.border} />
                <Text style={[styles.emptyText, { color: themeColors.subText }]}>No materials available in this subject.</Text>
              </View>
            }
          />
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },

  subjectContainer: { marginBottom: 15 },
  subjectScroll: { paddingHorizontal: 24, gap: 10 },
  subjectTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  subjectTabText: { fontSize: 10, fontWeight: '800' },

  listBody: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 5 },
  card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  fileIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 15 },
  docTitle: { fontSize: 14, fontWeight: '700' },
  docSub: { fontSize: 11, marginTop: 2 },
  dlBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  cardFooter: { marginTop: 15, borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  staffMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  staffName: { fontSize: 10, fontWeight: '600' },
  descText: { fontSize: 10, maxWidth: '60%' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 14 }
});
