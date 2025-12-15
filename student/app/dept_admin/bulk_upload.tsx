import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    ImageBackground,
    Modal,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";

export default function DeptAdminBulkUploadScreen() {
    const router = useRouter();
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [loading, setLoading] = useState(false);
    const [roleOverride, setRoleOverride] = useState<string | null>(null);
    const [uploadResult, setUploadResult] = useState<{ success: boolean, message: string, errors?: string[] } | null>(null);

    // Help Modal State
    const [helpVisible, setHelpVisible] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        loadUserRole();
    }, []);

    const loadUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem("role"); // Assuming role is stored on login
            if (role) setUserRole(role);
            else {
                // Fallback: fetch from whoami if not in storage
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
            setUploadResult(null); // Clear previous results
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
            Alert.alert("Error", "Please select a file first.");
            return;
        }

        Alert.alert(
            "Confirm Upload",
            `Are you sure you want to upload "${file.name}"? This action will create multiple user accounts within your department scope.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Upload", onPress: processUpload },
            ]
        );
    };

    const processUpload = async () => {
        setLoading(true);
        setUploadResult(null);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return;

            const formData = new FormData();
            formData.append("file", {
                uri: file?.uri,
                name: file?.name || "upload.xlsx",
                type: file?.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            } as any);

            if (roleOverride) {
                formData.append("role", roleOverride);
            }

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

            // Handle 207 Multi-Status (Success with Errors) specifically
            // Note: res.ok is true for 207, so check status explicitly first
            if (res.status === 207) {
                setUploadResult({
                    success: false, // Partial success is not "green" success
                    message: data.message,
                    errors: data.errors
                });
                Alert.alert("Completed with Issues", "Refer to the log below for details.");
            } else if (res.ok) {
                setUploadResult({ success: true, message: data.message });
                Alert.alert("Success", data.message);
                setFile(null);
            } else {
                setUploadResult({
                    success: false,
                    message: data.detail || data.error || "Upload failed",
                    errors: data.errors
                });
                Alert.alert("Error", "Upload failed. See details below.");
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
            Alert.alert("Error", "Network error occurred");
            setUploadResult({ success: false, message: "Network error occurred" });
        }
    };

    return (
        <ImageBackground
            source={require("../../assets/images/back.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#00B9BD" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Bulk User Upload</Text>
                <TouchableOpacity onPress={() => setHelpVisible(true)} style={styles.helpButton}>
                    <Ionicons name="help-circle-outline" size={28} color="#00B9BD" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.instruction}>
                        Upload Excel file (.xlsx). Tap generic <Text style={{ fontWeight: 'bold' }}>?</Text> above for format details.
                    </Text>

                    <TouchableOpacity style={styles.uploadBox} onPress={pickFile}>
                        <Ionicons name="cloud-upload-outline" size={40} color="#30e4de" />
                        <Text style={styles.fileText}>{file ? file.name : "Tap to Select File"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, !file && { backgroundColor: "#ccc" }]}
                        onPress={handleUpload}
                        disabled={!file || loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload & Create Users</Text>}
                    </TouchableOpacity>

                    {/* Result Log Display */}
                    {uploadResult && (
                        <View style={[styles.resultBox, uploadResult.success ? styles.successBox : styles.warningBox]}>
                            <Text style={[styles.resultTitle, { color: uploadResult.success ? '#2e7d32' : '#ef6c00' }]}>
                                {uploadResult.success ? "Success" : "Status Report"}
                            </Text>
                            <Text style={styles.resultMessage}>{uploadResult.message}</Text>

                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <View style={styles.errorList}>
                                    <Text style={styles.errorHeader}>Details / Errors:</Text>
                                    {uploadResult.errors.map((err, i) => (
                                        <Text key={i} style={styles.errorText}>• {err}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={helpVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setHelpVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Excel Sheet Instructions</Text>
                            <TouchableOpacity onPress={() => setHelpVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalIntro}>
                                Your Excel file must contain the following columns as the first row.
                            </Text>

                            <View style={styles.tableRow}>
                                <Text style={[styles.colName, { color: '#d9534f' }]}>* username</Text>
                                <Text style={styles.colDesc}>Unique ID for login (e.g. Reg No, Staff ID)</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.colName, { color: '#d9534f' }]}>* email</Text>
                                <Text style={styles.colDesc}>Valid email address</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={styles.colName}>password</Text>
                                <Text style={styles.colDesc}>Optional. Defaults to 'Default@123' if empty.</Text>
                            </View>

                            {/* Dynamic Instructions based on Role */}
                            {userRole === 'DEPT_ADMIN' && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.roleHeader}>For Department Admins:</Text>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.colName, { color: '#d9534f' }]}>* role</Text>
                                        <Text style={styles.colDesc}>Allowed values: <Text style={{ fontWeight: 'bold' }}>STUDENT, STAFF</Text></Text>
                                    </View>
                                    <Text style={styles.noteText}>
                                        Note: You cannot create other Admins. All users will be automatically assigned to your department.
                                    </Text>
                                </>
                            )}

                            {userRole === 'DEPT_STAFF' && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.roleHeader}>For Dept Staff:</Text>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.colName, { color: '#d9534f' }]}>* role</Text>
                                        <Text style={styles.colDesc}>Allowed value: <Text style={{ fontWeight: 'bold' }}>STUDENT</Text></Text>
                                    </View>
                                    <Text style={styles.noteText}>
                                        Note: You can only create Students for your own department.
                                    </Text>
                                </>
                            )}

                            {(userRole === 'SUPER_ADMIN' || userRole === 'PRINCIPAL') && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.roleHeader}>For Super Admin / Principal:</Text>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.colName, { color: '#d9534f' }]}>* role</Text>
                                        <Text style={styles.colDesc}>Values: ADMIN, STAFF, STUDENT</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.colName, { color: '#d9534f' }]}>* department</Text>
                                        <Text style={styles.colDesc}>Exact name of the department (e.g. "CSE")</Text>
                                    </View>
                                </>
                            )}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setHelpVisible(false)}>
                            <Text style={styles.closeBtnText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // Spread items
        padding: 20,
        backgroundColor: "rgba(255,255,255,0.9)",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#00B9BD",
        marginLeft: 15,
    },
    helpButton: {
        padding: 5,
    },
    container: {
        padding: 20,
        justifyContent: "center",
        paddingBottom: 100
    },
    card: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    instruction: {
        fontSize: 16,
        marginBottom: 8,
        color: "#333",
        textAlign: 'center'
    },
    code: {
        fontFamily: "monospace",
        backgroundColor: "#f0f0f0",
        padding: 8,
        borderRadius: 5,
        marginBottom: 10,
        fontSize: 12,
    },
    note: {
        fontSize: 12,
        color: "#666",
        fontStyle: "italic",
        marginBottom: 20,
    },
    uploadBox: {
        borderWidth: 2,
        borderColor: "#30e4de",
        borderStyle: "dashed",
        borderRadius: 10,
        padding: 30,
        alignItems: "center",
        marginBottom: 20,
        backgroundColor: "#f9fcfc",
    },
    fileText: {
        marginTop: 10,
        fontSize: 16,
        color: "#555",
    },
    button: {
        backgroundColor: "#00B9BD",
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    // Result Box Styles
    resultBox: {
        marginTop: 20,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 10
    },
    successBox: { backgroundColor: '#e8f5e9', borderColor: '#4caf50' },
    warningBox: { backgroundColor: '#fff3e0', borderColor: '#ff9800' },
    resultTitle: { fontWeight: 'bold', marginBottom: 5, fontSize: 16 },
    resultMessage: { marginBottom: 10, color: '#333' },
    errorList: { marginTop: 5, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 5 },
    errorHeader: { fontWeight: 'bold', color: '#d32f2f', marginBottom: 5 },
    errorText: { color: '#d32f2f', fontSize: 13, marginBottom: 4 }, // slightly larger for readability

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "white",
        width: "100%",
        maxHeight: "80%",
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00B9BD'
    },
    modalBody: {
        padding: 20,
    },
    modalIntro: {
        fontSize: 14,
        color: '#555',
        marginBottom: 15,
    },
    tableRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start'
    },
    colName: {
        fontWeight: 'bold',
        width: 100,
        fontSize: 14,
    },
    colDesc: {
        flex: 1,
        fontSize: 14,
        color: '#444'
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    roleHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    noteText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#777',
        marginTop: 5,
    },
    closeBtn: {
        backgroundColor: '#00B9BD',
        padding: 15,
        alignItems: 'center',
    },
    closeBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});
