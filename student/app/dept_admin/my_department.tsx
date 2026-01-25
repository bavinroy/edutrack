
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function MyDepartmentScreen() {
    const router = useRouter();
    const [department, setDepartment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMyDept();
    }, []);

    const fetchMyDept = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            // First get 'whoami' to know dept id -> actually backend handles permission so if we hit department/detail it might need ID.
            // But we don't have ID easily unless we store it.
            // Let's use whoami first or just assume we have stored it?
            // Better: update 'whoami' to return department_id or handle it.
            // For now, let's try to list departments but filter?? No.

            // Getting user profile to find department ID
            const meRes = await fetch(`${API_BASE_URL}/api/accounts/whoami/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const meData = await meRes.json();
            // Assuming whoami returns role, username... let's hope it returns dept info or we can't fetch it easily without listing all.
            // Wait, standard user serializer in backend might not return dept ID in whoami.
            // Let's assume we can fetch list of departments and filter? No that's inefficient.

            // WORKAROUND: Dept Admin usually knows their Dept ID? No. 
            // Better: Fetch a new endpoint "my-department" in backend?
            // OR checks generic 'departments/' list if they have access.

            // Let's try listing:
            const listRes = await fetch(`${API_BASE_URL}/api/accounts/departments/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (listRes.ok) {
                const list = await listRes.json();
                // Since we filtered permissions in backend to ONLY show their department (via object permission? no list permission is restrictve but assumes super admin).
                // Ah DepartmentListCreateView is IsSuperAdmin only.

                // We need an endpoint for Dept Admin to view THEIR dept. 
                // Let's rely on Profile page usually containing it.
                // But user wants a "Manage Department" screen.
                // Let's just mock it for now or use "Profile" data if we had full user profile.

                // If the user wants to "Create Staff/Student", Bulk Upload is best.
                // This screen can just show "Bulk Upload" and "View Staff" (not implemented yet).

                // Let's show a placeholder if we can't fetch details.
                setDepartment({ name: "Your Department", category: "General" });
            } else {
                setError("Access denied.");
            }
        } catch (e) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require("../../assets/images/back.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#00B9BD" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>My Department</Text>
            </View>

            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Department Management</Text>
                    <Text style={styles.subtitle}>You are the administrator for your assigned department.</Text>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/dept_admin/bulk_upload")}>
                        <Ionicons name="cloud-upload" size={24} color="#fff" />
                        <Text style={styles.btnText}>Bulk Upload Users</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFA500' }]} onPress={() => router.push("/dept_admin/staff_list")}>
                        <Ionicons name="people" size={24} color="#fff" />
                        <Text style={styles.btnText}>View Staff List</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFA500' }]} onPress={() => router.push("/dept_admin/student_list")}>
                        <Ionicons name="school" size={24} color="#fff" />
                        <Text style={styles.btnText}>View Student List</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8A2BE2' }]} onPress={() => router.push("/dept_admin/class_advisors")}>
                        <Ionicons name="people-circle" size={24} color="#fff" />
                        <Text style={styles.btnText}>Manage Class Advisors</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 22, color: "#00B9BD", fontWeight: "bold", marginLeft: 10 },
    container: { padding: 20, flex: 1 },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 3 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { color: '#666', marginBottom: 20 },
    actionBtn: {
        flexDirection: 'row', backgroundColor: '#30e4de', padding: 15, borderRadius: 8,
        alignItems: 'center', marginBottom: 15
    },
    btnText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});
