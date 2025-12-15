
// app/dept_admin/dashboard.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function DeptAdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // optional simple init
    }, []);

    const handleNav = (path: string) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push(path as any);
        }, 500);
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace("/login");
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#30e4de" />
                <Text style={styles.loaderText}>Loading...</Text>
            </View>
        );
    }

    return (
        <ImageBackground
            source={require("../../assets/images/back.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#00B9BD" onPress={handleLogout} />
                <Text style={styles.headerTitle}>DEPT ADMIN</Text>
                <Ionicons name="notifications-outline" size={24} color="orange" />
            </View>

            {/* Menu */}
            <View style={styles.menu}>
                <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/dept_admin/profile")}>
                    <Text style={styles.menuText}>PROFILE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/dept_admin/requests")}>
                    <Text style={styles.menuText}>MANAGE REQUESTS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/dept_admin/notice")}>
                    <Text style={styles.menuText}>NOTICE BOARD</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/dept_admin/my_department")}>
                    <Text style={styles.menuText}>MY DEPARTMENT</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/dept_admin/bulk_upload")}>
                    <Text style={styles.menuText}>BULK UPLOAD USERS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} onPress={() => handleNav("/admin/django_admin")}>
                    <Text style={styles.menuText}>ADMINISTRATOR</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => handleNav("/dept_admin/dashboard")}>
                    <Ionicons name="home" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleNav("/dept_admin/requests")}>
                    <Ionicons name="list-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleNav("/dept_admin/notice")}>
                    <Ionicons name="desktop-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleNav("/dept_admin/profile")}>
                    <Ionicons name="person-circle-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
    loaderText: { marginTop: 10, color: "#00B9BD", fontWeight: "bold" },
    header: { flexDirection: "row", justifyContent: "space-between", padding: 20, alignItems: "center" },
    headerTitle: { fontSize: 24, fontWeight: "bold", color: "#00B9BD" },
    menu: { flex: 1, justifyContent: "center", alignItems: "center", gap: 15 },
    menuButton: { width: "80%", padding: 15, backgroundColor: "#30e4de", borderRadius: 8, alignItems: "center" },
    menuText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", padding: 15 },
});
