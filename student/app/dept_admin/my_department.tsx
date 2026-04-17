// app/dept_admin/my_department.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

export default function MyDepartmentScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [department, setDepartment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMyDept();
    }, []);

    const fetchMyDept = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const listRes = await fetch(`${API_BASE_URL}/api/accounts/departments/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (listRes.ok) {
                const list = await listRes.json();
                setDepartment({ name: "Academic Faculty", code: "ENG-TECH" });
            } else {
                setError("Access denied.");
            }
        } catch (e) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const actions = [
        { id: 'bulk', title: 'Bulk Provisioning', sub: 'Import user batches via CSV', icon: 'cloud-upload', color: '#6366F1', route: '/dept_admin/bulk_upload' },
        { id: 'staff', title: 'Faculty Registry', sub: 'Manage department staff records', icon: 'people', color: '#8B5CF6', route: '/dept_admin/staff_list' },
        { id: 'students', title: 'Student Roster', sub: 'Review active student database', icon: 'school', color: '#EC4899', route: '/dept_admin/student_list' },
        { id: 'advisors', title: 'Advisory Panel', sub: 'Designate class mentors', icon: 'people-circle', color: '#F59E0B', route: '/dept_admin/class_advisors' },
        { id: 'reports', title: 'Oversight Reports', sub: 'Academic and attendance audits', icon: 'analytics', color: '#10B981', route: '/dept_admin/attendance_report' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Governance</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>OPERATIONAL CONTROL</Text>
                </View>
                <TouchableOpacity onPress={fetchMyDept} style={[styles.refreshBtn, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name="refresh" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.hero}>
                    <Text style={[styles.heroTitle, { color: themeColors.text }]}>Department Management</Text>
                    <Text style={[styles.heroDesc, { color: themeColors.subText }]}>Executive command center for academic oversight and data provisioning.</Text>
                </View>

                <View style={styles.actionGrid}>
                    {actions.map(action => (
                        <TouchableOpacity
                            key={action.id}
                            style={[styles.actionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                            onPress={() => router.push(action.route as any)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: action.color + '15' }]}>
                                <Ionicons name={action.icon as any} size={24} color={action.color} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.cardTitle, { color: themeColors.text }]}>{action.title}</Text>
                                <Text style={[styles.cardSub, { color: themeColors.subText }]}>{action.sub}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={themeColors.border} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

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

    scrollContent: { padding: 25, paddingBottom: 120 },
    hero: { marginBottom: 35 },
    heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    heroDesc: { fontSize: 14, marginTop: 8, lineHeight: 22, opacity: 0.8 },

    actionGrid: { gap: 15 },
    actionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 32, padding: 20, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 15 },
    cardTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
    cardSub: { fontSize: 12, fontWeight: '600', marginTop: 3, opacity: 0.8 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
