import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

const getMimeType = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "doc":
    case "docx": return "application/msword";
    case "xls":
    case "xlsx": return "application/vnd.ms-excel";
    case "ppt":
    case "pptx": return "application/vnd.ms-powerpoint";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "txt": return "text/plain";
    case "mp4": return "video/mp4";
    default: return "*/*";
  }
};

export default function StudentDownloads() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);

  const docDir = (FileSystem as any).documentDirectory;
  const downloadDir = docDir ? docDir + "studentDocs/" : null;

  const loadDownloads = async () => {
    try {
      if (!downloadDir) return;
      const folderExists = await FileSystem.getInfoAsync(downloadDir);
      if (!folderExists.exists) { setFiles([]); return; }
      const fileList = await FileSystem.readDirectoryAsync(downloadDir);
      setFiles(fileList);
    } catch (err) { }
  };

  useEffect(() => { loadDownloads(); }, []);

  const openFile = async (fileName: string) => {
    if (!downloadDir) return;
    const fileUri = downloadDir + fileName;
    try {
      if (Platform.OS === "android") {
        const cUri = await FileSystem.getContentUriAsync(fileUri);
        const mimeType = getMimeType(fileName);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: cUri, flags: 1, type: mimeType,
        });
      } else { Alert.alert("Information", "File viewing is optimized for Android device builds."); }
    } catch (err) { Alert.alert("Error", "Failed to open file"); }
  };

  const toggleSelect = (fileName: string) => {
    if (selected.includes(fileName)) setSelected(selected.filter((f) => f !== fileName));
    else setSelected([...selected, fileName]);
  };

  const deleteFiles = async () => {
    try {
      if (!downloadDir) return;
      for (let file of selected) await FileSystem.deleteAsync(downloadDir + file, { idempotent: true });
      setSelected([]);
      setDeleteMode(false);
      loadDownloads();
      Alert.alert("Deleted", "Files removed successfully.");
    } catch (err) { }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Offline Files</Text>
          <TouchableOpacity onPress={() => { if(deleteMode) deleteFiles(); else if(files.length > 0) setDeleteMode(true); }}>
            <Ionicons name={deleteMode ? "trash" : "trash-outline"} size={24} color={deleteMode ? "#EF4444" : themeColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsBar}>
            <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: themeColors.text }]}>{files.length}</Text>
                <Text style={[styles.statLab, { color: themeColors.subText }]}>FILES</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: themeColors.text }]}>{selected.length}</Text>
                <Text style={[styles.statLab, { color: themeColors.subText }]}>SELECTED</Text>
            </View>
            {deleteMode && (
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]} onPress={() => { setDeleteMode(false); setSelected([]); }}>
                    <Text style={[styles.cancelText, { color: themeColors.subText }]}>CANCEL</Text>
                </TouchableOpacity>
            )}
        </View>

        <FlatList
          data={files}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listBody}
          renderItem={({ item }) => {
              const isSelected = selected.includes(item);
              const ext = item.split(".").pop()?.toUpperCase() || "FILE";
              return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => (deleteMode ? toggleSelect(item) : openFile(item))}
                    style={[
                        styles.card, 
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                        isSelected && { borderColor: '#EF4444', backgroundColor: isDark ? '#EF444420' : '#FEF2F2' }
                    ]}
                  >
                    <View style={[styles.fileIcon, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}>
                        <MaterialCommunityIcons 
                            name={ext === 'PDF' ? 'file-pdf-box' : 'file-document-outline'} 
                            size={28} 
                            color={ext === 'PDF' ? '#EF4444' : '#6366F1'} 
                        />
                    </View>
                    <View style={styles.fileInfo}>
                        <Text style={[styles.fileName, { color: themeColors.text }]} numberOfLines={1}>{item}</Text>
                        <Text style={[styles.fileMeta, { color: themeColors.subText }]}>{ext} DOCUMENT</Text>
                    </View>
                    {deleteMode && (
                         <Ionicons 
                            name={isSelected ? "checkbox" : "square-outline"} 
                            size={24} 
                            color={isSelected ? "#EF4444" : themeColors.border} 
                        />
                    )}
                  </TouchableOpacity>
              );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={64} color={themeColors.border} />
              <Text style={[styles.emptyText, { color: themeColors.subText }]}>No materials downloaded for offline access.</Text>
            </View>
          }
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },

  statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20, paddingTop: 10 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLab: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 20, marginHorizontal: 20 },
  cancelBtn: { marginLeft: 'auto', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  cancelText: { fontSize: 10, fontWeight: '800' },

  listBody: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  fileIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, marginLeft: 15 },
  fileName: { fontSize: 14, fontWeight: '700' },
  fileMeta: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }
});
