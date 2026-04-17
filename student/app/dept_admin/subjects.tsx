// app/dept_admin/subjects.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Modal, Alert, ScrollView, StatusBar,
    Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

const { width } = Dimensions.get('window');

interface Subject {
    id: number;
    name: string;
    code: string;
    transcript_credits: number;
    subject_type: string;
    subject_category: string;
    semester: number;
    year: number;
}

export default function SubjectManagement() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Filters
    const [filterYear, setFilterYear] = useState<string>('All');
    const [filterSemester, setFilterSemester] = useState<string>('All');
    const [showFilters, setShowFilters] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        name: '', code: '', alias: '',
        type: 'Theory', category: 'Core', semester: '1', year: '1'
    });

    const [instructionModal, setInstructionModal] = useState(false);

    // Bulk Upload
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [file, setFile] = useState<any>(null);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const res = await axios.get(`${API_BASE_URL}/api/academic/subjects/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSubjects(); }, []);

    const handleAction = async () => {
        if (!formData.name || !formData.code) return Alert.alert("Required", "Subject name and code are mandatory.");

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const payload = {
                name: formData.name,
                code: formData.code,
                alias: formData.alias,
                transcript_credits: 3,
                subject_type: formData.type,
                subject_category: formData.category,
                semester: parseInt(formData.semester),
                year: parseInt(formData.year)
            };

            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/academic/subjects/${editingId}/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE_URL}/api/academic/subjects/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            Alert.alert("Success", "Catalog synchronized.");
            setModalVisible(false);
            fetchSubjects();
        } catch (error) {
            Alert.alert("Error", "Could not commit record.");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id: number) => {
        Alert.alert("Erase Subject", "Remove this record from the academic registry?", [
            { text: "Abort", style: "cancel" },
            {
                text: "Confirm", style: "destructive", onPress: async () => {
                    const token = await AsyncStorage.getItem('accessToken');
                    try {
                        await axios.delete(`${API_BASE_URL}/api/academic/subjects/${id}/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchSubjects();
                    } catch (e) { Alert.alert("Failure", "Could not delete."); }
                }
            }
        ]);
    };

    const processUpload = async (isPreview = true) => {
        if (!file && isPreview) {
            setInstructionModal(true);
            return;
        }
        processUploadFile(file, isPreview);
    };

    const processUploadFile = async (targetFile: any, isPreview: boolean) => {
        setLoading(true);
        try {
            if (!targetFile) return;
            const token = await AsyncStorage.getItem('accessToken');
            const data = new FormData();

            data.append('file', {
                uri: targetFile.uri,
                name: targetFile.name,
                type: targetFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            } as any);

            if (isPreview) data.append('preview', 'true');

            const res = await axios.post(`${API_BASE_URL}/api/academic/subjects/upload/`, data, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            if (isPreview) {
                setPreviewData(res.data);
                setUploadModalVisible(true);
            } else {
                Alert.alert("Upload Validated", `${res.data.valid_count} entries injected.`);
                setUploadModalVisible(false);
                setPreviewData(null);
                setFile(null);
                fetchSubjects();
            }
        } catch (e) {
            Alert.alert("Upload Failure", "Check file schema.");
        } finally {
            setLoading(false);
        }
    };

    const filtered = subjects.filter(s => {
        const yMatch = filterYear === 'All' || s.year.toString() === filterYear;
        const sMatch = filterSemester === 'All' || s.semester.toString() === filterSemester;
        return yMatch && sMatch;
    });

    const renderSubject = ({ item }: { item: Subject }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.8}
            onLongPress={() => {
                setEditingId(item.id);
                setFormData({
                    name: item.name, code: item.code, alias: '',
                    type: item.subject_type, category: item.subject_category,
                    semester: item.semester.toString(), year: item.year.toString()
                });
                setModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.codeBadge, { backgroundColor: '#6366F115' }]}>
                    <Text style={[styles.codeText, { color: '#6366F1' }]}>{item.code}</Text>
                </View>
                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
            <Text style={[styles.subjectName, { color: themeColors.text }]}>{item.name}</Text>
            <View style={styles.metaStrip}>
                <View style={[styles.typeBadge, { backgroundColor: item.subject_type === 'Theory' ? '#6366F110' : '#10B98110' }]}>
                    <Text style={[styles.typeText, { color: item.subject_type === 'Theory' ? '#6366F1' : '#10B981' }]}>{item.subject_type.toUpperCase()}</Text>
                </View>
                <Text style={[styles.yearSem, { color: themeColors.subText }]}>Y{item.year} • S{item.semester}</Text>
                <View style={styles.spacer} />
                <Text style={styles.credits}>{item.transcript_credits} CR</Text>
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
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Catalog</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>SUBJECT REGISTRY</Text>
                </View>
                <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
                    <Ionicons name="filter" size={22} color={showFilters ? "#6366F1" : themeColors.subText} />
                </TouchableOpacity>
            </View>

            {showFilters && (
                <View style={[styles.filterSection, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                        <Text style={[styles.filterLabel, { color: themeColors.subText }]}>YEAR</Text>
                        {['All', '1', '2', '3', '4'].map(y => (
                            <TouchableOpacity key={y} onPress={() => setFilterYear(y)} style={[styles.fChip, { backgroundColor: filterYear === y ? '#6366F1' : isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[styles.fText, { color: filterYear === y ? '#fff' : themeColors.subText }]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={[styles.fDivider, { backgroundColor: themeColors.border }]} />
                        <Text style={[styles.filterLabel, { color: themeColors.subText }]}>SEM</Text>
                        {['All', '1', '2', '3', '4', '5', '6', '7', '8'].map(s => (
                            <TouchableOpacity key={s} onPress={() => setFilterSemester(s)} style={[styles.fChip, { backgroundColor: filterSemester === s ? '#10B981' : isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[styles.fText, { color: filterSemester === s ? '#fff' : themeColors.subText }]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading && !modalVisible ? (
                <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderSubject}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.actionHeaderStrip}>
                            <TouchableOpacity style={[styles.primeBtn, { backgroundColor: '#6366F1' }]} onPress={() => { setEditingId(null); setModalVisible(true); }}>
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.primeBtnText}>NEW SUBJECT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} onPress={() => processUpload(true)}>
                                <Ionicons name="cloud-upload-outline" size={20} color={themeColors.text} />
                                <Text style={[styles.primeBtnText, { color: themeColors.text }]}>IMPORT</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="book-off-outline" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>Registry is void.</Text>
                        </View>
                    }
                />
            )}

            {/* Subject Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTag}>{editingId ? "REVISION" : "NEW ENTRY"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{editingId ? "Edit Subject" : "New Subject"}</Text>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themeColors.subText }]}>FULL NOMENCLATURE</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} 
                                    placeholder="e.g. Distributed Computing" 
                                    value={formData.name} 
                                    onChangeText={t => setFormData({ ...formData, name: t })} 
                                    placeholderTextColor={themeColors.subText}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>CORE CODE</Text>
                                    <TextInput 
                                        style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} 
                                        placeholder="CS8101" 
                                        value={formData.code} 
                                        onChangeText={t => setFormData({ ...formData, code: t })} 
                                        placeholderTextColor={themeColors.subText}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>ALIAS</Text>
                                    <TextInput 
                                        style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} 
                                        placeholder="DC" 
                                        value={formData.alias} 
                                        onChangeText={t => setFormData({ ...formData, alias: t })} 
                                        placeholderTextColor={themeColors.subText}
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>YEAR</Text>
                                    <TextInput 
                                        style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} 
                                        keyboardType="numeric" 
                                        value={formData.year} 
                                        onChangeText={t => setFormData({ ...formData, year: t })} 
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>SEMESTER</Text>
                                    <TextInput 
                                        style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]} 
                                        keyboardType="numeric" 
                                        value={formData.semester} 
                                        onChangeText={t => setFormData({ ...formData, semester: t })} 
                                    />
                                </View>
                            </View>

                            <Text style={[styles.label, { color: themeColors.subText }]}>PEDAGOGY TYPE</Text>
                            <View style={styles.chipGrid}>
                                {['Theory', 'Practical', 'Integrated'].map(t => (
                                    <TouchableOpacity 
                                        key={t} 
                                        onPress={() => setFormData({ ...formData, type: t })} 
                                        style={[styles.typeChip, { backgroundColor: formData.type === t ? '#6366F1' : isDark ? '#1E293B' : '#F1F5F9' }]}
                                    >
                                        <Text style={[styles.typeChipTxt, { color: formData.type === t ? '#fff' : themeColors.subText }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={[styles.commitBtn, { backgroundColor: '#6366F1' }]} onPress={handleAction}>
                                <Text style={styles.commitBtnText}>{editingId ? "SYNC CHANGES" : "OFFICIATE ENTRY"}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Preview Modal */}
            <Modal visible={uploadModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: themeColors.card, height: '85%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTag}>FILE VALIDATION</Text>
                            <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {previewData && (
                                <>
                                    <View style={[styles.pStatsStrip, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                        <View style={styles.pStatItem}>
                                            <Text style={[styles.pStatVal, { color: '#10B981' }]}>{previewData.valid_count}</Text>
                                            <Text style={[styles.pStatLab, { color: themeColors.subText }]}>OPTIMAL</Text>
                                        </View>
                                        <View style={styles.pStatItem}>
                                            <Text style={[styles.pStatVal, { color: '#EF4444' }]}>{previewData.errors?.length || 0}</Text>
                                            <Text style={[styles.pStatLab, { color: themeColors.subText }]}>CORRUPT</Text>
                                        </View>
                                    </View>

                                    {previewData.errors?.length > 0 && (
                                        <View style={[styles.errorBox, { backgroundColor: '#EF444410' }]}>
                                            <Text style={styles.errorHeader}>SCHEMA VIOLATIONS</Text>
                                            {previewData.errors.map((err: any, i: number) => (
                                                <Text key={i} style={styles.errorLine}>• {typeof err === 'string' ? err : `Row ${err.row}: ${err.error}`}</Text>
                                            ))}
                                        </View>
                                    )}

                                    {previewData.subjects?.length > 0 && (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
                                            <View style={[styles.previewTable, { borderColor: themeColors.border }]}>
                                                <View style={[styles.tableHdrRow, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                                                    <Text style={[styles.tableHdr, { width: 140, color: themeColors.subText }]}>NAME</Text>
                                                    <Text style={[styles.tableHdr, { width: 80, color: themeColors.subText }]}>CODE</Text>
                                                    <Text style={[styles.tableHdr, { width: 80, color: themeColors.subText }]}>TYPE</Text>
                                                </View>
                                                {previewData.subjects.map((s: any, i: number) => (
                                                    <View key={i} style={[styles.tableDataRow, { borderBottomColor: themeColors.border }]}>
                                                        <Text style={[styles.tableCell, { width: 140, color: themeColors.text }]} numberOfLines={1}>{s.name || "-"}</Text>
                                                        <Text style={[styles.tableCell, { width: 80, color: themeColors.text }]}>{s.code || "-"}</Text>
                                                        <Text style={[styles.tableCell, { width: 80, color: '#6366F1' }]}>{s.subject_type || "-"}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    )}
                                </>
                            )}
                            <TouchableOpacity style={[styles.commitBtn, { backgroundColor: '#6366F1' }]} onPress={() => processUpload(false)}>
                                <Text style={styles.commitBtnText}>EXECUTE IMPORT</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Instruction Modal */}
            <Modal visible={instructionModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
                    <View style={[styles.instructCard, { backgroundColor: themeColors.card }]}>
                        <Text style={[styles.instructTitle, { color: themeColors.text }]}>CSV Blueprint</Text>
                        <Text style={[styles.instructSub, { color: themeColors.subText }]}>The system requires a strict schema for mass ingestion:</Text>

                        <View style={styles.instructList}>
                            {['name (Full Title)', 'code (Identifier)', 'year (1-4)', 'semester (1-8)', 'subject_type (Theory/Practical)'].map((item, i) => (
                                <Text key={i} style={[styles.bullet, { color: themeColors.text }]}>• {item}</Text>
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.fileBtn, { backgroundColor: '#6366F1' }]} onPress={async () => {
                            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
                            if (!result.canceled) {
                                setFile(result.assets[0]);
                                setInstructionModal(false);
                                processUploadFile(result.assets[0], true);
                            }
                        }}>
                            <Text style={styles.fileBtnText}>SELECT SOURCE FILE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setInstructionModal(false)} style={styles.abortLink}>
                            <Text style={styles.abortText}>CANCEL ACTION</Text>
                        </TouchableOpacity>
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

    filterSection: { paddingVertical: 14, borderBottomWidth: 1 },
    filterRow: { paddingHorizontal: 20, alignItems: 'center', gap: 12 },
    filterLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    fChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    fText: { fontSize: 12, fontWeight: '700' },
    fDivider: { width: 1, height: 20, marginHorizontal: 8 },

    listContent: { padding: 25, paddingBottom: 150 },
    actionHeaderStrip: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    primeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 18, elevation: 4 },
    primeBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

    card: { borderRadius: 32, padding: 24, marginBottom: 20, elevation: 4, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    codeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    codeText: { fontSize: 12, fontWeight: '900' },
    subjectName: { fontSize: 18, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
    metaStrip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    yearSem: { fontSize: 12, fontWeight: '700' },
    spacer: { flex: 1 },
    credits: { fontSize: 12, fontWeight: '900', color: '#10B981' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalHeaderTag: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 2 },
    modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 30, letterSpacing: -0.8 },
    closeBtn: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    inputGroup: { marginBottom: 22 },
    row: { flexDirection: 'row', gap: 15 },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginLeft: 10 },
    input: { borderRadius: 20, padding: 18, fontSize: 15, fontWeight: '700', borderWidth: 1 },

    chipGrid: { flexDirection: 'row', gap: 12, marginBottom: 35 },
    typeChip: { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
    typeChipTxt: { fontSize: 12, fontWeight: '900' },
    commitBtn: { height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    commitBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    pStatsStrip: { flexDirection: 'row', borderRadius: 24, padding: 25, marginBottom: 25 },
    pStatItem: { flex: 1, alignItems: 'center' },
    pStatVal: { fontSize: 24, fontWeight: '900' },
    pStatLab: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 5 },

    errorBox: { padding: 20, borderRadius: 22, marginBottom: 25 },
    errorHeader: { color: '#EF4444', fontWeight: '900', fontSize: 11, marginBottom: 12, letterSpacing: 1 },
    errorLine: { color: '#EF4444', fontSize: 13, marginBottom: 6, fontWeight: '600' },

    tableScroll: { marginBottom: 25 },
    previewTable: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
    tableHdrRow: { flexDirection: 'row', padding: 15 },
    tableHdr: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    tableDataRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1 },
    tableCell: { fontSize: 13, fontWeight: '700' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 25 },

    instructCard: { borderRadius: 36, padding: 35, width: '90%', elevation: 20 },
    instructTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
    instructSub: { fontSize: 14, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    instructList: { marginBottom: 35 },
    bullet: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
    fileBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 8 },
    fileBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    abortLink: { alignItems: 'center', padding: 10 },
    abortText: { color: '#EF4444', fontSize: 13, fontWeight: '900', letterSpacing: 1 }
});
