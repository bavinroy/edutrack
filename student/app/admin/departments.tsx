import React, { useState, useCallback } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, Alert, ActivityIndicator, StatusBar,
    Dimensions, RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function ManageDepartments() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    
    const [departments, setDepartments] = useState([]);
    const [newDeptName, setNewDeptName] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchDepartments = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return router.replace("/login");

            const res = await axios.get(`${API_BASE_URL}/api/accounts/departments/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setFetching(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDepartments();
        }, [])
    );

    const handleCreate = async () => {
        if (!newDeptName.trim()) return Alert.alert("Required", "Please enter a department name.");
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            await axios.post(`${API_BASE_URL}/api/accounts/departments/`,
                { name: newDeptName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert("Success", "Department has been added.");
            setNewDeptName("");
            fetchDepartments();
        } catch (e) {
            Alert.alert("Error", "Could not add department. It might already exist.");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push({
                pathname: "/admin/dept_details",
                params: { id: item.id, name: item.name }
            })}
        >
            <View style={styles.cardHdr}>
                <View style={[styles.iconHole, { backgroundColor: '#6366F115' }]}>
                    <FontAwesome5 name="building" size={22} color="#6366F1" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[styles.deptName, { color: themeColors.text }]}>{item.name}</Text>
                    <Text style={[styles.deptSub, { color: themeColors.subText }]}>Department</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={themeColors.outline} />
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 18, marginTop: 4 }}>
            <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                <View style={[styles.statPill, { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#6366F1" />
                    <Text style={[styles.statTxt, { color: themeColors.subText }]}>Active</Text>
                </View>
                <View style={styles.actionPrompt}>
                    <Text style={styles.promptTxt}>View Details</Text>
                    <Ionicons name="arrow-forward" size={12} color="#6366F1" />
                </View>
            </View>
            </View>
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
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Departments</Text>
                        <Text style={[styles.headerSub, { color: themeColors.subText }]}>MANAGE CAMPUS UNITS</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setFetching(true); fetchDepartments(); }} style={styles.refreshBtn}>
                        <Ionicons name="sync" size={20} color="#6366F1" />
                    </TouchableOpacity>
                </View>

                {/* Add New Panel */}
                <View style={[styles.provisionPanel, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <Text style={[styles.panelLab, { color: themeColors.subText }]}>ADD NEW DEPARTMENT</Text>
                    <View style={styles.inputStack}>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                            placeholder="Department Name"
                            value={newDeptName}
                            onChangeText={setNewDeptName}
                            placeholderTextColor={themeColors.outline}
                        />
                        <TouchableOpacity
                            style={[styles.dispatchBtn, loading && { opacity: 0.7 }]}
                            onPress={handleCreate}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" size="small" /> :
                                <Ionicons name="add" size={32} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.listShell}>
                    <View style={styles.listHdr}>
                        <Text style={[styles.listLab, { color: themeColors.subText }]}>Current Departments</Text>
                        <View style={[styles.countPill, { backgroundColor: '#6366F1' }]}>
                            <Text style={styles.countVal}>{departments.length}</Text>
                        </View>
                    </View>

                    {fetching ? (
                        <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
                    ) : (
                        <FlatList
                            data={departments}
                            keyExtractor={(item: any) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listScroll}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={fetching} onRefresh={() => { setFetching(true); fetchDepartments(); }} colors={["#6366F1"]} />}
                            ListEmptyComponent={
                                <View style={styles.empty}>
                                    <MaterialCommunityIcons name="office-building" size={80} color={themeColors.border} />
                                    <Text style={[styles.emptyTxt, { color: themeColors.subText }]}>No departments found yet. Add one above.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
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

    provisionPanel: { padding: 24, margin: 20, borderRadius: 32, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1 },
    panelLab: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginLeft: 4 },
    inputStack: { flexDirection: 'row', gap: 12 },
    input: { flex: 1, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, fontWeight: '700', borderWidth: 1 },
    dispatchBtn: { backgroundColor: '#6366F1', width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },

    listShell: { flex: 1, paddingHorizontal: 20 },
    listHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
    listLab: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    countPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    countVal: { fontSize: 12, fontWeight: '900', color: '#fff' },

    listScroll: { paddingBottom: 100 },
    card: { borderRadius: 28, padding: 22, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1 },
    cardHdr: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    iconHole: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 15 },
    deptName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    deptSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 18 },
    statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    actionPrompt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    promptTxt: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 0.5 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 25, paddingHorizontal: 50, lineHeight: 22 }
});
