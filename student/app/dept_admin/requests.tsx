import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    StatusBar,
    Dimensions,
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

const { width } = Dimensions.get("window");

export default function DeptAdminRequestsScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [activeTab, setActiveTab] = useState<'student' | 'staff' | 'account' | 'bulk'>('student');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Data
    const [studentRequests, setStudentRequests] = useState<any[]>([]);
    const [timetableRequests, setTimetableRequests] = useState<any[]>([]);
    const [accountRequests, setAccountRequests] = useState<any[]>([]);
    const [bulkRequests, setBulkRequests] = useState<any[]>([]);

    // Modals & Selection
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [comment, setComment] = useState("");
    const [forwardToPrincipal, setForwardToPrincipal] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const loadData = async (isRef = false) => {
        if (!isRef) setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return;
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'student') {
                const res = await axios.get(`${API_BASE_URL}/api/accounts/request/admin/list/`, { headers });
                setStudentRequests(res.data);
            } else if (activeTab === 'staff') {
                const res = await axios.get(`${API_BASE_URL}/api/accounts/timetables/pending/`, { headers });
                setTimetableRequests(res.data);
            } else if (activeTab === 'account') {
                const res = await axios.get(`${API_BASE_URL}/api/accounts/account-request/list/`, { headers });
                setAccountRequests(res.data.filter((r: any) => r.status === 'pending'));
            } else if (activeTab === 'bulk') {
                const res = await axios.get(`${API_BASE_URL}/api/accounts/user-creation-requests/list/`, { headers });
                setBulkRequests(res.data);
            }
        } catch (err) {
            console.error("Requests load error", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadData(); }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData(true);
    };

    const handleAction = async (action: 'approved' | 'rejected' | 'approve' | 'reject') => {
        if (!selectedItem) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
            let endpoint = "";
            let body = {};

            if (activeTab === 'student') {
                endpoint = `/api/accounts/request/admin/${selectedItem.id}/`;
                body = { admin_status: action, admin_comment: comment, forward: forwardToPrincipal };
            } else if (activeTab === 'staff') {
                endpoint = `/api/accounts/timetables/${selectedItem.id}/verify/`;
                body = { action };
            } else if (activeTab === 'account') {
                endpoint = `/api/accounts/account-request/${selectedItem.id}/action/`;
                body = { action, note: comment };
            } else if (activeTab === 'bulk') {
                endpoint = `/api/accounts/user-creation-requests/${selectedItem.id}/action/`;
                body = { action, comment };
            }

            const method = activeTab === 'student' ? 'PATCH' : 'POST';
            const res = await axios({ method, url: `${API_BASE_URL}${endpoint}`, headers, data: body });

            if (res.status === 200 || res.status === 201) {
                Alert.alert("Action Successful", "The decision has been saved successfully.");
                setModalVisible(false);
                setComment("");
                setForwardToPrincipal(false);
                loadData();
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || "Action failed.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    const fetchBulkPreview = async (reqId: number) => {
        setPreviewLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE_URL}/api/accounts/user-creation-requests/${reqId}/preview/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPreviewData(res.data);
        } catch (e) {
            Alert.alert("Preview Error", "Could not load bulk upload data.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const renderRequestCard = ({ item }: { item: any }) => {
        const isPending = (activeTab === 'account' || activeTab === 'bulk') ? true : item.admin_status === 'pending';
        let title = "";
        let subtitle = "";
        let icon = "";
        let color = '#6366F1';

        if (activeTab === 'student') {
            title = item.letter?.title || "Request";
            subtitle = `Student: ${item.student_name}`;
            icon = "document-text-outline";
            color = "#6366F1";
        } else if (activeTab === 'staff') {
            title = "Timetable Verification";
            subtitle = `Staff: ${item.created_by} | ${item.class_name}`;
            icon = "calendar-outline";
            color = "#8B5CF6";
        } else if (activeTab === 'account') {
            title = "Identity Request";
            subtitle = `${item.full_name} | ID: ${item.register_number}`;
            icon = "person-add-outline";
            color = "#F59E0B";
        } else if (activeTab === 'bulk') {
            title = "Bulk Upload Review";
            subtitle = `Author: ${item.uploaded_by_name}`;
            icon = "people-outline";
            color = "#EC4899";
        }

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                onPress={() => {
                    setSelectedItem(item);
                    setPreviewData(null);
                    setModalVisible(true);
                }}
            >
                <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon as any} size={22} color={color} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>{title}</Text>
                    <Text style={[styles.cardSubtitle, { color: themeColors.subText }]} numberOfLines={1}>{subtitle}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isPending ? '#F59E0B' : '#10B981' }]} />
                        <Text style={[styles.statusText, { color: isPending ? '#F59E0B' : '#10B981' }]}>
                            {isPending ? "Awaiting Review" : "Processed"}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={themeColors.subText} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>Approvals Portal</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Segmented Filter */}
            <View style={[styles.tabContainer, { backgroundColor: themeColors.headerBg }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsStrip}>
                    {[
                        { id: 'student', label: 'Student', icon: 'school' },
                        { id: 'staff', label: 'Timetables', icon: 'calendar-clear' },
                        { id: 'account', label: 'Identity', icon: 'person-badge' },
                        { id: 'bulk', label: 'Bulk', icon: 'file-tray-full' }
                    ].map(t => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.tab, 
                                activeTab === t.id && { backgroundColor: '#6366F1' },
                                activeTab !== t.id && { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }
                            ]}
                            onPress={() => setActiveTab(t.id as any)}
                        >
                            <Ionicons name={t.icon as any} size={16} color={activeTab === t.id ? '#fff' : themeColors.subText} />
                            <Text style={[styles.tabText, { color: activeTab === t.id ? '#fff' : themeColors.subText }]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}><EduLoading size={60} /></View>
            ) : (
                <FlatList
                    data={activeTab === 'student' ? studentRequests : activeTab === 'staff' ? timetableRequests : activeTab === 'account' ? accountRequests : bulkRequests}
                    renderItem={renderRequestCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]} />}
                    ListHeaderComponent={<Text style={[styles.sectionHeading, { color: themeColors.subText }]}>Pending Departmental Actions</Text>}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="shield-check-outline" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>No pending approvals found in this category.</Text>
                        </View>
                    }
                />
            )}

            {/* Executive Review Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalHeaderRole, { color: '#6366F1' }]}>OFFICIAL REVIEW</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={32} color={themeColors.subText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedItem && (
                                <>
                                    <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                                        {activeTab === 'student' ? selectedItem.letter?.title : activeTab === 'staff' ? "Timetable Verification" : activeTab === 'account' ? "Identity Verification" : "Bulk Upload Set"}
                                    </Text>

                                    <View style={[styles.metaBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                        <Text style={[styles.metaText, { color: themeColors.subText }]}>
                                            <Text style={{ fontWeight: '800' }}>SUBMITTED BY: </Text>
                                            {activeTab === 'student' ? selectedItem.student_name : activeTab === 'staff' ? selectedItem.created_by : activeTab === 'account' ? selectedItem.full_name : selectedItem.uploaded_by_name}
                                        </Text>
                                        <Text style={[styles.metaText, { color: themeColors.subText, marginTop: 4 }]}>
                                            <Text style={{ fontWeight: '800' }}>REF ID: </Text>
                                            #{selectedItem.id} • {new Date(selectedItem.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>

                                    <View style={styles.contentSection}>
                                        <Text style={[styles.contentLabel, { color: themeColors.subText }]}>DATA PREVIEW</Text>
                                        {activeTab === 'student' ? (
                                            <Text style={[styles.contentText, { color: themeColors.text }]}>{selectedItem.letter?.content}</Text>
                                        ) : activeTab === 'staff' ? (
                                            <View style={[styles.infoBox, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                                <Text style={[styles.infoTitle, { color: themeColors.text }]}>{selectedItem.title || 'Weekly Timetable'}</Text>
                                                <Text style={[styles.infoSub, { color: themeColors.subText }]}>{selectedItem.class_name} • {selectedItem.section}</Text>
                                                
                                                <TouchableOpacity 
                                                    style={[styles.viewAllBtn, { backgroundColor: '#6366F1' }]}
                                                    onPress={() => {
                                                        setModalVisible(false);
                                                        router.push({ pathname: "/dept_admin/timetable_view", params: { id: selectedItem.id } } as any);
                                                    }}
                                                >
                                                    <Ionicons name="eye" size={16} color="#fff" />
                                                    <Text style={styles.viewAllText}>Examine Full Schedule</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : activeTab === 'account' ? (
                                            <View style={styles.identityBox}>
                                                <View style={styles.idRow}><Text style={[styles.idLabel, { color: themeColors.subText }]}>Reg. No:</Text><Text style={[styles.idVal, { color: themeColors.text }]}>{selectedItem.register_number}</Text></View>
                                                <View style={styles.idRow}><Text style={[styles.idLabel, { color: themeColors.subText }]}>Year:</Text><Text style={[styles.idVal, { color: themeColors.text }]}>{selectedItem.year}</Text></View>
                                            </View>
                                        ) : (
                                            <View style={styles.bulkSection}>
                                                {!previewData && !previewLoading && (
                                                    <TouchableOpacity style={styles.loadPreviewBtn} onPress={() => fetchBulkPreview(selectedItem.id)}>
                                                        <Ionicons name="file-tray-stacked" size={18} color="#fff" />
                                                        <Text style={styles.loadPreviewText}>Examine Records</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {previewLoading && <EduLoading size={25} />}
                                                {previewData && (
                                                    <View style={[styles.previewStats, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                                                        <Text style={styles.pStat}>Verified Records: {previewData.valid_count}</Text>
                                                        {previewData.errors?.length > 0 && <Text style={[styles.pStat, { color: '#EF4444' }]}>Issues Found: {previewData.errors.length}</Text>}
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.governanceSection}>
                                        <Text style={[styles.contentLabel, { color: themeColors.subText }]}>DECISION COMMENTARY</Text>
                                        <TextInput
                                            style={[styles.commentInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                                            placeholder="Document your decision here..."
                                            placeholderTextColor={themeColors.subText}
                                            multiline
                                            value={comment}
                                            onChangeText={setComment}
                                        />

                                        {activeTab === 'student' && (
                                            <TouchableOpacity
                                                style={styles.toggleRow}
                                                onPress={() => setForwardToPrincipal(!forwardToPrincipal)}
                                            >
                                                <Ionicons name={forwardToPrincipal ? "checkbox" : "square-outline"} size={22} color={forwardToPrincipal ? '#6366F1' : themeColors.subText} />
                                                <Text style={[styles.toggleText, { color: themeColors.text }]}>Escalate to Principal for final sign-off</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.approveBtn]}
                                            onPress={() => handleAction(activeTab === 'student' ? 'approved' : 'approve')}
                                        >
                                            <Text style={styles.approveText}>AUTHORIZE</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.rejectBtn, { borderColor: '#EF4444' }]}
                                            onPress={() => handleAction(activeTab === 'student' ? 'rejected' : 'reject')}
                                        >
                                            <Text style={[styles.rejectText, { color: '#EF4444' }]}>DECLINE</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
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
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },

    tabContainer: { paddingVertical: 15 },
    tabsStrip: { paddingHorizontal: 20, gap: 10 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    tabText: { fontSize: 13, fontWeight: '700' },

    listContent: { padding: 20, paddingBottom: 100 },
    sectionHeading: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 16 },
    cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    cardSubtitle: { fontSize: 13, marginBottom: 8 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 20, paddingHorizontal: 40, lineHeight: 22 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 28, height: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalHeaderRole: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12, lineHeight: 30 },
    metaBox: { padding: 16, borderRadius: 20, marginBottom: 25 },
    metaText: { fontSize: 12, lineHeight: 18 },

    contentSection: { marginBottom: 25 },
    contentLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
    contentText: { fontSize: 15, lineHeight: 24, opacity: 0.9 },
    infoBox: { padding: 16, borderRadius: 16 },
    infoTitle: { fontSize: 16, fontWeight: '800' },
    infoSub: { fontSize: 13, marginTop: 4, marginBottom: 15 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
    viewAllText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    identityBox: { gap: 10, padding: 15, backgroundColor: 'rgba(99,102,241,0.05)', borderRadius: 16 },
    idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    idLabel: { fontSize: 14, fontWeight: '600' },
    idVal: { fontSize: 14, fontWeight: '800' },

    bulkSection: { marginTop: 5 },
    loadPreviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#6366F1', padding: 16, borderRadius: 16, justifyContent: 'center' },
    loadPreviewText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    previewStats: { padding: 14, borderRadius: 14, borderWidth: 1 },
    pStat: { fontSize: 13, fontWeight: '800', color: '#10B981' },

    governanceSection: { marginBottom: 35 },
    commentInput: { borderRadius: 20, padding: 20, height: 120, fontSize: 15, textAlignVertical: 'top', borderWidth: 1 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
    toggleText: { fontSize: 14, fontWeight: '700' },

    actionRow: { flexDirection: 'row', gap: 15 },
    actionBtn: { flex: 1, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    approveBtn: { backgroundColor: '#10B981' },
    rejectBtn: { backgroundColor: 'transparent', borderWidth: 1.5 },
    approveText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
    rejectText: { fontWeight: '900', letterSpacing: 1 }
});
