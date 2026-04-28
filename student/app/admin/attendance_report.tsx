import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, TextInput, FlatList, StatusBar, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

interface AttendanceRecord {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    year: number;
    section: string;
    staff_name: string;
    department_name: string;
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
    const [fetching, setFetching] = useState(false);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<AttendanceRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) return router.replace("/login");

            const res = await axios.get(`${API_BASE_URL}/api/academic/attendance-history/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
            setFilteredHistory(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = history.filter(item =>
            item.staff_name.toLowerCase().includes(query) ||
            item.department_name.toLowerCase().includes(query) ||
            item.subject_name.toLowerCase().includes(query)
        );
        setFilteredHistory(filtered);
    }, [searchQuery, history]);

    const renderItem = ({ item }: { item: AttendanceRecord }) => {
        const statusColor = (item.percentage || 0) > 75 ? '#10B981' : '#F59E0B';
        
        return (
            <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.deptPill, { backgroundColor: '#6366F115' }]}>
                        <MaterialCommunityIcons name="office-building" size={14} color="#6366F1" />
                        <Text style={styles.deptTxt}>{item.department_name.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.dateText, { color: themeColors.subText }]}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>

                <View style={styles.mainInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.subjectRow}>
                        <View style={[styles.iconHole, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: themeColors.border }]}>
                            <FontAwesome5 name="book-reader" size={20} color="#6366F1" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.subjectText, { color: themeColors.text }]} numberOfLines={1}>{item.subject_name}</Text>
                            <View style={styles.staffDetails}>
                                <Text style={styles.staffName}>{item.staff_name}</Text>
                                <View style={[styles.dot, { backgroundColor: themeColors.border }]} />
                                <Text style={[styles.classText, { color: themeColors.subText }]}>Year {item.year} • Sec {item.section}</Text>
                            </View>
                        </View>
                    </View>
                    </View>

                    <View style={styles.temporalRow}>
                        <Ionicons name="time-outline" size={14} color={themeColors.subText} />
                        <Text style={[styles.timeText, { color: themeColors.subText }]}>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</Text>
                    </View>
                </View>

                <View style={[styles.auditStats, { borderTopColor: themeColors.border }]}>
                    <View style={styles.progressSection}>
                        <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                            <View style={[styles.progressFill, { width: `${item.percentage || 0}%`, backgroundColor: statusColor }]} />
                        </View>
                        <Text style={[styles.percentTxt, { color: themeColors.text }]}>{item.percentage ? item.percentage.toFixed(0) : '0'}%</Text>
                    </View>

                    <View style={{ marginTop: 10 }}>
                    <View style={[styles.gridMetrics, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: 'transparent' }]}>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metLab, { color: themeColors.subText }]}>Present</Text>
                            <Text style={[styles.metVal, { color: '#10B981' }]}>{item.present_count}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metLab, { color: themeColors.subText }]}>Absent</Text>
                            <Text style={[styles.metVal, { color: '#EF4444' }]}>{item.absent_count}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metLab, { color: themeColors.subText }]}>Total</Text>
                            <Text style={[styles.metVal, { color: themeColors.text }]}>{item.total_count}</Text>
                        </View>
                    </View>
                    </View>
                </View>
            </View>
        );
    };

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
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Attendance</Text>
                        <Text style={[styles.headerSub, { color: themeColors.subText }]}>REPORTS</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setFetching(true); fetchHistory(); }} style={styles.refreshBtn}>
                        <Ionicons name="sync" size={20} color="#6366F1" />
                    </TouchableOpacity>
                </View>

                {/* Search Box */}
                <View style={{ padding: 20 }}>
                <View style={[styles.controlBox, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
                    <View style={[styles.searchBar, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: themeColors.border }]}>
                        <Ionicons name="search" size={20} color="#6366F1" />
                        <TextInput
                            style={[styles.searchInput, { color: themeColors.text }]}
                            placeholder="Search by department, teacher or subject..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={themeColors.outline}
                        />
                    </View>
                </View>
                </View>

                {loading ? (
                    <View style={styles.center}><EduLoading size={60} /></View>
                ) : (
                    <FlatList
                        data={filteredHistory}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listScroll}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={fetching} onRefresh={() => { setFetching(true); fetchHistory(); }} colors={["#6366F1"]} />}
                        ListHeaderComponent={
                            <View style={styles.summaryStrip}>
                                <Text style={[styles.summaryTxt, { color: themeColors.subText }]}>TOTAL RECORDS: <Text style={{ color: '#6366F1', fontWeight: '900' }}>{filteredHistory.length}</Text></Text>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialCommunityIcons name="calendar-search" size={80} color={themeColors.border} />
                                <Text style={[styles.emptyTxt, { color: themeColors.subText }]}>No attendance records found for your search.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
    headerTitleBox: { flex: 1, marginLeft: 10 },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

    controlBox: {  },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, height: 58, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '700' },

    listScroll: { padding: 20, paddingBottom: 100 },
    summaryStrip: { marginBottom: 20, paddingHorizontal: 4 },
    summaryTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

    card: { borderRadius: 32, padding: 24, marginBottom: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    deptPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    deptTxt: { fontSize: 9, fontWeight: '900', color: '#6366F1', letterSpacing: 1 },
    dateText: { fontSize: 12, fontWeight: '800' },

    mainInfo: { marginBottom: 25 },
    subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconHole: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    subjectText: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    staffDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    staffName: { fontSize: 14, fontWeight: '800', color: '#6366F1' },
    dot: { width: 4, height: 4, borderRadius: 2 },
    classText: { fontSize: 12, fontWeight: '700' },
    temporalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 62 },
    timeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    auditStats: { borderTopWidth: 1, paddingTop: 20 },
    progressSection: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
    progressTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5 },
    percentTxt: { fontSize: 16, fontWeight: '900', width: 45, textAlign: 'right' },

    gridMetrics: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18, borderRadius: 24, borderWidth: 1 },
    metricItem: { alignItems: 'center' },
    metLab: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    metVal: { fontSize: 20, fontWeight: '900', marginTop: 4 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 25, paddingHorizontal: 50, lineHeight: 22 }
});
