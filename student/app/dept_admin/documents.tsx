// app/dept_admin/documents.tsx
import React, { useState, useEffect } from "react";
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
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

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

export default function DeptAdminDocuments() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [staffName, setStaffName] = useState("");
    const [file, setFile] = useState<any>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE_URL}/api/accounts/documents/list/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const pickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
        if (!result.canceled) setFile(result.assets[0]);
    };

    const handleUpload = async () => {
        if (!title || !subjectName || !subjectCode || !staffName || !file) {
            return Alert.alert("Required", "Manifest requires title, subject, code, staff and source file.");
        }

        setUploading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", desc);
            formData.append("subject_name", subjectName);
            formData.append("subject_code", subjectCode);
            formData.append("staff_name", staffName);
            formData.append("file", {
                uri: file.uri,
                name: file.name || "asset.pdf",
                type: file.mimeType || "application/pdf"
            } as any);

            await axios.post(`${API_BASE_URL}/api/accounts/documents/upload/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                }
            });

            Alert.alert("Authorized", "Academic resource published successfully.");
            setModalVisible(false);
            setTitle(""); setDesc(""); setSubjectName(""); setSubjectCode(""); setStaffName(""); setFile(null);
            fetchDocuments();
        } catch (err) {
            Alert.alert("System Fault", "Could not commit resource to storage.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert("Erase Resource", "Remove this material from the academic archive?", [
            { text: "Abort", style: "cancel" },
            {
                text: "Confirm", style: "destructive", onPress: async () => {
                    const token = await AsyncStorage.getItem("accessToken");
                    try {
                        await axios.delete(`${API_BASE_URL}/api/accounts/documents/delete/${id}/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchDocuments();
                    } catch (err) {
                        Alert.alert("Failure", "Could not delete resource.");
                    }
                }
            }
        ]);
    };

    const renderDoc = ({ item }: { item: Document }) => (
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F115' }]}>
                <Ionicons name="document-text" size={24} color="#6366F1" />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.subjectText, { color: '#6366F1' }]}>{item.subject_name} ({item.subject_code})</Text>
                <View style={styles.metaRow}>
                    <Text style={[styles.staffText, { color: themeColors.subText }]}>By {item.staff_name}</Text>
                    <View style={[styles.dot, { backgroundColor: themeColors.border }]} />
                    <Text style={[styles.docType, { color: themeColors.subText }]}>RESOURCE</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.trashBtn, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Archives</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>STUDY MATERIAL REGISTRY</Text>
                </View>
                <TouchableOpacity onPress={fetchDocuments} style={[styles.refreshBtn, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name="refresh" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
            ) : (
                <FlatList
                    data={docs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderDoc}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.heroSection}>
                            <Text style={[styles.heroTitle, { color: themeColors.text }]}>Academic Cabinet</Text>
                            <Text style={[styles.heroDesc, { color: themeColors.subText }]}>Audit and provision study resources for the student body.</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="folder-off-outline" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>Cabinet is currently void.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: '#6366F1' }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.fabText}>PUBLISH</Text>
            </TouchableOpacity>

            {/* Upload Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTag}>NEW RESOURCE</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Provision Material</Text>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.subText }]}>FILE NOMENCLATURE</Text>
                                <TextInput style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border, color: themeColors.text }]} placeholder="e.g. Quantum Mechanics - Lecture 1" placeholderTextColor={themeColors.subText} value={title} onChangeText={setTitle} />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>SUBJECT</Text>
                                    <TextInput style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border, color: themeColors.text }]} placeholder="Subject Title" placeholderTextColor={themeColors.subText} value={subjectName} onChangeText={setSubjectName} />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>CODE</Text>
                                    <TextInput style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border, color: themeColors.text }]} placeholder="e.g. PHY101" placeholderTextColor={themeColors.subText} value={subjectCode} onChangeText={setSubjectCode} />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.subText }]}>ORCHESTRATOR</Text>
                                <TextInput style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border, color: themeColors.text }]} placeholder="Faculty Member Name" placeholderTextColor={themeColors.subText} value={staffName} onChangeText={setStaffName} />
                            </View>

                            <TouchableOpacity 
                                style={[styles.filePicker, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: '#6366F150' }]} 
                                onPress={pickFile}
                            >
                                {file ? (
                                    <View style={styles.fileSelected}>
                                        <Ionicons name="document-attach" size={24} color="#6366F1" />
                                        <Text style={[styles.fileName, { color: themeColors.text }]} numberOfLines={1}>{file.name}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.filePlaceholder}>
                                        <MaterialCommunityIcons name="file-upload-outline" size={24} color={themeColors.subText} />
                                        <Text style={[styles.filePlaceholderTxt, { color: themeColors.subText }]}>Attach Source File</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.uploadBtn, { backgroundColor: '#6366F1' }, uploading && { opacity: 0.7 }]}
                                onPress={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? <ActivityIndicator color="#fff" /> :
                                    <>
                                        <Text style={styles.uploadTxt}>INITIALIZE PUBLICATION</Text>
                                        <Ionicons name="shield-checkmark" size={18} color="#fff" />
                                    </>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            
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
    refreshBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    listContent: { padding: 25, paddingBottom: 150 },
    heroSection: { marginBottom: 35 },
    heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    heroDesc: { fontSize: 14, marginTop: 8, lineHeight: 22, opacity: 0.8 },

    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 32, padding: 20, marginBottom: 16, elevation: 4, borderWidth: 1 },
    iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1, marginLeft: 18 },
    cardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4, letterSpacing: -0.3 },
    subjectText: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    staffText: { fontSize: 11, fontWeight: '700' },
    dot: { width: 4, height: 4, borderRadius: 2 },
    docType: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    trashBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    fab: { position: 'absolute', bottom: 110, right: 25, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, elevation: 12, shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 10 },
    fabText: { color: '#fff', fontWeight: '900', marginLeft: 10, fontSize: 13, letterSpacing: 1 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalHeaderTag: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 2 },
    modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 30, letterSpacing: -0.8 },
    closeBtn: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    inputGroup: { marginBottom: 22 },
    row: { flexDirection: 'row', gap: 15 },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginLeft: 10 },
    input: { borderRadius: 20, padding: 18, fontSize: 15, fontWeight: '700', borderWidth: 1 },

    filePicker: { height: 70, borderRadius: 22, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 35 },
    fileSelected: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
    fileName: { flex: 1, fontSize: 14, fontWeight: '800' },
    filePlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    filePlaceholderTxt: { fontSize: 14, fontWeight: '800' },

    uploadBtn: { height: 64, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 8 },
    uploadTxt: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 25 }
});
