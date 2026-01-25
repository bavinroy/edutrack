
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function StaffListScreen() {
    const router = useRouter();
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const response = await fetch(`${API_BASE_URL}/api/accounts/department-staff/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setStaff(data);
            } else {
                setError("Failed to fetch staff list.");
            }
        } catch (e) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons name="person" size={24} color="#00B9BD" />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.role}>{item.role.replace("DEPT_", "").replace("_", " ")}</Text>
            </View>
        </View>
    );

    return (
        <ImageBackground
            source={require("../../assets/images/back.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#00B9BD" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Department Staff</Text>
            </View>

            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color="#00B9BD" />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <FlatList
                        data={staff}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No staff found.</Text>}
                    />
                )}
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)' },
    headerTitle: { fontSize: 22, color: "#00B9BD", fontWeight: "bold", marginLeft: 10 },
    container: { flex: 1, padding: 10 },
    list: { paddingBottom: 20 },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3
    },
    iconContainer: {
        backgroundColor: '#e0f7fa',
        padding: 10,
        borderRadius: 25,
        marginRight: 15
    },
    infoContainer: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 14, color: '#666', marginTop: 2 },
    role: { fontSize: 12, color: '#00B9BD', marginTop: 5, fontWeight: 'bold' },
    errorText: { color: 'red', textAlign: 'center', marginTop: 20, fontSize: 16 },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 16 }
});
