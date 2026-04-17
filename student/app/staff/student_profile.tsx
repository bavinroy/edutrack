import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function StudentProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchStudentDetails();
    }, [id]);

    const fetchStudentDetails = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/api/academic/students/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setStudent(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2962FF" />
            </View>
        );
    }

    if (!student) {
        return (
            <View style={styles.center}>
                <Text>Student not found</Text>
            </View>
        );
    }

    const { user, department_name } = student;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Student Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user?.username?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.name}>
                        {user?.first_name} {user?.last_name}
                    </Text>
                    <Text style={styles.rollNo}>{student.roll_no}</Text>
                    <Text style={styles.dept}>{department_name || "Department N/A"}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {student.year} Year - Sec {student.section || "N/A"}
                        </Text>
                    </View>
                </View>

                {/* Info Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Personal Details</Text>
                    <InfoRow label="Email" value={user?.email} icon="email" />
                    <InfoRow label="Phone" value={student.mobile_number} icon="phone" />
                    <InfoRow label="DOB" value={student.dob} icon="calendar" />
                    <InfoRow label="Gender" value={student.gender} icon="account" />
                    <InfoRow label="Blood Group" value={student.blood_group} icon="water" />
                    <InfoRow label="Address" value={student.address} icon="map-marker" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Academic Details</Text>
                    <InfoRow label="Register No" value={student.register_number} icon="card-account-details" />
                    <InfoRow label="Course" value={student.course} icon="school" />
                    <InfoRow label="Batch" value={student.batch} icon="calendar-clock" />
                    <InfoRow label="CRT Status" value={student.crt_status} icon="briefcase" />
                    <InfoRow label="CGPA" value={student.current_cgpa?.toString()} icon="chart-line" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Parent / Guardian</Text>
                    <InfoRow label="Father Name" value={student.father_name} icon="human-male" />
                    <InfoRow label="Mother Name" value={student.mother_name} icon="human-female" />
                    <InfoRow label="Parent Contact" value={student.parent_contact} icon="phone" />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: any }) => (
    <View style={styles.row}>
        <View style={styles.iconBox}>
            <MaterialCommunityIcons name={icon} size={20} color="#5C6BC0" />
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || "-"}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F7FA" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        backgroundColor: "#2962FF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    backBtn: { padding: 5 },
    scrollContent: { paddingBottom: 30 },

    profileCard: {
        backgroundColor: "#fff",
        alignItems: "center",
        paddingVertical: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 4,
        marginBottom: 20,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#E3F2FD",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
        borderWidth: 2,
        borderColor: "#2962FF",
    },
    avatarText: { fontSize: 32, fontWeight: "bold", color: "#1565C0" },
    name: { fontSize: 22, fontWeight: "bold", color: "#1A1A1A" },
    rollNo: { fontSize: 14, color: "#666", marginTop: 4 },
    dept: { fontSize: 16, color: "#333", marginTop: 8, fontWeight: '500' },
    badge: {
        backgroundColor: "#E8EAF6",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
    },
    badgeText: { color: "#3F51B5", fontWeight: "bold", fontSize: 12 },

    section: {
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 12,
        padding: 15,
        elevation: 2,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1A1A1A",
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 8,
    },
    row: { flexDirection: "row", marginBottom: 15, alignItems: "center" },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#E8EAF6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    rowContent: { flex: 1 },
    label: { fontSize: 12, color: "#888", marginBottom: 2 },
    value: { fontSize: 15, color: "#333", fontWeight: "500" },
});
