// app/dept_admin/student_biodata.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    TextInput, Modal, Alert, ScrollView, Switch, StatusBar,
    ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";
import axios from 'axios';

interface Student {
    id: number;
    roll_no: string;
    register_number: string;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        username: string
    };
    year: number;
    section: string;
    course: string;
    semester?: number;
    mobile_number: string;
    dob: string;
    gender: string;
    blood_group: string;
    address: string;
    community: string;
    caste: string;
    religion: string;
    nationality: string;
    father_name: string;
    mother_name: string;
    parent_contact: string;
    tenth_marks: number;
    twelfth_marks: number;
    academic_status: string;
    avatar_url?: string;
}

export default function StudentBiodata() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [filterYear, setFilterYear] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStudents();
    }, [filterYear]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            let url = `${API_BASE_URL}/api/academic/students/`;
            if (filterYear) url += `?year=${filterYear}`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data);
        } catch (error) {
            Alert.alert("Execution Fault", "Network error encountered.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (student: Student) => {
        setSelectedStudent(student);
        setEditForm({
            first_name: student.user.first_name,
            last_name: student.user.last_name,
            email: student.user.email,
            roll_no: student.roll_no,
            register_number: student.register_number,
            year: student.year?.toString(),
            semester: student.semester?.toString(),
            section: student.section,
            mobile_number: student.mobile_number,
            address: student.address
        });
        setIsEditing(false);
    };

    const handleSaveEdits = async () => {
        if (!selectedStudent) return;
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const res = await axios.patch(`${API_BASE_URL}/api/academic/students/${selectedStudent.id}/`, {
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                email: editForm.email,
                roll_no: editForm.roll_no,
                register_number: editForm.register_number,
                year: parseInt(editForm.year),
                semester: parseInt(editForm.semester),
                section: editForm.section,
                mobile_number: editForm.mobile_number,
                address: editForm.address
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 200) {
                Alert.alert("Success", "Profile records updated.");
                setIsEditing(false);
                fetchStudents();
                // Update local selected student
                setSelectedStudent(res.data);
            }
        } catch (err) {
            Alert.alert("Error", "Failed to update student records.");
        } finally {
            setSaving(false);
        }
    };

    const updateAcademicStatus = async (studentId: number, status: string) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/academic/students/update_academic_status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_ids: [studentId],
                    status: status
                })
            });
            if (response.ok) {
                setStudents(prev => prev.map(s =>
                    s.id === studentId ? { ...s, academic_status: status } : s
                ));
                if (selectedStudent) {
                    setSelectedStudent(prev => prev ? { ...prev, academic_status: status } : null);
                }
                Alert.alert("Authorized", "Academic status synchronized.");
            }
        } catch (error) {
            Alert.alert("Failure", "Could not commit decisions.");
        }
    };

    const filtered = students.filter(s =>
        s.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Student }) => (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
            activeOpacity={0.8}
            onPress={() => handleOpenModal(item)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: '#6366F115' }]}>
                            <Text style={styles.avatarTxt}>{item.user.first_name[0]}</Text>
                        </View>
                    )}
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.user.first_name} {item.user.last_name}</Text>
                    <Text style={[styles.cardRoll, { color: themeColors.subText }]}>{item.roll_no} • Year {item.year}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: item.academic_status === 'Studying' ? '#10B98115' : '#EF444415' }]}>
                    <Text style={[styles.statusTagTxt, { color: item.academic_status === 'Studying' ? '#10B981' : '#EF4444' }]}>
                        {item.academic_status?.toUpperCase() || 'STUDYING'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Registry</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>STUDENT PROFILES</Text>
                </View>
                <TouchableOpacity onPress={fetchStudents} style={[styles.refreshBtn, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name="refresh" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            <View style={[styles.searchSection, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <Ionicons name="search" size={18} color={themeColors.subText} />
                    <TextInput
                        style={[styles.searchInput, { color: themeColors.text }]}
                        placeholder="Filter by name or roll number..."
                        placeholderTextColor={themeColors.subText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
                    {['1', '2', '3', '4'].map(y => (
                        <TouchableOpacity key={y} onPress={() => setFilterYear(filterYear === y ? '' : y)}
                            style={[styles.fChip, { backgroundColor: filterYear === y ? '#6366F1' : isDark ? '#1E293B' : '#F1F5F9' }]}>
                            <Text style={[styles.fText, { color: filterYear === y ? '#fff' : themeColors.subText }]}>YEAR {y}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={fetchStudents}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={[styles.sectionTitle, { color: themeColors.subText }]}>RECORDS LIST</Text>
                        <View style={[styles.countPill, { backgroundColor: '#6366F115' }]}>
                            <Text style={[styles.countTxt, { color: '#6366F1' }]}>TOTAL: {filtered.length}</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="account-search-outline" size={80} color={themeColors.border} />
                        <Text style={[styles.emptyText, { color: themeColors.subText }]}>No matching profiles found.</Text>
                    </View>
                }
            />

            <Modal visible={!!selectedStudent} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                {selectedStudent && (
                    <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={[styles.editBtn, { backgroundColor: isEditing ? '#6366F115' : 'transparent' }]}>
                                <Ionicons name={isEditing ? "close-circle" : "create-outline"} size={22} color={isEditing ? "#EF4444" : "#6366F1"} />
                                <Text style={[styles.editBtnTxt, { color: isEditing ? "#EF4444" : "#6366F1" }]}>{isEditing ? "Cancel" : "Edit Profile"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setSelectedStudent(null)} style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                            <View style={styles.primeProfile}>
                                <View style={styles.avatarWrapper}>
                                    {selectedStudent.avatar_url ? (
                                        <Image source={{ uri: selectedStudent.avatar_url }} style={styles.largeAvatar} />
                                    ) : (
                                        <View style={[styles.largeAvatar, { backgroundColor: '#6366F120' }]}>
                                            <Text style={styles.largeAvatarTxt}>{selectedStudent.user.first_name[0]}</Text>
                                        </View>
                                    )}
                                </View>
                                
                                {isEditing ? (
                                    <View style={styles.editNameRow}>
                                        <TextInput 
                                            style={[styles.editInput, styles.nameInput, { color: themeColors.text }]} 
                                            value={editForm.first_name} 
                                            onChangeText={t => setEditForm({...editForm, first_name: t})}
                                            placeholder="First Name"
                                        />
                                        <TextInput 
                                            style={[styles.editInput, styles.nameInput, { color: themeColors.text }]} 
                                            value={editForm.last_name} 
                                            onChangeText={t => setEditForm({...editForm, last_name: t})}
                                            placeholder="Last Name"
                                        />
                                    </View>
                                ) : (
                                    <Text style={[styles.name, { color: themeColors.text }]}>{selectedStudent.user.first_name} {selectedStudent.user.last_name}</Text>
                                )}
                                <Text style={[styles.subName, { color: themeColors.subText }]}>{selectedStudent.roll_no} • {selectedStudent.course}</Text>
                            </View>

                            <View style={[styles.statGrid, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                <View style={styles.statCol}>
                                    {isEditing ? (
                                        <TextInput 
                                            style={[styles.statVal, { color: '#10B981' }]} 
                                            value={editForm.semester} 
                                            keyboardType="numeric"
                                            onChangeText={t => setEditForm({...editForm, semester: t})}
                                        />
                                    ) : (
                                        <Text style={[styles.statVal, { color: '#10B981' }]}>{selectedStudent.semester || 'NA'}</Text>
                                    )}
                                    <Text style={[styles.statLab, { color: themeColors.subText }]}>SEM</Text>
                                </View>
                                <View style={[styles.vDivider, { backgroundColor: themeColors.border }]} />
                                <View style={styles.statCol}>
                                    {isEditing ? (
                                        <TextInput 
                                            style={[styles.statVal, { color: '#F59E0B' }]} 
                                            value={editForm.year} 
                                            keyboardType="numeric"
                                            onChangeText={t => setEditForm({...editForm, year: t})}
                                        />
                                    ) : (
                                        <Text style={[styles.statVal, { color: '#F59E0B' }]}>{selectedStudent.year}</Text>
                                    )}
                                    <Text style={[styles.statLab, { color: themeColors.subText }]}>YEAR</Text>
                                </View>
                            </View>

                            {isEditing && (
                                <View style={styles.saveActionArea}>
                                    <TouchableOpacity 
                                        style={[styles.finalSaveBtn, saving && { opacity: 0.7 }]} 
                                        onPress={handleSaveEdits}
                                        disabled={saving}
                                    >
                                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.finalSaveText}>Save Changes</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={[styles.sectionHeader, { color: themeColors.subText, marginTop: isEditing ? 20 : 0 }]}>ACADEMIC STATUS</Text>
                            <View style={styles.statusGrid}>
                                {['Studying', 'Discontinued'].map(status => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.statusChip, { backgroundColor: selectedStudent.academic_status === status ? (status === 'Studying' ? '#10B981' : '#EF4444') : isDark ? '#1E293B' : '#F1F5F9' }]}
                                        onPress={() => updateAcademicStatus(selectedStudent.id, status)}
                                    >
                                        <Text style={[styles.statusText, { color: selectedStudent.academic_status === status ? '#fff' : themeColors.subText }]}>{status.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.sectionHeader, { color: themeColors.subText, marginTop: 30 }]}>CONTACT DETAILS</Text>
                            <View style={[styles.contactBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                <View style={styles.cRow}>
                                    <Ionicons name="call-outline" size={16} color={themeColors.subText} />
                                    {isEditing ? (
                                        <TextInput 
                                            style={[styles.editInput, { color: themeColors.text, flex: 1 }]} 
                                            value={editForm.mobile_number} 
                                            onChangeText={t => setEditForm({...editForm, mobile_number: t})}
                                            keyboardType="phone-pad"
                                        />
                                    ) : (
                                        <Text style={[styles.cText, { color: themeColors.text }]}>{selectedStudent.mobile_number}</Text>
                                    )}
                                </View>
                                <View style={styles.cRow}>
                                    <Ionicons name="mail-outline" size={16} color={themeColors.subText} />
                                    {isEditing ? (
                                        <TextInput 
                                            style={[styles.editInput, { color: themeColors.text, flex: 1 }]} 
                                            value={editForm.email} 
                                            onChangeText={t => setEditForm({...editForm, email: t})}
                                        />
                                    ) : (
                                        <Text style={[styles.cText, { color: themeColors.text }]}>{selectedStudent.user.email}</Text>
                                    )}
                                </View>
                                <View style={styles.cRow}>
                                    <Ionicons name="location-outline" size={16} color={themeColors.subText} />
                                    {isEditing ? (
                                        <TextInput 
                                            style={[styles.editInput, { color: themeColors.text, flex: 1 }]} 
                                            value={editForm.address} 
                                            onChangeText={t => setEditForm({...editForm, address: t})}
                                            multiline
                                        />
                                    ) : (
                                        <Text style={[styles.cText, { color: themeColors.text }]}>{selectedStudent.address}</Text>
                                    )}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                )}
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

    searchSection: { padding: 15, borderBottomWidth: 1 },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1, marginBottom: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
    filterStrip: { gap: 10 },
    fChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    fText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    list: { padding: 25, paddingBottom: 150 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    countPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    countTxt: { fontSize: 10, fontWeight: '900' },
    card: { borderRadius: 32, padding: 20, marginBottom: 15, elevation: 4, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
    avatar: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 18, fontWeight: '900', color: '#6366F1' },
    cardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 2, letterSpacing: -0.3 },
    cardRoll: { fontSize: 12, fontWeight: '700' },
    statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusTagTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, gap: 8 },
    editBtnTxt: { fontSize: 13, fontWeight: '700' },
    closeBtn: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    primeProfile: { alignItems: 'center', marginBottom: 35 },
    avatarWrapper: { width: 90, height: 90, borderRadius: 32, overflow: 'hidden', marginBottom: 15 },
    largeAvatar: { width: 90, height: 90, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    largeAvatarTxt: { fontSize: 36, fontWeight: '900', color: '#6366F1' },
    name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
    subName: { fontSize: 14, fontWeight: '700', marginTop: 4 },
    
    editNameRow: { flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center' },
    editInput: { borderBottomWidth: 1, borderBottomColor: '#6366F1', paddingVertical: 2, fontSize: 16, fontWeight: '600' },
    nameInput: { width: '45%', fontSize: 20, textAlign: 'center' },

    statGrid: { flexDirection: 'row', borderRadius: 28, padding: 25, marginBottom: 35 },
    statCol: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 22, fontWeight: '900', minWidth: 40, textAlign: 'center' },
    statLab: { fontSize: 9, fontWeight: '900', marginTop: 5, letterSpacing: 1 },
    vDivider: { width: 1, height: '100%' },

    saveActionArea: { marginBottom: 30 },
    finalSaveBtn: { backgroundColor: '#6366F1', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    finalSaveText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    sectionHeader: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
    statusGrid: { flexDirection: 'row', gap: 10 },
    statusChip: { flex: 1, paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
    statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    contactBox: { padding: 25, borderRadius: 28, gap: 15 },
    cRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cText: { fontSize: 14, fontWeight: '700' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 25 }
});
