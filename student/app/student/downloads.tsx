import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  Alert,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StyleSheet,
  ImageBackground,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
// import { documentDirectory } from "expo-file-system"; // Removed: not exported
// Helper: detect MIME type
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
  const pathname = usePathname();

  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Cast to any because documentDirectory types are missing in this version
  const docDir = (FileSystem as any).documentDirectory;
  const downloadDir = docDir ? docDir + "studentDocs/" : null;

  const loadDownloads = async () => {
    try {
      if (!downloadDir) {
        Alert.alert("Error", "Unable to access file system");
        return;
      }
      const folderExists = await FileSystem.getInfoAsync(downloadDir);
      if (!folderExists.exists) {
        setFiles([]);
        return;
      }
      const fileList = await FileSystem.readDirectoryAsync(downloadDir);
      setFiles(fileList);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load downloads");
    }
  };

  useEffect(() => { loadDownloads(); }, []);

  const openFile = async (fileName: string) => {
    if (!downloadDir) {
      Alert.alert("Error", "Unable to access file system");
      return;
    }
    const fileUri = downloadDir + fileName;
    try {
      if (Platform.OS === "android") {
        const cUri = await FileSystem.getContentUriAsync(fileUri);
        const mimeType = getMimeType(fileName);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: cUri,
          flags: 1,
          type: mimeType,
        });
      } else {
        Alert.alert("Not Supported", "Open With is supported only on Android.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to open file");
    }
  };

  const toggleSelect = (fileName: string) => {
    if (selected.includes(fileName)) {
      setSelected(selected.filter((f) => f !== fileName));
    } else {
      setSelected([...selected, fileName]);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${selected.length} file(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteFiles },
      ]
    );
  };

  const deleteFiles = async () => {
    try {
      if (!downloadDir) {
        Alert.alert("Error", "Unable to access file system");
        return;
      }
      for (let file of selected) {
        const fileUri = downloadDir + file;
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
      setSelected([]);
      setDeleteMode(false);
      loadDownloads();
      Alert.alert("Deleted", "Selected files removed");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to delete files");
    }
  };

  const handleNav = (path: string) => { router.push(path as any); };

  return (
    <ImageBackground
      source={require("../../assets/images/back.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* 🔹 Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MY DOWNLOADS</Text>
          <TouchableOpacity
            style={{ position: "absolute", right: 15 }}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons
              name={showMenu ? "chevron-up" : "chevron-down"}
              size={24}
              color="#30e4de"
            />
          </TouchableOpacity>
        </View>

        {/* 🔹 Dropdown Menu */}
        {showMenu && (
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => router.push("/student/downloads")}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.menuText}>Downloads</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => router.push("/student/letter")}
            >
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.menuText}>Forms</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => router.push("/student/results")}
            >
              <Ionicons name="ribbon-outline" size={20} color="#fff" />
              <Text style={styles.menuText}>Results</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* 🔹 File List */}
        <FlatList
          data={files}
          keyExtractor={(item) => item}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => (deleteMode ? toggleSelect(item) : openFile(item))}
              style={[
                styles.card,
                selected.includes(item) && { backgroundColor: "#ffdddd" },
              ]}
            >
              <Text style={{ fontSize: 15 }}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {/* 🔹 Delete Button */}
        {deleteMode && selected.length > 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <Button
              title={`Delete ${selected.length} file(s)`}
              onPress={confirmDelete}
              color="red"
            />
          </View>
        )}

        {/* 🔹 Empty State */}
        {files.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No downloads yet 📭
          </Text>
        )}

        {/* 🔹 Bottom Navigation */}
        <View style={styles.bottomNav}>
          <Ionicons
            name="home"
            size={28}
            color={pathname === "/student/dashboard" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/dashboard")}
          />
          <Ionicons
            name="search"
            size={28}
            color={pathname === "/student/search" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/search")}
          />
          <Ionicons
            name="desktop-outline"
            size={28}
            color={pathname === "/student/notice" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/notice")}
          />
          <Ionicons
            name="download-outline"
            size={28}
            color={pathname === "/student/downloads" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/downloads")}
          />
          <Ionicons
            name="person-circle-outline"
            size={28}
            color={pathname === "/student/profile" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/profile")}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#30e4de" },
  menuBox: {
    backgroundColor: "#ffffffdd",
    borderRadius: 12,
    paddingVertical: 15,
    margin: 15,
    alignItems: "center",
    elevation: 5,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "80%",
    backgroundColor: "#30e4de",
    borderRadius: 10,
    marginVertical: 8,
    justifyContent: "center",
  },
  menuText: { color: "#fff", fontSize: 16, marginLeft: 8, fontWeight: "600" },
  card: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
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
