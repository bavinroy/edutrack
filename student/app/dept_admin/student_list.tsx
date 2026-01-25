
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function StudentListScreen() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const response = await fetch(`${API_BASE_URL}/api/accounts/department-student/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setStudents(data);
            } else {
                setError("Failed to fetch student list.");
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
                <Ionicons name="school" size={24} color="#FFA500" />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.rollNo}>ID: {item.username}</Text>
                {/* Assuming user serializer might not have full 'student_account' nested unless we updated it. 
                    If not, basic user details are fine. */}
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
                <Text style={styles.headerTitle}>Department Students</Text>
            </View>

            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color="#00B9BD" />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <FlatList
                        data={students}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No students found.</Text>}
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
        backgroundColor: '#fff3e0',
        padding: 10,
        borderRadius: 25,
        marginRight: 15
    },
    infoContainer: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 14, color: '#666', marginTop: 2 },
    rollNo: { fontSize: 12, color: '#FFA500', marginTop: 5, fontWeight: 'bold' },
    errorText: { color: 'red', textAlign: 'center', marginTop: 20, fontSize: 16 },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 16 }
});
