// app/dept_admin/class_advisors.tsx
import React, { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, Modal, TextInput, Alert, ScrollView,
    StatusBar, Dimensions, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

const { width } = Dimensions.get("window");

export default function ClassAdvisorsScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [advisors, setAdvisors] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [year, setYear] = useState("");
    const [advisor1Id, setAdvisor1Id] = useState("");
    const [advisor2Id, setAdvisor2Id] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchData = async () => {
        setFetching(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const headers = { Authorization: `Bearer ${token}` };

            const [advRes, staffRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/academic/class-advisors/`, { headers }),
                axios.get(`${API_BASE_URL}/api/accounts/department-staff/`, { headers })
            ]);

            setAdvisors(advRes.data);
            setStaffList(staffRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async () => {
        if (!year || !advisor1Id) return Alert.alert("Required", "Select academic year and primary advisor.");

        try {
            const token = await AsyncStorage.getItem("accessToken");
            const payload = {
                year: parseInt(year),
                advisor1: parseInt(advisor1Id),
                advisor2: advisor2Id ? parseInt(advisor2Id) : null
            };

            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/academic/class-advisors/${editingId}/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE_URL}/api/academic/class-advisors/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            Alert.alert("Success", "Registry updated successfully.");
            setModalVisible(false);
            fetchData();
            setYear(""); setAdvisor1Id(""); setAdvisor2Id(""); setEditingId(null);
        } catch (e) {
            Alert.alert("Execution Error", "Failed to commit changes.");
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert("Terminal Action", "Remove this advisor assignment permanently?", [
            { text: "Abort", style: "cancel" },
            {
                text: "Confirm", style: "destructive", onPress: async () => {
                    const token = await AsyncStorage.getItem("accessToken");
                    try {
                        await axios.delete(`${API_BASE_URL}/api/academic/class-advisors/${id}/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchData();
                    } catch (e) { Alert.alert("Failure", "Could not remove record."); }
                }
            }
        ]);
    };

    const renderAdvisor = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.yearBadge, { backgroundColor: '#6366F1' }]}>
                    <Text style={styles.yearText}>YEAR {item.year}</Text>
                </View>
                <View style={styles.actionHeader}>
                    <TouchableOpacity onPress={() => {
                        setYear(item.year.toString());
                        setAdvisor1Id(item.advisor1 ? item.advisor1.toString() : "");
                        setAdvisor2Id(item.advisor2 ? item.advisor2.toString() : "");
                        setEditingId(item.id);
                        setModalVisible(true);
                    }} style={[styles.editBtn, { backgroundColor: '#6366F120' }]} activeOpacity={0.7}>
                        <Ionicons name="pencil-outline" size={18} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.trashBtn, { backgroundColor: '#EF444420' }]} activeOpacity={0.7}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.personnelSection, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                <View style={styles.personRow}>
                    <View style={[styles.personIcon, { backgroundColor: themeColors.card }]}>
                        <MaterialCommunityIcons name="account-tie" size={22} color="#6366F1" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.personRole, { color: themeColors.subText }]}>PRIMARY ADVISOR</Text>
                        <Text style={[styles.personName, { color: themeColors.text }]}>{item.advisor1_name}</Text>
                    </View>
                </View>
                <View style={[styles.vConnect, { backgroundColor: themeColors.border }]} />
                <View style={styles.personRow}>
                    <View style={[styles.personIcon, { backgroundColor: themeColors.card }]}>
                        <MaterialCommunityIcons name="account-multiple" size={22} color={themeColors.subText} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.personRole, { color: themeColors.subText }]}>CO-ADVISOR</Text>
                        <Text style={[styles.personName, { color: item.advisor2_name ? themeColors.text : themeColors.subText }]}>{item.advisor2_name || "PENDING"}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Advisors</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>CLASS LEADERSHIP</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditingId(null); setModalVisible(true); }} style={[styles.addBtn, { backgroundColor: '#6366F1' }]}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
            ) : (
                <FlatList
                    data={advisors}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderAdvisor}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={fetching}
                    onRefresh={fetchData}
                    ListHeaderComponent={
                        <View style={styles.heroSection}>
                            <Text style={[styles.heroTitle, { color: themeColors.text }]}>Administrative Grid</Text>
                            <Text style={[styles.heroDesc, { color: themeColors.subText }]}>Delegate responsibilities to staff for academic monitoring.</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="shield-account-outline" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>No leadership assigned yet.</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: themeColors.text }]}>{editingId ? "Update Roles" : "Assign Leads"}</Text>
                                <Text style={[styles.modalSub, { color: themeColors.subText }]}>SELECT STAFF FOR CLASSROOM CONTROL</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.subText }]}>ACADEMIC YEAR</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                                    <TextInput 
                                        style={[styles.input, { color: themeColors.text, flex: 1 }]} 
                                        keyboardType="numeric" 
                                        placeholder="e.g. 1" 
                                        value={year} 
                                        onChangeText={setYear} 
                                        placeholderTextColor={themeColors.subText} 
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.subText }]}>PRIMARY LEAD (SELECT BELOW)</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                                    <TextInput 
                                        style={[styles.input, { color: themeColors.text, flex: 1 }]} 
                                        placeholder="Staff Identifier" 
                                        value={advisor1Id} 
                                        editable={false}
                                        placeholderTextColor={themeColors.subText} 
                                    />
                                    {advisor1Id ? <TouchableOpacity onPress={() => setAdvisor1Id("")}><Ionicons name="close-circle" size={18} color="#EF4444" /></TouchableOpacity> : null}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.subText }]}>CO-LEAD (OPTIONAL)</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                                    <TextInput 
                                        style={[styles.input, { color: themeColors.text, flex: 1 }]} 
                                        placeholder="Assistant Lead" 
                                        value={advisor2Id} 
                                        editable={false}
                                        placeholderTextColor={themeColors.subText} 
                                    />
                                    {advisor2Id ? <TouchableOpacity onPress={() => setAdvisor2Id("")}><Ionicons name="close-circle" size={18} color="#EF4444" /></TouchableOpacity> : null}
                                </View>
                            </View>

                            <Text style={[styles.indexTitle, { color: themeColors.subText }]}>STAFF REPOSITORY</Text>
                            <View style={[styles.staffPicker, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                {staffList.map(s => {
                                    const isActive = advisor1Id === s.id.toString() || advisor2Id === s.id.toString();
                                    return (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={[styles.staffItem, { backgroundColor: themeColors.card, borderColor: isActive ? '#6366F1' : 'transparent', borderWidth: isActive ? 1.5 : 0 }]}
                                            onPress={() => {
                                                if (!advisor1Id) setAdvisor1Id(s.id.toString());
                                                else if (!advisor2Id && advisor1Id !== s.id.toString()) setAdvisor2Id(s.id.toString());
                                            }}
                                        >
                                            <View style={[styles.staffAvatar, { backgroundColor: '#6366F115' }]}>
                                                <Text style={[styles.staffAvatarTxt, { color: '#6366F1' }]}>{s.username[0].toUpperCase()}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.staffName, { color: themeColors.text }]}>{s.first_name || s.username}</Text>
                                                <Text style={[styles.staffId, { color: themeColors.subText }]}>ID: {s.id} • {s.designation || "Faculty"}</Text>
                                            </View>
                                            <Ionicons name={isActive ? "checkmark-circle" : "add-circle-outline"} size={22} color={isActive ? "#10B981" : "#6366F1"} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity style={[styles.commitBtn, { backgroundColor: '#6366F1' }]} onPress={handleSubmit}>
                                <Text style={styles.commitBtnText}>{editingId ? "SYNC CHANGES" : "DEPLOY LEADERSHIP"}</Text>
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
    addBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },

    listContent: { padding: 25, paddingBottom: 120 },
    heroSection: { marginBottom: 35 },
    heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    heroDesc: { fontSize: 14, marginTop: 8, lineHeight: 22, opacity: 0.8 },

    card: { borderRadius: 32, padding: 24, marginBottom: 20, elevation: 4, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    yearBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    yearText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    actionHeader: { flexDirection: 'row', gap: 10 },
    editBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    trashBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    personnelSection: { borderRadius: 24, padding: 18 },
    personRow: { flexDirection: 'row', alignItems: 'center' },
    personIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    personRole: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    personName: { fontSize: 15, fontWeight: '800', marginTop: 2 },
    vConnect: { width: 2, height: 16, marginLeft: 19, marginVertical: 4, opacity: 0.3 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
    modalSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 4 },
    closeBtn: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginLeft: 10 },
    inputGroup: { marginBottom: 22 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 18, borderWidth: 1 },
    input: { height: 56, fontSize: 15, fontWeight: '700' },

    indexTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 15, marginTop: 10, marginLeft: 10 },
    staffPicker: { borderRadius: 28, padding: 12, maxHeight: 300, marginBottom: 30 },
    staffItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, marginBottom: 8, elevation: 2 },
    staffAvatar: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    staffAvatarTxt: { fontSize: 16, fontWeight: '900' },
    staffName: { fontSize: 14, fontWeight: '800' },
    staffId: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.7 },

    commitBtn: { height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    commitBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 20 }
});
