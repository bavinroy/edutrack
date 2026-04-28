import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { theme } from "../theme";
import StaffBottomNav from "../../components/StaffBottomNav";
import EduLoading from "../../components/EduLoading";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyStudentsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { department, year, section, className } = params;

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return;

            let url = `${API_BASE_URL}/api/academic/students/`;
            const paramsList = [];
            if (department && department !== 'undefined') paramsList.push(`department=${department}`);
            if (year && year !== 'undefined') paramsList.push(`year=${year}`);
            if (section && section !== 'undefined') paramsList.push(`section=${section}`);
            
            if (paramsList.length > 0) {
                url += `?${paramsList.join('&')}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setStudents(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{item.user?.username?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.user?.first_name} {item.user?.last_name}</Text>
                <Text style={styles.subtext}>{item.user?.username} (Roll No)</Text>
                <Text style={styles.subtext}>Status: {item.crt_status}</Text>
            </View>
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: "/staff/student_profile" as any,
                    params: { id: item.id }
                })}
            >
                <Ionicons name="chevron-forward" size={24} color="#BDBDBD" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{className || "Department Students"}</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <EduLoading size={60} />
                </View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={{ color: "#999" }}>No students found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: theme.colors.onSurface },
    center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
    list: { padding: 20, paddingBottom: 100 },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primaryContainer + '30',
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: "700", color: theme.colors.onSurface },
    subtext: { fontSize: 12, color: theme.colors.outline, marginTop: 4, fontWeight: '500' },
});
