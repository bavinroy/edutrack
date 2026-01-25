import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ImageBackground,
    ScrollView,
    Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { API_BASE_URL } from "../config";

// --- Types ---
type Letter = { id: number; title: string; content: string; created_at: string };
type StudentRequest = {
    id: number;
    letter: Letter;
    student_name: string;
    staff_status: string;
    admin_status: string;
    principal_status: string;
    admin_comment?: string;
    created_at: string;
};

type TimetableRequest = {
    id: number;
    title: string;
    class_name: string;
    section: string;
    year: string;
    created_by: string; // username
    status: string;
    updated_at: string;
    grid: {
        gridData: string[][];
        rowHeaders: string[];
        colHeaders: { label: string; time: string }[];
        courses?: any[];
        metadata?: any;
        collegeName?: string;
        docTitle?: string;
    };
};

export default function DeptAdminRequestsScreen() {
    const router = useRouter();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
    const [loading, setLoading] = useState(false);

    // Data
    const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([]);
    const [timetableRequests, setTimetableRequests] = useState<TimetableRequest[]>([]);

    // Modals
    const [studentModalVisible, setStudentModalVisible] = useState(false);
    const [currentStudentRequest, setCurrentStudentRequest] = useState<StudentRequest | null>(null);
    const [studentDeclineComment, setStudentDeclineComment] = useState("");
    const [forwardToPrincipal, setForwardToPrincipal] = useState(false);

    const [staffModalVisible, setStaffModalVisible] = useState(false);
    const [currentTimetable, setCurrentTimetable] = useState<TimetableRequest | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return;

            if (activeTab === 'student') {
                const res = await fetch(`${API_BASE_URL}/api/request/admin/list/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setStudentRequests(data);
                    } else {
                        console.error("API returned non-array:", data);
                        setStudentRequests([]);
                    }
                } else {
                    console.log("Failed to fetch student requests", res.status);
                    setStudentRequests([]);
                }
            } else {
                const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/pending/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setTimetableRequests(data);
                    } else {
                        setTimetableRequests([]);
                    }
                } else {
                    console.log("Failed pending fetch");
                }
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    // --- Student Request Actions ---
    const handleStudentAction = async (requestId: number, action: "approved" | "rejected", comment?: string) => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/api/request/admin/${requestId}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    admin_status: action,
                    admin_comment: comment,
                    forward: forwardToPrincipal
                }),
            });

            if (res.ok) {
                Alert.alert("Success", `Request ${action}`);
                setStudentModalVisible(false);
                setStudentDeclineComment("");
                setForwardToPrincipal(false); // Reset
                loadData();
            } else {
                Alert.alert("Error", "Failed to update request");
            }
        } catch (err) {
            Alert.alert("Error", "Network error");
        }
    };

    // --- Staff Timetable Actions ---
    const handleTimetableAction = async (timetableId: number, action: "approve" | "reject") => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/${timetableId}/verify/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action }),
            });

            const data = await res.json();
            if (res.ok) {
                Alert.alert("Success", `Timetable ${data.status}`);
                setStaffModalVisible(false);
                loadData();
            } else {
                Alert.alert("Error", data.error || "Failed to verify");
            }
        } catch (err) {
            Alert.alert("Error", "Network error");
        }
    };

    // --- Renderers ---

    const renderStudentRequest = ({ item }: { item: StudentRequest }) => {
        if (!item) return null;
        const pending = item.admin_status === "pending";

        let statusDisplay = (item.admin_status || "Pending").toUpperCase();
        if (item.admin_status === 'approved') {
            if (item.principal_status === 'pending') statusDisplay += " (Sent to Principal)";
            else if (item.principal_status === 'approved') statusDisplay += " (Finalized)";
            else if (item.principal_status === 'rejected') statusDisplay += " (Rejected by Principal)";
        }

        return (
            <TouchableOpacity
                style={[styles.card, pending && styles.cardPending]}
                onPress={() => { setCurrentStudentRequest(item); setStudentModalVisible(true); setForwardToPrincipal(false); }}
            >
                <Text style={styles.title}>📄 {item.letter?.title || "No Title"}</Text>
                <Text style={styles.meta}>Student: {item.student_name || "Unknown"}</Text>
                <Text style={styles.meta}>Status: <Text style={{ fontWeight: 'bold', color: pending ? 'orange' : '#333' }}>{statusDisplay}</Text></Text>
                {item.admin_comment && <Text style={styles.comment}>Note: {item.admin_comment}</Text>}
            </TouchableOpacity>
        );
    };

    const renderTimetableRequest = ({ item }: { item: TimetableRequest }) => {
        return (
            <TouchableOpacity
                style={[styles.card, styles.cardPending]}
                onPress={() => { setCurrentTimetable(item); setStaffModalVisible(true); }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.title}>📅 Timetable Approval</Text>
                    <Ionicons name="time-outline" size={16} color="#666" />
                </View>
                <Text style={styles.subTitle}>{item.title || "Untitled"}</Text>
                <Text style={styles.meta}>Class: {item.class_name} - {item.section} ({item.year})</Text>
                <Text style={styles.meta}>Staff: {item.created_by}</Text>
                <Text style={[styles.meta, { color: 'orange', fontWeight: 'bold' }]}>Status: Pending Verification</Text>
            </TouchableOpacity>
        );
    };

    // --- Full Timetable Render Logic ---
    const renderTimetableDetails = (timetable: TimetableRequest) => {
        if (!timetable.grid) return <Text>No Data</Text>;
        const { rowHeaders, colHeaders, gridData, courses, metadata, collegeName, docTitle } = timetable.grid;

        // Helpers
        const counts: Record<string, number> = {};
        if (gridData) {
            gridData.forEach((row) => {
                row.forEach((acronym) => {
                    if (acronym) counts[acronym] = (counts[acronym] || 0) + 1;
                });
            });
        }
        const totalAllocated = Object.values(counts).reduce((a, b) => a + b, 0);

        return (
            <View>
                {/* 1. Header Info */}
                <View style={styles.viewSection}>
                    <Text style={styles.collegeName}>{collegeName || "College Name"}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 5 }}>
                        <Text style={styles.deptLabel}>Department of </Text>
                        <Text style={[styles.deptLabel, { textDecorationLine: 'underline' }]}>{metadata?.department || "..."}</Text>
                    </View>
                    <Text style={styles.docTitle}>{docTitle || "CLASS TIME TABLE"}</Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Academic Year: <Text style={styles.metaVal}>{metadata?.academicYear}</Text></Text>
                        <Text style={styles.metaLabel}>Year/Sem: <Text style={styles.metaVal}>{metadata?.year} / {metadata?.semester}</Text></Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Section: <Text style={styles.metaVal}>{metadata?.section}</Text></Text>
                        <Text style={styles.metaLabel}>Room No: <Text style={styles.metaVal}>{metadata?.roomNo}</Text></Text>
                    </View>
                </View>

                {/* 2. Grid */}
                <View style={[styles.viewSection, { marginVertical: 10 }]}>
                    <ScrollView horizontal>
                        <View>
                            {/* Header Row */}
                            <View style={[styles.row, styles.headerRow]}>
                                <View style={[styles.cell, styles.dayCell]}>
                                    <Text style={styles.headerText}>Day / Period</Text>
                                </View>
                                {colHeaders?.map((col, i) => (
                                    <View key={i} style={[styles.cell, styles.periodCell]}>
                                        <Text style={styles.headerText}>{col.label}</Text>
                                        <Text style={{ fontSize: 9, textAlign: 'center', marginTop: 2 }}>{col.time}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Data Rows */}
                            {rowHeaders?.map((day, rIndex) => {
                                const rowData = gridData ? gridData[rIndex] : [];
                                return (
                                    <View key={rIndex} style={styles.row}>
                                        <View style={[styles.cell, styles.dayCell]}>
                                            <Text style={styles.dayText}>{day}</Text>
                                        </View>
                                        {colHeaders?.map((_, cIndex) => {
                                            const cellData = rowData ? rowData[cIndex] : "";
                                            return (
                                                <View key={cIndex} style={[styles.cell, styles.periodCell]}>
                                                    <Text style={styles.cellText}>{cellData || "---"}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {/* 3. Allocations */}
                <View style={styles.viewSection}>
                    <Text style={styles.secTitle}>COURSE ALLOCATION</Text>
                    <ScrollView horizontal>
                        <View>
                            <View style={styles.allocHeader}>
                                <Text style={[styles.ahCell, { width: 30 }]}>#</Text>
                                <Text style={[styles.ahCell, { width: 60 }]}>Code</Text>
                                <Text style={[styles.ahCell, { width: 60 }]}>Acronym</Text>
                                <Text style={[styles.ahCell, { width: 120 }]}>Name</Text>
                                <Text style={[styles.ahCell, { width: 100 }]}>Faculty</Text>
                                <Text style={[styles.ahCell, { width: 40 }]}>L/W</Text>
                                <Text style={[styles.ahCell, { width: 40 }]}>Used</Text>
                            </View>
                            {courses?.map((c, i) => (
                                <View key={i} style={styles.allocRow}>
                                    <Text style={[styles.aCell, { width: 30, textAlign: 'center' }]}>{i + 1}</Text>
                                    <Text style={[styles.aCell, { width: 60 }]}>{c.code}</Text>
                                    <Text style={[styles.aCell, { width: 60, fontWeight: 'bold' }]}>{c.acronym}</Text>
                                    <Text style={[styles.aCell, { width: 120 }]}>{c.name}</Text>
                                    <Text style={[styles.aCell, { width: 100 }]}>{c.faculty}</Text>
                                    <Text style={[styles.aCell, { width: 40, textAlign: 'center' }]}>{c.periodsPerWeek}</Text>
                                    <Text style={[styles.aCell, { width: 40, textAlign: 'center', fontWeight: 'bold', color: 'green' }]}>
                                        {counts[c.acronym] || 0}
                                    </Text>
                                </View>
                            ))}
                            <View style={styles.allocRow}>
                                <Text style={[styles.aCell, { flex: 1, textAlign: 'right', fontWeight: 'bold', paddingRight: 10 }]}>Total:</Text>
                                <Text style={[styles.aCell, { width: 40, textAlign: 'center', fontWeight: 'bold' }]}>{totalAllocated}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        )
    };

    return (
        <ImageBackground source={require("../../assets/images/back.jpg")} style={{ flex: 1 }}>

            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#00B9BD" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Manage Requests</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'student' && styles.activeTab]}
                    onPress={() => setActiveTab('student')}
                >
                    <Text style={[styles.tabText, activeTab === 'student' && styles.activeTabText]}>Student Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'staff' && styles.activeTab]}
                    onPress={() => setActiveTab('staff')}
                >
                    <Text style={[styles.tabText, activeTab === 'staff' && styles.activeTabText]}>Staff Requests</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#30e4de" /></View>
            ) : (
                activeTab === 'student' ? (
                    <FlatList
                        data={studentRequests}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderStudentRequest}
                        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No pending requests.</Text>}
                    />
                ) : (
                    <FlatList
                        data={timetableRequests}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderTimetableRequest}
                        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No pending requests.</Text>}
                    />
                )
            )}

            {/* Student Modal */}
            <Modal visible={studentModalVisible} transparent animationType="slide" onRequestClose={() => setStudentModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>{currentStudentRequest?.letter?.title || "Request"}</Text>
                            <Text style={{ marginBottom: 10 }}>{currentStudentRequest?.letter?.content || "No content"}</Text>
                            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Student: {currentStudentRequest?.student_name}</Text>
                            <Text style={{ marginBottom: 15, color: '#555' }}>From Staff: {currentStudentRequest?.staff_status}</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Reason for rejection or admin note..."
                                multiline
                                value={studentDeclineComment}
                                onChangeText={setStudentDeclineComment}
                            />

                            {/* Forward to Principal Toggle */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
                                onPress={() => setForwardToPrincipal(!forwardToPrincipal)}
                            >
                                <Ionicons
                                    name={forwardToPrincipal ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={forwardToPrincipal ? "#00B9BD" : "#666"}
                                />
                                <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>Forward to Principal?</Text>
                            </TouchableOpacity>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: "green" }]}
                                    onPress={() => currentStudentRequest && handleStudentAction(currentStudentRequest.id, "approved")}
                                >
                                    <Text style={styles.buttonText}>{forwardToPrincipal ? "Approve & Send" : "Approve Final"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={() => currentStudentRequest && handleStudentAction(currentStudentRequest.id, "rejected", studentDeclineComment)}>
                                    <Text style={styles.buttonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={[styles.button, { backgroundColor: "#ccc", marginTop: 10 }]} onPress={() => setStudentModalVisible(false)}>
                                <Text style={[styles.buttonText, { color: "#000" }]}>Close</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Staff Timetable Modal */}
            <Modal visible={staffModalVisible} transparent animationType="slide" onRequestClose={() => setStaffModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '95%', width: '98%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.modalHeader}>Timetable Verification</Text>
                            <TouchableOpacity onPress={() => setStaffModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                            <View style={{ backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6, marginBottom: 10 }}>
                                <Text style={styles.subTitle}>{currentTimetable?.title}</Text>
                                <Text style={styles.meta}>Submitted By: {currentTimetable?.created_by}</Text>
                            </View>

                            {currentTimetable && renderTimetableDetails(currentTimetable)}

                            <Text style={{ marginVertical: 10, fontStyle: 'italic', color: '#666', textAlign: 'center' }}>
                                Approving will publish this timetable to {currentTimetable?.class_name} students.
                            </Text>

                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.button, { backgroundColor: "green" }]} onPress={() => currentTimetable && handleTimetableAction(currentTimetable.id, "approve")}>
                                    <Text style={styles.buttonText}>Approve & Publish</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={() => currentTimetable && handleTimetableAction(currentTimetable.id, "reject")}>
                                    <Text style={styles.buttonText}>Reject & Return</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <Ionicons name="home" size={24} color={pathname === "/dept_admin/dashboard" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/dept_admin/dashboard")} />
                <Ionicons name="list-outline" size={24} color={pathname === "/dept_admin/requests" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/dept_admin/requests")} />
                <Ionicons name="desktop-outline" size={24} color={pathname === "/dept_admin/notice" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/dept_admin/notice")} />
                <Ionicons name="person-circle-outline" size={24} color={pathname === "/dept_admin/profile" ? "#0e0e0dff" : "#fff"} onPress={() => router.push("/dept_admin/profile")} />
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "rgba(255,255,255,0.9)" },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#00B9BD", marginLeft: 10 },

    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, marginHorizontal: 12, borderRadius: 8, elevation: 2, marginBottom: 10 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    activeTab: { backgroundColor: '#30e4de' },
    tabText: { fontWeight: 'bold', color: '#666' },
    activeTabText: { color: '#fff' },

    card: { backgroundColor: "rgba(255,255,255,0.9)", padding: 15, borderRadius: 10, marginBottom: 12, elevation: 3 },
    cardPending: { borderLeftWidth: 5, borderLeftColor: 'orange' },
    title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
    subTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#333' },
    meta: { fontSize: 12, color: "#666", marginBottom: 2 },
    comment: { fontSize: 14, fontStyle: "italic", color: "#333", marginTop: 5 },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalContent: { width: "90%", maxHeight: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 20 },
    modalHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: '#00B9BD' },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 8, minHeight: 60, textAlignVertical: "top", marginBottom: 15, marginTop: 10 },
    actionRow: { flexDirection: "row", justifyContent: 'space-between', gap: 10, marginTop: 10 },
    button: { flex: 1, padding: 12, borderRadius: 6, justifyContent: "center", alignItems: 'center' },
    buttonText: { color: "#fff", fontWeight: "bold" },

    // Timetable Detail Styles
    viewSection: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8 },
    collegeName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
    deptLabel: { fontSize: 12, color: '#333', fontWeight: '600' },
    docTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginVertical: 5, textDecorationLine: 'underline' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    metaLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
    metaVal: { color: '#000', fontWeight: 'bold' },
    secTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#00796b' },

    // Grid in Modal
    row: { flexDirection: "row" },
    headerRow: { backgroundColor: "#0bbdd8ff" },
    cell: { borderWidth: 1, borderColor: "#ccc", justifyContent: "center", padding: 4 },
    dayCell: { width: 60, backgroundColor: "#f8f9fa", justifyContent: 'center', alignItems: 'center' },
    periodCell: { width: 70, backgroundColor: "#fff", justifyContent: 'center', alignItems: 'center' },
    headerText: { fontWeight: "bold", textAlign: "center", color: "#000", fontSize: 10 },
    cellText: { textAlign: "center", color: "#333", fontWeight: 'bold', fontSize: 10 },
    dayText: { textAlign: "center", fontWeight: "600", color: "#000" },

    // Alloc in Modal
    allocHeader: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1 },
    allocRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 4 },
    ahCell: { fontSize: 9, fontWeight: 'bold', padding: 2, textAlign: 'center', borderRightWidth: 1, borderColor: '#ddd' },
    aCell: { fontSize: 9, padding: 2, borderRightWidth: 1, borderColor: '#eee' },


    bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12, position: "absolute", bottom: 0, width: "100%", borderTopLeftRadius: 16, borderTopRightRadius: 16, elevation: 8 },
});
