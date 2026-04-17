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
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import StaffBottomNav from "../../components/StaffBottomNav";
import { theme } from "../theme";

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

const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "pdf": return { name: "document-text", color: "#E53935" };
        case "xls":
        case "xlsx": return { name: "grid", color: "#43A047" };
        case "doc":
        case "docx": return { name: "document", color: "#1976D2" };
        case "jpg":
        case "png":
        case "jpeg": return { name: "image", color: "#FB8C00" };
        default: return { name: "document-outline", color: theme.colors.outline };
    }
};

export default function StaffDownloads() {
    const router = useRouter();
    const pathname = usePathname();

    const [files, setFiles] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [deleteMode, setDeleteMode] = useState(false);

    // Ensure documentDirectory is accessed correctly
    // @ts-ignore: documentDirectory exists at runtime
    const docDir = FileSystem.documentDirectory;
    const downloadDir = docDir ? `${docDir}studentDocs/` : null;

    const loadDownloads = async () => {
        try {
            if (!downloadDir) {
                console.log("File system not accessible or running on Web.");
                return;
            }

            const dirInfo = await FileSystem.getInfoAsync(downloadDir);
            if (!dirInfo.exists) {
                setFiles([]);
                return;
            }

            const fileList = await FileSystem.readDirectoryAsync(downloadDir);
            setFiles(fileList);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { loadDownloads(); }, []);

    const openFile = async (fileName: string) => {
        if (deleteMode) {
            toggleSelect(fileName);
            return;
        }

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

    const toggleDeleteMode = () => {
        if (deleteMode) {
            setDeleteMode(false);
            setSelected([]);
        } else {
            setDeleteMode(true);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Downloads</Text>

                <TouchableOpacity onPress={toggleDeleteMode} style={styles.headerBtn}>
                    <Ionicons
                        name={deleteMode ? "close" : "trash-outline"}
                        size={24}
                        color={deleteMode ? theme.colors.onSurface : theme.colors.error}
                    />
                </TouchableOpacity>
            </View>

            {/* File List */}
            <FlatList
                data={files}
                keyExtractor={(item) => item}
                contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="folder-open-outline" size={64} color={theme.colors.outlineVariant} />
                        <Text style={styles.emptyText}>No downloads found</Text>
                        <Text style={styles.emptySubText}>Files you download will appear here.</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const icon = getFileIcon(item);
                    const isSelected = selected.includes(item);

                    return (
                        <TouchableOpacity
                            onPress={() => openFile(item)}
                            onLongPress={() => {
                                setDeleteMode(true);
                                toggleSelect(item);
                            }}
                            delayLongPress={300}
                            style={[
                                styles.card,
                                isSelected && styles.selectedCard
                            ]}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: icon.color + '20' }]}>
                                <Ionicons name={icon.name as any} size={24} color={icon.color} />
                            </View>

                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName} numberOfLines={1}>{item}</Text>
                                <Text style={styles.fileMeta}>Tap to open • Long press to manage</Text>
                            </View>

                            {deleteMode && (
                                <View style={styles.checkbox}>
                                    {isSelected ? (
                                        <Ionicons name="checkbox" size={24} color={theme.colors.primary} />
                                    ) : (
                                        <Ionicons name="square-outline" size={24} color={theme.colors.outline} />
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Delete Actions Bar */}
            {deleteMode && (
                <View style={styles.actionBar}>
                    <Text style={styles.selectionText}>{selected.length} Selected</Text>
                    <TouchableOpacity
                        style={[styles.deleteButton, selected.length === 0 && styles.disabledButton]}
                        onPress={confirmDelete}
                        disabled={selected.length === 0}
                    >
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            <StaffBottomNav />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        padding: 20,
        paddingTop: 50,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.colors.background,
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: theme.colors.onSurface },
    headerBtn: { padding: 5 },

    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 12,
        borderRadius: theme.shapes.medium,
        backgroundColor: theme.colors.surface,
        elevation: 2,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    selectedCard: {
        backgroundColor: theme.colors.primaryContainer + '30',
        borderColor: theme.colors.primary,
    },
    iconBox: {
        width: 48, height: 48,
        borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onSurface,
        marginBottom: 2
    },
    fileMeta: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant
    },
    checkbox: {
        paddingLeft: 10
    },

    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: theme.colors.onSurface,
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptySubText: {
        marginTop: 6,
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
    },

    actionBar: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        backgroundColor: theme.colors.inverseSurface,
        padding: 16,
        borderRadius: theme.shapes.large,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    selectionText: {
        color: theme.colors.inverseOnSurface,
        fontWeight: 'bold',
        fontSize: 16
    },
    deleteButton: {
        backgroundColor: theme.colors.error,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: theme.shapes.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    disabledButton: {
        backgroundColor: theme.colors.outline,
        opacity: 0.5
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
});
