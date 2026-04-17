// app/admin/downloads.tsx
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
    ActivityIndicator,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function AdminDownloads() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    
    const [files, setFiles] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const docDir = (FileSystem as any).documentDirectory;
    const downloadDir = docDir ? `${docDir}studentDocs/` : null;

    const loadDownloads = async () => {
        try {
            if (!downloadDir) {
                setLoading(false);
                return;
            }
            const dirInfo = await FileSystem.getInfoAsync(downloadDir);
            if (!dirInfo.exists) {
                setFiles([]);
            } else {
                const fileList = await FileSystem.readDirectoryAsync(downloadDir);
                setFiles(fileList);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDownloads(); }, []);

    const openFile = async (fileName: string) => {
        if (!downloadDir) return;
        const fileUri = downloadDir + fileName;
        try {
            if (Platform.OS === "android") {
                const cUri = await FileSystem.getContentUriAsync(fileUri);
                const ext = fileName.split('.').pop()?.toLowerCase();
                const mimeType = getMime(ext);
                await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
                    data: cUri,
                    flags: 1,
                    type: mimeType,
                });
            } else {
                Alert.alert("iOS Preview", "File preview available in native 'Files' app.");
            }
        } catch (err) { Alert.alert("Error", "Could not open this file."); }
    };

    const getMime = (ext?: string) => {
        switch (ext) {
            case 'pdf': return 'application/pdf';
            case 'docx': case 'doc': return 'application/msword';
            case 'xlsx': case 'xls': return 'application/vnd.ms-excel';
            default: return '*/*';
        }
    };

    const toggleSelect = (fileName: string) => {
        if (selected.includes(fileName)) setSelected(selected.filter(f => f !== fileName));
        else setSelected([...selected, fileName]);
    };

    const deleteSelected = () => {
        Alert.alert("Delete Files?", `Are you sure you want to delete ${selected.length} downloaded files?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    for (let f of selected) {
                        if (downloadDir) {
                            await FileSystem.deleteAsync(downloadDir + f, { idempotent: true });
                        }
                    }
                    setSelected([]);
                    loadDownloads();
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: string }) => {
        const isSelected = selected.includes(item);
        const ext = item.split('.').pop()?.toLowerCase();

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }, isSelected && { borderColor: '#6366F1', backgroundColor: '#6366F105' }]}
                onPress={() => selected.length > 0 ? toggleSelect(item) : openFile(item)}
                onLongPress={() => toggleSelect(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconHole, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <MaterialCommunityIcons
                        name={ext === 'pdf' ? "file-pdf-box" : "file-document-outline"}
                        size={28}
                        color={ext === 'pdf' ? '#ef4444' : '#6366F1'}
                    />
                </View>
                <View style={styles.fileDetails}>
                    <Text style={[styles.fileName, { color: themeColors.text }]} numberOfLines={1}>{item}</Text>
                    <Text style={[styles.fileMeta, { color: themeColors.outline }]}>LOCAL FILE • {ext?.toUpperCase() || 'DATA'}</Text>
                </View>
                {selected.length > 0 ? (
                    <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={isSelected ? "#6366F1" : themeColors.outline}
                    />
                ) : (
                    <Ionicons name="chevron-forward" size={18} color={themeColors.outline} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBox}>
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Downloads</Text>
                        <Text style={[styles.headerSub, { color: themeColors.subText }]}>OFFLINE FILES</Text>
                    </View>
                    <TouchableOpacity onPress={loadDownloads} style={styles.refreshBtn}>
                        <Ionicons name="sync" size={20} color="#6366F1" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
                ) : (
                    <FlatList
                        data={files}
                        keyExtractor={item => item}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.summaryBar}>
                                <Text style={[styles.summaryTxt, { color: themeColors.subText }]}>SAVED: <Text style={{ color: '#6366F1', fontWeight: '900' }}>{files.length} FILES</Text></Text>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialCommunityIcons name="folder-zip-outline" size={80} color={themeColors.border} />
                                <Text style={[styles.emptyTxt, { color: themeColors.subText }]}>No files downloaded yet.</Text>
                            </View>
                        }
                    />
                )}

                {selected.length > 0 && (
                    <View style={[styles.actionDock, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
                        <View style={styles.selectionInfo}>
                            <Text style={styles.selectionCount}>{selected.length}</Text>
                            <Text style={styles.selectionLab}>SELECTED</Text>
                        </View>
                        <TouchableOpacity style={styles.purgeAction} onPress={deleteSelected}>
                            <Ionicons name="trash-bin-outline" size={20} color="#fff" />
                            <Text style={styles.purgeTxt}>DELETE</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitleBox: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSub: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    refreshBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 20, paddingBottom: 120 },
    summaryBar: { marginBottom: 20, paddingHorizontal: 5 },
    summaryTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 18, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 15, borderWidth: 1 },
    iconHole: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    fileDetails: { flex: 1, marginLeft: 15 },
    fileName: { fontSize: 15, fontWeight: '800' },
    fileMeta: { fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 25, paddingHorizontal: 50, lineHeight: 22 },

    actionDock: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 80, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    selectionInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    selectionCount: { color: '#fff', fontSize: 24, fontWeight: '900' },
    selectionLab: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    purgeAction: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, elevation: 4 },
    purgeTxt: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 }
});
