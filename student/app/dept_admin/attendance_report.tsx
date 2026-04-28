// app/dept_admin/attendance_report.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, TextInput, FlatList, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

const { width } = Dimensions.get("window");

interface AttendanceRecord {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    year: number;
    section: string;
    staff_name: string;
    subject_name: string;
    present_count: number;
    absent_count: number;
    total_count: number;
    percentage: number;
}

export default function AttendanceReport() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const res = await axios.get(`${API_BASE_URL}/api/academic/attendance-history/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const filtered = history.filter(item =>
        item.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.year.toString().includes(searchQuery)
    );

    const renderAttendance = ({ item }: { item: AttendanceRecord }) => (
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.cardHeader}>
                <View style={styles.dateTime}>
                    <Ionicons name="calendar-outline" size={14} color={themeColors.subText} />
                    <Text style={[styles.dateTxt, { color: themeColors.subText }]}>{item.date}</Text>
                    <View style={[styles.vDividerSmall, { backgroundColor: themeColors.border }]} />
                    <Ionicons name="time-outline" size={14} color={themeColors.subText} />
                    <Text style={[styles.timeTxt, { color: themeColors.text }]}>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</Text>
                </View>
                <View style={[styles.pctBadge, { backgroundColor: item.percentage >= 75 ? '#10B98120' : '#EF444420' }]}>
                    <Text style={[styles.pctTxt, { color: item.percentage >= 75 ? '#10B981' : '#EF4444' }]}>{item.percentage.toFixed(1)}%</Text>
                </View>
            </View>

            <View style={styles.subjectBox}>
                <Text style={[styles.subjectName, { color: themeColors.text }]}>{item.subject_name}</Text>
                <Text style={[styles.staffName, { color: themeColors.subText }]}>Lecturer: {item.staff_name}</Text>
            </View>

            <View style={styles.classBox}>
                <View style={[styles.classTag, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <Text style={[styles.classTxt, { color: themeColors.subText }]}>YEAR {item.year} - {item.section}</Text>
                </View>
            </View>

            <View style={[styles.statsRow, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statLab, { color: themeColors.subText }]}>PRESENT</Text>
                    <Text style={[styles.statVal, { color: '#10B981' }]}>{item.present_count}</Text>
                </View>
                <View style={[styles.vDivider, { backgroundColor: themeColors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statLab, { color: themeColors.subText }]}>ABSENT</Text>
                    <Text style={[styles.statVal, { color: '#EF4444' }]}>{item.absent_count}</Text>
                </View>
                <View style={[styles.vDivider, { backgroundColor: themeColors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statLab, { color: themeColors.subText }]}>TOTAL</Text>
                    <Text style={[styles.statVal, { color: themeColors.text }]}>{item.total_count}</Text>
                </View>
            </View>

            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: item.percentage >= 75 ? '#10B981' : '#F59E0B' }]} />
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
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Audit Ledger</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>ENGAGEMENT ANALYSIS</Text>
                </View>
                <TouchableOpacity onPress={fetchHistory} style={[styles.refreshBtn, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name="refresh" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            <View style={[styles.searchSection, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <Ionicons name="search" size={18} color={themeColors.subText} />
                    <TextInput
                        style={[styles.searchInput, { color: themeColors.text }]}
                        placeholder="Search lecturers or subjects..."
                        placeholderTextColor={themeColors.subText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><EduLoading size={60} /></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderAttendance}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={[styles.intelligenceStrip, { backgroundColor: '#6366F1' }]}>
                            <View style={styles.iStat}>
                                <Text style={styles.iVal}>{history.length}</Text>
                                <Text style={styles.iLab}>AUDITS</Text>
                            </View>
                            <View style={[styles.vDividerWhite, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                            <View style={styles.iStat}>
                                <Text style={styles.iVal}>
                                    {(history.reduce((acc, curr) => acc + curr.percentage, 0) / (history.length || 1)).toFixed(1)}%
                                </Text>
                                <Text style={styles.iLab}>AVERAGE</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="clipboard-text-off-outline" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>No activity discovered.</Text>
                        </View>
                    }
                />
            )}
            
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
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },

    listContent: { padding: 25, paddingBottom: 150 },
    intelligenceStrip: { flexDirection: 'row', borderRadius: 28, padding: 25, marginBottom: 30, elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 10 },
    iStat: { flex: 1, alignItems: 'center' },
    iVal: { fontSize: 24, fontWeight: '900', color: '#fff' },
    iLab: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.7)', marginTop: 5, letterSpacing: 1.5 },
    vDividerWhite: { width: 1, height: '100%' },

    card: { borderRadius: 32, padding: 24, marginBottom: 20, elevation: 4, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    dateTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateTxt: { fontSize: 12, fontWeight: '700' },
    timeTxt: { fontSize: 12, fontWeight: '700' },
    vDividerSmall: { width: 1, height: 12, marginHorizontal: 4 },
    pctBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    pctTxt: { fontSize: 13, fontWeight: '900' },

    subjectBox: { marginBottom: 15 },
    subjectName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    staffName: { fontSize: 13, fontWeight: '700', marginTop: 4 },

    classBox: { marginBottom: 18 },
    classTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    classTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderRadius: 20, paddingVertical: 18, marginBottom: 18 },
    statItem: { alignItems: 'center' },
    statLab: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    statVal: { fontSize: 18, fontWeight: '900', marginTop: 4 },
    vDivider: { width: 1, height: 25 },

    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 20 }
});
