// app/dept_admin/downloads.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Alert,
    TouchableOpacity,
    Platform,
    StyleSheet,
    StatusBar,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

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

export default function DeptAdminDownloads() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();

    const [files, setFiles] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [deleteMode, setDeleteMode] = useState(false);
    const [loading, setLoading] = useState(false);

    // Ensure documentDirectory is accessed correctly
    // @ts-ignore
    const docDir = FileSystem.documentDirectory;
    const downloadDir = docDir ? `${docDir}studentDocs/` : null;

    const loadDownloads = async () => {
        setLoading(true);
        try {
            if (!downloadDir) return;
            const dirInfo = await FileSystem.getInfoAsync(downloadDir);
            if (!dirInfo.exists) {
                setFiles([]);
                return;
            }
            const fileList = await FileSystem.readDirectoryAsync(downloadDir);
            setFiles(fileList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDownloads(); }, []);

    const openFile = async (fileName: string) => {
        if (!downloadDir) {
            Alert.alert("Fault", "Critical file system path missing.");
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
                Alert.alert("Environmental Restriction", "File execution is only supported on Android hardware.");
            }
        } catch (err) {
            Alert.alert("Launch Failure", "Could not initialize viewer for this asset.");
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
            "Purge Assets",
            `Confirm permanent deletion of ${selected.length} architectural files?`,
            [
                { text: "ABORT", style: "cancel" },
                { text: "PURGE", style: "destructive", onPress: deleteFiles },
            ]
        );
    };

    const deleteFiles = async () => {
        try {
            if (!downloadDir) return;
            for (let file of selected) {
                const fileUri = downloadDir + file;
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
            setSelected([]);
            setDeleteMode(false);
            loadDownloads();
            Alert.alert("Purged", "Target assets removed from local storage.");
        } catch (err) {
            Alert.alert("Process Error", "Failed to purge selected assets.");
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Archives</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>OFFLINE REPOSITORY</Text>
                </View>
                {files.length > 0 && (
                    <TouchableOpacity 
                        onPress={() => {
                            setDeleteMode(!deleteMode);
                            setSelected([]);
                        }} 
                        style={[styles.actionBtn, { backgroundColor: deleteMode ? '#EF444420' : '#6366F120' }]}
                    >
                        <Ionicons name={deleteMode ? "close" : "trash-outline"} size={20} color={deleteMode ? "#EF4444" : "#6366F1"} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={files}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={<Text style={[styles.sectionTitle, { color: themeColors.subText }]}>LOCAL FILE SYSTEM</Text>}
                    renderItem={({ item }) => {
                        const isSelected = selected.includes(item);
                        return (
                            <TouchableOpacity
                                onPress={() => (deleteMode ? toggleSelect(item) : openFile(item))}
                                style={[
                                    styles.card,
                                    { backgroundColor: themeColors.card, borderColor: isSelected ? '#EF4444' : themeColors.border }
                                ]}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: isSelected ? '#EF444415' : '#6366F110' }]}>
                                    <MaterialCommunityIcons 
                                        name={item.endsWith('.pdf') ? 'file-pdf-box' : 'file-document-outline'} 
                                        size={28} 
                                        color={isSelected ? '#EF4444' : '#6366F1'} 
                                    />
                                </View>
                                <View style={styles.fileInfo}>
                                    <Text style={[styles.fileName, { color: themeColors.text }]} numberOfLines={1}>{item}</Text>
                                    <Text style={[styles.fileSize, { color: themeColors.subText }]}>INTERNAL STORAGE</Text>
                                </View>
                                {deleteMode ? (
                                    <View style={[styles.checkbox, { borderColor: isSelected ? '#EF4444' : themeColors.border, backgroundColor: isSelected ? '#EF4444' : 'transparent' }]}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                ) : (
                                    <Ionicons name="chevron-forward" size={18} color={themeColors.border} />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="folder-open-outline" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>Your archive is empty.</Text>
                        </View>
                    }
                />
            )}

            {deleteMode && selected.length > 0 && (
                <View style={[styles.purgeFooter, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
                    <TouchableOpacity style={styles.purgeBtn} onPress={confirmDelete}>
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={styles.purgeTxt}>PURGE {selected.length} ASSETS</Text>
                    </TouchableOpacity>
                </View>
            )}

            <DeptAdminBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitleBox: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    headerSub: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    actionBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 25, paddingBottom: 150 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 15, marginBottom: 12, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    iconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    fileInfo: { flex: 1, marginLeft: 15, marginRight: 10 },
    fileName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
    fileSize: { fontSize: 10, fontWeight: '700', marginTop: 2, opacity: 0.7 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },

    purgeFooter: { position: 'absolute', bottom: 85, left: 20, right: 20, padding: 15, borderRadius: 24, borderWidth: 1, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    purgeBtn: { backgroundColor: '#EF4444', height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    purgeTxt: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
