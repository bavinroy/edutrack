import React, { useState, useEffect, useCallback } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity, 
    Image, 
    StatusBar, 
    Dimensions,
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

const { width } = Dimensions.get("window");

export default function StaffListScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStaff = async (isRef = false) => {
        if (!isRef) setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE_URL}/api/accounts/department-staff/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(res.data);
        } catch (e) {
            console.error("Staff fetch error", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStaff(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStaff(true);
    };

    const renderStaff = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: "/dept_admin/staff_biodata", params: { staffId: item.id } } as any)}
        >
            <View style={styles.avatarBox}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                    <View style={[styles.placeholderAvatar, { backgroundColor: '#6366F120' }]}>
                        <Text style={[styles.avatarTxt, { color: '#6366F1' }]}>{item.first_name?.[0] || item.username?.[0]}</Text>
                    </View>
                )}
                <View style={[styles.statusIndicator, { backgroundColor: '#10B981', borderColor: themeColors.card }]} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: themeColors.text }]}>{item.first_name} {item.last_name}</Text>
                <Text style={[styles.handle, { color: themeColors.subText }]}>{item.designation || 'Faculty Member'}</Text>
                <View style={[styles.roleTag, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                    <Text style={[styles.roleTxt, { color: themeColors.subText }]}>
                        {item.role.replace("DEPT_", "").replace("_", " ").toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={[styles.actionBtn, { backgroundColor: '#6366F115' }]}>
                <Ionicons name="chevron-forward" size={18} color="#6366F1" />
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
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Staff Registry</Text>
                    <Text style={[styles.headerSub, { color: themeColors.subText }]}>Departmental Faculty</Text>
                </View>
                <TouchableOpacity onPress={() => onRefresh()}>
                    <Ionicons name="search-outline" size={24} color={themeColors.text} />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
            ) : (
                <FlatList
                    data={staff}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderStaff}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]} />}
                    ListHeaderComponent={
                        <View style={styles.summaryBar}>
                            <View style={[styles.summaryPill, { backgroundColor: '#6366F115' }]}>
                                <Text style={[styles.summaryTxt, { color: '#6366F1' }]}>
                                    ACTIVE FACULTY: <Text style={{ fontWeight: '900' }}>{staff.length}</Text>
                                </Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="account-search-outline" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>No registered staff found in your department.</Text>
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

    listContent: { padding: 20, paddingBottom: 100 },
    summaryBar: { marginBottom: 25, alignItems: 'flex-start' },
    summaryPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    summaryTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 18, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1 },
    avatarBox: { position: 'relative' },
    avatar: { width: 64, height: 64, borderRadius: 20 },
    placeholderAvatar: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 24, fontWeight: '900' },
    statusIndicator: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, borderWidth: 3 },

    info: { flex: 1, marginLeft: 18 },
    name: { fontSize: 17, fontWeight: '800' },
    handle: { fontSize: 13, marginTop: 2 },
    roleTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
    roleTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

    actionBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 20, paddingHorizontal: 40, lineHeight: 22 }
});
