// app/admin/documents.tsx
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
    Dimensions,
    StatusBar,
    Modal,
    ScrollView,
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
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

export default function AdminDocuments() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [staffName, setStaffName] = useState("");
    const [file, setFile] = useState<any>(null);

    const fetchDocuments = async () => {
        setFetching(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE_URL}/api/accounts/documents/list/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDocs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const pickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
        if (!result.canceled) setFile(result.assets[0]);
    };

    const handleUpload = async () => {
        if (!title || !subjectName || !subjectCode || !staffName || !file) {
            return Alert.alert("Missing Details", "Please fill in all required fields.");
        }
        setIsUploading(true);
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
                name: file.name || "document.pdf",
                type: file.mimeType || "application/octet-stream",
            } as any);

            await axios.post(`${API_BASE_URL}/api/accounts/documents/upload/`, formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
            });
            Alert.alert("Success", "The document has been uploaded.");
            setModalVisible(false);
            resetForm();
            fetchDocuments();
        } catch (err) {
            Alert.alert("Error", "Could not upload document. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setTitle(""); setDesc(""); setSubjectName(""); setSubjectCode(""); setStaffName(""); setFile(null);
    };

    const deleteDoc = (id: number) => {
        Alert.alert("Delete Document?", "This file will be permanently removed. Still delete?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    const token = await AsyncStorage.getItem("accessToken");
                    try {
                        await axios.delete(`${API_BASE_URL}/api/accounts/documents/delete/${id}/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchDocuments();
                    } catch (err) { Alert.alert("Error", "Failed to delete the document."); }
                }
            }
        ]);
    };

    const renderDoc = ({ item }: { item: Document }) => (
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.cardHdr}>
                <View style={[styles.iconHole, { backgroundColor: '#6366F115' }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color="#6366F1" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[styles.docTitle, { color: themeColors.text }]}>{item.title}</Text>
                    <Text style={[styles.docSub, { color: themeColors.subText }]}>{item.subject_name} ({item.subject_code})</Text>
                </View>
                <TouchableOpacity onPress={() => deleteDoc(item.id)} style={[styles.purgeBtn, { backgroundColor: isDark ? '#450a0a' : '#FEF2F2' }]}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {item.description ? (
                <View style={[styles.descBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                    <Text style={[styles.docDesc, { color: themeColors.subText }]}>{item.description}</Text>
                </View>
            ) : null}

            <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                <View style={styles.originBadge}>
                    <Ionicons name="person-outline" size={12} color={themeColors.outline} />
                    <Text style={[styles.staffName, { color: themeColors.outline }]}>{item.staff_name.toUpperCase()}</Text>
                </View>
                <TouchableOpacity style={[styles.accessBtn, { backgroundColor: '#6366F115' }]}>
                    <Text style={styles.accessTxt}>VIEW FILE</Text>
                    <Ionicons name="eye" size={14} color="#6366F1" />
                </TouchableOpacity>
            </View>
        </View>
    );

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
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Documents</Text>
                        <Text style={[styles.headerSub, { color: themeColors.subText }]}>MANAGE FILES</Text>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                        <Ionicons name="add-circle" size={28} color="#6366F1" />
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
                        refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchDocuments} colors={["#6366F1"]} />}
                        ListHeaderComponent={
                            <View style={[styles.intelBoard, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
                                <View style={styles.intelTile}>
                                    <Text style={styles.intelVal}>{docs.length}</Text>
                                    <Text style={styles.intelLab}>TOTAL FILES</Text>
                                </View>
                                <View style={styles.intelDivider} />
                                <View style={[styles.intelTile, { alignItems: 'flex-start', paddingLeft: 20 }]}>
                                    <Text style={[styles.intelVal, { color: '#6366F1' }]}>ACTIVE</Text>
                                    <Text style={styles.intelLab}>DRIVE STATUS</Text>
                                </View>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialCommunityIcons name="folder-off-outline" size={80} color={themeColors.border} />
                                <Text style={[styles.emptyTxt, { color: themeColors.subText }]}>No documents found.</Text>
                            </View>
                        }
                    />
                )}

                {/* Upload Modal */}
                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
                            <View style={styles.modalHdr}>
                                <Text style={[styles.modalRole, { color: '#6366F1' }]}>UPLOAD FILE</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close-circle" size={28} color={themeColors.outline} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.inpGrp}>
                                    <Text style={[styles.inpLab, { color: themeColors.subText }]}>TITLE</Text>
                                    <TextInput style={[styles.inp, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} value={title} onChangeText={setTitle} placeholder="Document Name" placeholderTextColor={themeColors.outline} />
                                </View>

                                <View style={styles.inpGrp}>
                                    <Text style={[styles.inpLab, { color: themeColors.subText }]}>ABOUT FILE</Text>
                                    <TextInput style={[styles.inp, { height: 100, textAlignVertical: 'top', backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} value={desc} onChangeText={setDesc} multiline placeholder="Add a short description..." placeholderTextColor={themeColors.outline} />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={[styles.inpGrp, { flex: 1 }]}>
                                        <Text style={[styles.inpLab, { color: themeColors.subText }]}>SUBJECT</Text>
                                        <TextInput style={[styles.inp, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} value={subjectName} onChangeText={setSubjectName} placeholder="Subject Name" placeholderTextColor={themeColors.outline} />
                                    </View>
                                    <View style={[styles.inpGrp, { flex: 0.7 }]}>
                                        <Text style={[styles.inpLab, { color: themeColors.subText }]}>CODE</Text>
                                        <TextInput style={[styles.inp, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} value={subjectCode} onChangeText={setSubjectCode} placeholder="CS101" placeholderTextColor={themeColors.outline} />
                                    </View>
                                </View>

                                <View style={styles.inpGrp}>
                                    <Text style={[styles.inpLab, { color: themeColors.subText }]}>TEACHER NAME</Text>
                                    <TextInput style={[styles.inp, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} value={staffName} onChangeText={setStaffName} placeholder="Author/Teacher Name" placeholderTextColor={themeColors.outline} />
                                </View>

                                <TouchableOpacity
                                    style={[styles.vaultPicker, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }, file && { borderColor: '#6366F1', backgroundColor: '#6366F105' }]}
                                    onPress={pickFile}
                                >
                                    <MaterialCommunityIcons
                                        name={file ? "file-check" : "cloud-upload-outline"}
                                        size={28}
                                        color={file ? "#6366F1" : themeColors.outline}
                                    />
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={[styles.pickLab, { color: file ? '#6366F1' : themeColors.subText }]}>
                                            {file ? file.name : "SELECT FILE"}
                                        </Text>
                                        <Text style={[styles.pickSub, { color: themeColors.outline }]}>{file ? "File selected" : "Tap to choose a document"}</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.provisionBtn, isUploading && { opacity: 0.7 }]}
                                    onPress={handleUpload}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <ActivityIndicator color="#fff" /> :
                                        <Text style={styles.provisionTxt}>UPLOAD NOW</Text>}
                                </TouchableOpacity>
                                <View style={{ height: 30 }} />
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
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
    addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 100 },

    intelBoard: { flexDirection: 'row', borderRadius: 28, padding: 24, marginBottom: 25, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    intelTile: { flex: 1, alignItems: 'center' },
    intelVal: { fontSize: 24, fontWeight: '900', color: '#fff' },
    intelLab: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: 1 },
    intelDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },

    card: { borderRadius: 28, padding: 24, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 15, borderWidth: 1 },
    cardHdr: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    iconHole: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 15 },
    docTitle: { fontSize: 16, fontWeight: '900' },
    docSub: { fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
    purgeBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    descBox: { padding: 16, borderRadius: 16, marginBottom: 18 },
    docDesc: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTopWidth: 1 },
    originBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    staffName: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    accessBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    accessTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 20, paddingHorizontal: 40 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '92%' },
    modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalRole: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

    inpGrp: { marginBottom: 20 },
    inpLab: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
    inp: { borderRadius: 18, padding: 16, fontSize: 15, fontWeight: '700', borderWidth: 1 },

    vaultPicker: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, marginVertical: 20 },
    pickLab: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    pickSub: { fontSize: 9, fontWeight: '700', marginTop: 2 },

    provisionBtn: { backgroundColor: '#6366F1', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 8, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
    provisionTxt: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});
