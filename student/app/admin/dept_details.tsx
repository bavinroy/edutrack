// app/admin/dept_details.tsx
import React, { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, StatusBar, Dimensions, Image, RefreshControl, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";

const { width } = Dimensions.get("window");

type User = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_pic?: string;
    role: string;
    student_id?: number;
};

export default function DepartmentDetails() {
    const router = useRouter();
    const { id, name } = useLocalSearchParams<{ id: string, name: string }>();
    const { isDark, theme: themeColors } = useTheme();

    const [activeTab, setActiveTab] = useState<'admin' | 'staff' | 'students'>('admin');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [counts, setCounts] = useState({ admin: 0, staff: 0, students: 0 });

    useEffect(() => { fetchUsers(); }, [activeTab]);

    const fetchUsers = async () => {
        setFetching(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            let endpoint = "";
            if (activeTab === 'admin') endpoint = "/api/accounts/department-admin/";
            else if (activeTab === 'staff') endpoint = "/api/accounts/department-staff/";
            else endpoint = "/api/accounts/department-student/";

            const res = await axios.get(`${API_BASE_URL}${endpoint}?dept_id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
            setCounts(prev => ({ ...prev, [activeTab]: res.data.length }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    const renderUser = ({ item }: { item: User }) => (
        <TouchableOpacity 
            style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.7}
            onPress={() => {
                if (item.role === 'DEPT_STFF' || item.role === 'DEPT_STAFF' || item.role === 'DEPT_ADMIN') {
                    router.push({ pathname: "/dept_admin/staff_biodata", params: { staffId: item.id } } as any);
                } else if (item.role === 'DEPT_STUDENT') {
                    if (item.student_id) {
                        router.push({ pathname: "/staff/student_profile", params: { id: item.student_id } } as any);
                    } else {
                        Alert.alert("Error", "Student record not found for this user.");
                    }
                } else {
                    Alert.alert("Notice", "Profile view not available for this role.");
                }
            }}
        >
            <View style={[styles.avatarWrap, { borderColor: themeColors.border }]}>
                {item.profile_pic ? (
                    <Image source={{ uri: `${API_BASE_URL}${item.profile_pic}` }} style={styles.avatarImg} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: '#6366F115' }]}>
                        <Text style={[styles.avatarInt, { color: '#6366F1' }]}>{item.first_name?.[0] || item.username[0]}</Text>
                    </View>
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: themeColors.text }]}>{item.first_name} {item.last_name || item.username}</Text>
                <Text style={[styles.userHandle, { color: themeColors.subText }]}>@{item.username.toLowerCase()}</Text>
                <View style={[styles.roleTag, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <Text style={[styles.roleTxt, { color: themeColors.outline }]}>{item.role.replace('DEPT_', '')}</Text>
                </View>
            </View>
            <TouchableOpacity style={[styles.mailBtn, { backgroundColor: '#6366F115' }]} onPress={() => Alert.alert("Email", `Opening email to ${item.email}`)}>
                <Ionicons name="mail-outline" size={18} color="#6366F1" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

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
                        <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>{name}</Text>
                        <Text style={[styles.headerSub, { color: themeColors.subText }]}>DEPARTMENT DETAILS</Text>
                    </View>
                    <TouchableOpacity onPress={fetchUsers} style={styles.refreshBtn}>
                        <Ionicons name="sync" size={20} color="#6366F1" />
                    </TouchableOpacity>
                </View>

                {/* Info Strip */}
                <View style={[styles.statsStrip, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
                    <View style={styles.statTile}>
                        <Text style={styles.statVal}>{counts.admin || '0'}</Text>
                        <Text style={styles.statLab}>ADMINS</Text>
                    </View>
                    <View style={styles.vDivider} />
                    <View style={styles.statTile}>
                        <Text style={styles.statVal}>{counts.staff || '0'}</Text>
                        <Text style={styles.statLab}>STAFF</Text>
                    </View>
                    <View style={styles.vDivider} />
                    <View style={styles.statTile}>
                        <Text style={styles.statVal}>{counts.students || '0'}</Text>
                        <Text style={styles.statLab}>STUDENTS</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabScroll}>
                    <TouchableOpacity
                        style={[styles.tab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, activeTab === 'admin' && { backgroundColor: '#6366F1', borderColor: '#6366F1' }]}
                        onPress={() => setActiveTab('admin')}
                    >
                        <MaterialCommunityIcons name="shield-crown-outline" size={18} color={activeTab === 'admin' ? '#fff' : themeColors.outline} />
                        <Text style={[styles.tabTxt, { color: themeColors.outline }, activeTab === 'admin' && { color: '#fff' }]}>ADMINS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, activeTab === 'staff' && { backgroundColor: '#6366F1', borderColor: '#6366F1' }]}
                        onPress={() => setActiveTab('staff')}
                    >
                        <Ionicons name="people-outline" size={18} color={activeTab === 'staff' ? '#fff' : themeColors.outline} />
                        <Text style={[styles.tabTxt, { color: themeColors.outline }, activeTab === 'staff' && { color: '#fff' }]}>STAFF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, activeTab === 'students' && { backgroundColor: '#6366F1', borderColor: '#6366F1' }]}
                        onPress={() => setActiveTab('students')}
                    >
                        <Ionicons name="school-outline" size={18} color={activeTab === 'students' ? '#fff' : themeColors.outline} />
                        <Text style={[styles.tabTxt, { color: themeColors.outline }, activeTab === 'students' && { color: '#fff' }]}>STUDENTS</Text>
                    </TouchableOpacity>
                </View>

                {loading && !fetching ? (
                    <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderUser}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchUsers} colors={["#6366F1"]} />}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialCommunityIcons name="account-search-outline" size={80} color={themeColors.border} />
                                <Text style={[styles.emptyTxt, { color: themeColors.subText }]}>No users found in this category.</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitleBox: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSub: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    refreshBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

    statsStrip: { flexDirection: 'row', margin: 20, borderRadius: 28, padding: 24, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    statTile: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 22, fontWeight: '900', color: '#fff' },
    statLab: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: 1 },
    vDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },

    tabScroll: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, gap: 10 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 20, borderWidth: 1, elevation: 2 },
    tabTxt: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    listContent: { paddingHorizontal: 20, paddingBottom: 60 },
    userCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 28, padding: 18, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 15, borderWidth: 1 },
    avatarWrap: { width: 56, height: 56, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    avatarInt: { fontSize: 22, fontWeight: '900' },
    userInfo: { flex: 1, marginLeft: 15 },
    userName: { fontSize: 16, fontWeight: '800' },
    userHandle: { fontSize: 12, marginTop: 2, fontWeight: '600' },
    roleTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, borderWidth: 1 },
    roleTxt: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    mailBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyTxt: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 20, paddingHorizontal: 40 }
});
