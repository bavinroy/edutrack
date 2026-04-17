import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Dimensions,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

const { width } = Dimensions.get("window");

export default function DeptAdminBulkUploadScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [loading, setLoading] = useState(false);
    const [roleOverride, setRoleOverride] = useState<string | null>(null);
    const [uploadResult, setUploadResult] = useState<{ success: boolean, message: string, errors?: string[] } | null>(null);
    
    // Preview States
    const [previewData, setPreviewData] = useState<{ users: any[], valid_count: number, errors: string[] } | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    // Help Modal State
    const [helpVisible, setHelpVisible] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        loadUserRole();
    }, []);

    const loadUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem("role");
            if (role) setUserRole(role);
            else {
                const token = await AsyncStorage.getItem("accessToken");
                if (token) {
                    const res = await fetch(`${API_BASE_URL}/api/accounts/whoami/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUserRole(data.role);
                        await AsyncStorage.setItem("role", data.role);
                    }
                }
            }
        } catch (e) {
            console.log("Error loading role", e);
        }
    };

    const pickFile = async () => {
        try {
            setUploadResult(null);
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"],
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            console.log("File pick error", err);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            Alert.alert("Requirement", "Please select a data file first.");
            return;
        }
        processUpload(true);
    };

    const processUpload = async (isPreview: boolean = true) => {
        setLoading(true);
        if (!isPreview) setPreviewVisible(false);
        setUploadResult(null);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return;

            const formData = new FormData();
            formData.append("file", {
                uri: file?.uri,
                name: file?.name || "batch_upload.xlsx",
                type: file?.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            } as any);

            if (roleOverride) formData.append("role", roleOverride);
            if (isPreview) formData.append("preview", "true");

            const res = await fetch(`${API_BASE_URL}/api/accounts/bulk-upload/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                body: formData,
            });

            const data = await res.json();
            setLoading(false);

            if (isPreview) {
                if (res.ok && data.preview) {
                    setPreviewData(data);
                    setPreviewVisible(true);
                } else {
                    Alert.alert("Validation Failed", data.error || data.detail || "Corrupt or invalid file format.");
                }
                return;
            }

            if (res.status === 207) {
                setUploadResult({ success: false, message: data.message, errors: data.errors });
                Alert.alert("Action Filtered", "Partial success with some entry errors.");
            } else if (res.ok) {
                setUploadResult({ success: true, message: data.message });
                Alert.alert("Success", "All records successfully processed.");
                setFile(null);
            } else {
                setUploadResult({ success: false, message: data.detail || "Execution stopped.", errors: data.errors });
                Alert.alert("Failure", "Batch processing failed.");
            }
        } catch (err) {
            setLoading(false);
            Alert.alert("Offline", "Check your connectivity.");
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
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Bulk Engine</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>Massive Data Injection</Text>
                </View>
                <TouchableOpacity onPress={() => setHelpVisible(true)}>
                    <Ionicons name="information-circle-outline" size={24} color="#6366F1" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <Text style={[styles.heroTitle, { color: themeColors.text }]}>Upload Registry</Text>
                    <Text style={[styles.heroDesc, { color: themeColors.subText }]}>
                        Onboard multiple students or staff members simultaneously using standard templates.
                    </Text>
                </View>

                <TouchableOpacity 
                    style={[styles.uploadBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: file ? '#6366F1' : themeColors.border }]} 
                    onPress={pickFile}
                    activeOpacity={0.8}
                >
                    <View style={[styles.uploadIcon, { backgroundColor: file ? '#6366F115' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name={file ? "document-text" : "cloud-upload"} size={32} color={file ? "#6366F1" : themeColors.subText} />
                    </View>
                    <Text style={[styles.fileText, { color: themeColors.text }]}>{file ? file.name : "Select Spreadsheet"}</Text>
                    <Text style={[styles.fileSub, { color: themeColors.subText }]}>{file ? "Press button below to proceed" : ".XLSX or .CSV format only"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: file ? '#6366F1' : themeColors.border }]}
                    onPress={handleUpload}
                    disabled={!file || loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <Text style={styles.submitTxt}>VALIDATE & PREVIEW</Text>
                            <Ionicons name="analytics" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>

                {uploadResult && (
                    <View style={[styles.resultBox, { backgroundColor: uploadResult.success ? '#10B98110' : '#EF444410', borderColor: uploadResult.success ? '#10B98130' : '#EF444430' }]}>
                        <View style={styles.resultHeader}>
                            <Ionicons 
                                name={uploadResult.success ? "checkmark-circle" : "warning"} 
                                size={22} 
                                color={uploadResult.success ? '#10B981' : '#EF4444'} 
                            />
                            <Text style={[styles.resultTitle, { color: uploadResult.success ? '#10B981' : '#EF4444' }]}>
                                {uploadResult.success ? "Process Complete" : "Execution Halted"}
                            </Text>
                        </View>
                        <Text style={[styles.resultMsg, { color: themeColors.text }]}>{uploadResult.message}</Text>

                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <View style={[styles.errorList, { borderTopColor: themeColors.border }]}>
                                <Text style={[styles.errorHeadline, { color: themeColors.text }]}>LOG SUMMARY:</Text>
                                {uploadResult.errors.map((err, i) => (
                                    <Text key={i} style={[styles.errorEntry, { color: themeColors.subText }]}>• {err}</Text>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Help Modal */}
            <Modal visible={helpVisible} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={[styles.helpContent, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Template Specs</Text>
                            <TouchableOpacity onPress={() => setHelpVisible(false)}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.specsIntro, { color: themeColors.subText }]}>
                                The following columns are MANDATORY in your spreadsheet:
                            </Text>
                            <View style={styles.specRow}>
                                <Text style={styles.specKey}>username</Text>
                                <Text style={[styles.specVal, { color: themeColors.subText }]}>Unique ID (Registration / Employee No)</Text>
                            </View>
                            <View style={styles.specRow}>
                                <Text style={styles.specKey}>email</Text>
                                <Text style={[styles.specVal, { color: themeColors.subText }]}>Valid institutional email</Text>
                            </View>
                            <View style={styles.specRow}>
                                <Text style={styles.specKey}>role</Text>
                                <Text style={[styles.specVal, { color: themeColors.subText }]}>Values: STUDENT or STAFF</Text>
                            </View>
                            
                            <View style={[styles.noteBox, { backgroundColor: '#6366F110' }]}>
                                <Ionicons name="bulb-outline" size={18} color="#6366F1" />
                                <Text style={[styles.noteTxt, { color: '#6366F1' }]}>
                                    Password defaults to <Text style={{ fontWeight: '900' }}>EduTrack@2024</Text> if left empty.
                                </Text>
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#6366F1' }]} onPress={() => setHelpVisible(false)}>
                            <Text style={styles.modalActionTxt}>UNDERSTOOD</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Preview Modal */}
            <Modal visible={previewVisible} transparent animationType="slide">
                <View style={[styles.modalBackdrop, { justifyContent: 'flex-end' }]}>
                    <View style={[styles.previewContent, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>System Validation</Text>
                            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={themeColors.subText} />
                            </TouchableOpacity>
                        </View>

                        {previewData && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.statsStrip}>
                                    <View style={[styles.statNode, { backgroundColor: '#10B98115' }]}>
                                        <Text style={[styles.statLabel, { color: '#10B981' }]}>VALID</Text>
                                        <Text style={[styles.statValue, { color: '#10B981' }]}>{previewData.valid_count}</Text>
                                    </View>
                                    <View style={[styles.statNode, { backgroundColor: '#EF444415' }]}>
                                        <Text style={[styles.statLabel, { color: '#EF4444' }]}>CRITICAL</Text>
                                        <Text style={[styles.statValue, { color: '#EF4444' }]}>{previewData.errors.length}</Text>
                                    </View>
                                </View>

                                {previewData.valid_count > 0 && (
                                    <View style={styles.tableArea}>
                                        <Text style={[styles.tableLabel, { color: themeColors.text }]}>VERIFIED DATASET</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.tableInner}>
                                                <View style={[styles.row, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                                    <Text style={[styles.cell, { width: 100, fontWeight: '800' }]}>ID</Text>
                                                    <Text style={[styles.cell, { width: 120, fontWeight: '800' }]}>NAME</Text>
                                                    <Text style={[styles.cell, { width: 150, fontWeight: '800' }]}>IDENTITY</Text>
                                                    <Text style={[styles.cell, { width: 80, fontWeight: '800' }]}>ROLE</Text>
                                                </View>
                                                {previewData.users.slice(0, 50).map((u, i) => (
                                                    <View key={i} style={[styles.row, { borderBottomColor: themeColors.border }]}>
                                                        <Text style={[styles.cell, { width: 100 }]}>{u.username}</Text>
                                                        <Text style={[styles.cell, { width: 120 }]}>{u.first_name || '-'}</Text>
                                                        <Text style={[styles.cell, { width: 150, fontSize: 11 }]}>{u.email}</Text>
                                                        <Text style={[styles.cell, { width: 80, color: '#6366F1' }]}>{u.role}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                )}

                                {previewData.errors.length > 0 && (
                                    <View style={styles.errorArea}>
                                        <Text style={[styles.tableLabel, { color: '#EF4444' }]}>BLOCKERS FOUND</Text>
                                        {previewData.errors.map((err, i) => (
                                            <Text key={i} style={styles.errorEntryInline}>• {err}</Text>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>
                        )}

                        <View style={styles.footerBtns}>
                            <TouchableOpacity style={[styles.fBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} onPress={() => setPreviewVisible(false)}>
                                <Text style={[styles.fBtnTxt, { color: themeColors.text }]}>ABORT</Text>
                            </TouchableOpacity>
                            {previewData && previewData.valid_count > 0 && (
                                <TouchableOpacity style={[styles.fBtn, { backgroundColor: '#6366F1' }]} onPress={() => processUpload(false)}>
                                    <Text style={[styles.fBtnTxt, { color: '#fff' }]}>EXECUTE INJECTION</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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

    scrollContent: { padding: 25, paddingBottom: 120 },
    heroSection: { marginBottom: 35 },
    heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    heroDesc: { fontSize: 14, marginTop: 8, lineHeight: 22, opacity: 0.8 },

    uploadBox: { height: 220, borderRadius: 32, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    uploadIcon: { width: 70, height: 70, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    fileText: { fontSize: 18, fontWeight: '800' },
    fileSub: { fontSize: 12, marginTop: 5, fontWeight: '600' },

    submitBtn: { height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 8 },
    submitTxt: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    resultBox: { marginTop: 30, padding: 20, borderRadius: 24, borderWidth: 1 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    resultTitle: { fontSize: 16, fontWeight: '900' },
    resultMsg: { fontSize: 14, lineHeight: 22 },
    errorList: { marginTop: 15, borderTopWidth: 1, paddingTop: 15 },
    errorHeadline: { fontSize: 11, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
    errorEntry: { fontSize: 12, marginBottom: 6, fontWeight: '600' },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    helpContent: { borderRadius: 32, padding: 28, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    specsIntro: { fontSize: 13, fontWeight: '600', marginBottom: 20 },
    specRow: { marginBottom: 18 },
    specKey: { fontSize: 12, fontWeight: '900', color: '#6366F1', letterSpacing: 1, textTransform: 'uppercase' },
    specVal: { fontSize: 14, marginTop: 4, fontWeight: '600' },
    noteBox: { flexDirection: 'row', gap: 12, padding: 15, borderRadius: 15, marginTop: 10 },
    noteTxt: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 18 },
    modalActionBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
    modalActionTxt: { color: '#fff', fontWeight: '900', letterSpacing: 1 },

    previewContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, height: '85%' },
    statsStrip: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    statNode: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center' },
    statLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    statValue: { fontSize: 24, fontWeight: '900', marginTop: 5 },

    tableArea: { marginBottom: 30 },
    tableLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
    tableInner: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    row: { flexDirection: 'row', padding: 15, borderBottomWidth: 1 },
    cell: { fontSize: 12, fontWeight: '600' },

    errorArea: { padding: 20, borderRadius: 20, backgroundColor: '#EF444408' },
    errorEntryInline: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginBottom: 8 },

    footerBtns: { flexDirection: 'row', gap: 15, marginTop: 20 },
    fBtn: { flex: 1, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    fBtnTxt: { fontWeight: '900', letterSpacing: 0.5, fontSize: 13 }
});
