import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, FlatList, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { theme } from '../theme';
import EduLoading from "../../components/EduLoading";

interface AttendanceRecord {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    year: number;
    section: string;
    subject_name: string;
    present_count: number;
    absent_count: number;
    total_count: number;
    percentage: number;
    hour?: string;
}

export default function AttendanceHistory() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/academic/attendance-history/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            } else {
                console.error("Failed to fetch history");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network Error");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summary Stats
    const totalClasses = history.length;
    const totalPresent = history.reduce((sum, item) => sum + item.present_count, 0);
    const totalAbsent = history.reduce((sum, item) => sum + item.absent_count, 0);
    const avgPercentage = totalClasses > 0
        ? (history.reduce((sum, item) => sum + (item.percentage || 0), 0) / totalClasses).toFixed(1)
        : "0";

    const HeaderComponent = () => (
        <View style={styles.summaryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                <View style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.summaryValue, { color: theme.colors.onPrimaryContainer }]}>{totalClasses}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onPrimaryContainer }]}>Total Classes</Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <Text style={[styles.summaryValue, { color: theme.colors.onSecondaryContainer }]}>{avgPercentage}%</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onSecondaryContainer }]}>Avg Attendance</Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
                    <Text style={[styles.summaryValue, { color: theme.colors.onTertiaryContainer }]}>{totalPresent}</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.onTertiaryContainer }]}>Total Present</Text>
                </View>
            </ScrollView>
            <Text style={styles.sectionTitle}>History</Text>
        </View>
    );

    const renderItem = ({ item }: { item: AttendanceRecord }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    <Text style={styles.timeText}>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</Text>
                </View>
                <View style={[styles.percentageBadge, {
                    backgroundColor: (item.percentage || 0) >= 75 ? '#E8F5E9' : '#FFEBEE'
                }]}>
                    <Text style={[styles.percentageText, {
                        color: (item.percentage || 0) >= 75 ? '#2E7D32' : '#C62828'
                    }]}>
                        {(item.percentage || 0).toFixed(0)}%
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
                <Text style={styles.subjectText}>{item.subject_name}</Text>
                <Text style={styles.classText}>Year {item.year} • Sec {item.section}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.present_count}</Text>
                        <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.absent_count}</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.total_count}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (loading) return (
        <View style={styles.center}>
            <EduLoading size={60} />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance History</Text>
                <TouchableOpacity onPress={fetchHistory} style={styles.iconButton}>
                    <Ionicons name="refresh" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListHeaderComponent={HeaderComponent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="time-outline" size={48} color={theme.colors.outlineVariant} />
                        <Text style={styles.emptyText}>No attendance records found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
        backgroundColor: theme.colors.surface,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.onSurface },
    iconButton: { padding: 8 },

    list: { paddingBottom: 40 },

    // Summary
    summaryContainer: { marginBottom: 20, paddingTop: 10 },
    summaryCard: {
        padding: 16, borderRadius: theme.shapes.large,
        marginRight: 12, minWidth: 120, alignItems: 'center', justifyContent: 'center'
    },
    summaryValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    summaryLabel: { fontSize: 12, fontWeight: '500' },

    sectionTitle: {
        fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface,
        marginLeft: 20, marginTop: 24, marginBottom: 12
    },

    // Card
    card: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 20, marginBottom: 16,
        borderRadius: theme.shapes.medium,
        elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16
    },
    dateText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface },
    timeText: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 },
    percentageBadge: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100
    },
    percentageText: { fontSize: 14, fontWeight: 'bold' },

    divider: { height: 1, backgroundColor: theme.colors.outlineVariant, opacity: 0.5 },

    cardBody: { padding: 16 },
    subjectText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface },
    classText: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 16 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface },
    statLabel: { fontSize: 12, color: theme.colors.onSurfaceVariant },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: theme.colors.outline, fontSize: 16 }
});
