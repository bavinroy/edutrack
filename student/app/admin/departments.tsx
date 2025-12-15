
import React, { useState, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, Alert, ActivityIndicator, ImageBackground
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

export default function ManageDepartments() {
    const router = useRouter();
    const [departments, setDepartments] = useState([]);
    const [newDeptName, setNewDeptName] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/api/accounts/departments/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFetching(false);
        }
    };

    const handleCreate = async () => {
        if (!newDeptName.trim()) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/api/accounts/departments/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: newDeptName })
            });
            if (res.ok) {
                Alert.alert("Success", "Department created.");
                setNewDeptName("");
                fetchDepartments();
            } else {
                Alert.alert("Error", "Failed to create department.");
            }
        } catch (e) {
            Alert.alert("Error", "Network error.");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <Ionicons name="business" size={24} color="#00B9BD" style={{ marginRight: 10 }} />
            <Text style={styles.itemText}>{item.name}</Text>
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
                <Text style={styles.headerTitle}>Manage Departments</Text>
            </View>

            <View style={styles.container}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="New Department Name"
                        value={newDeptName}
                        onChangeText={setNewDeptName}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleCreate} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Add</Text>}
                    </TouchableOpacity>
                </View>

                {fetching ? (
                    <ActivityIndicator size="large" color="#30e4de" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={departments}
                        keyExtractor={(item: any) => item.id.toString()}
                        renderItem={renderItem}
                        ListEmptyComponent={<Text style={styles.emptyText}>No departments found.</Text>}
                    />
                )}
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    header: {
        flexDirection: "row", alignItems: "center", padding: 20,
        backgroundColor: "rgba(255,255,255,0.9)",
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#00B9BD", marginLeft: 15 },
    container: { padding: 20, flex: 1 },
    inputContainer: { flexDirection: "row", marginBottom: 20 },
    input: {
        flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 8,
        marginRight: 10, borderWidth: 1, borderColor: "#ddd"
    },
    addButton: {
        backgroundColor: "#00B9BD", paddingHorizontal: 20, borderRadius: 8,
        justifyContent: "center", alignItems: "center"
    },
    addButtonText: { color: "#fff", fontWeight: "bold" },
    item: {
        backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 10,
        flexDirection: "row", alignItems: "center",
        elevation: 2
    },
    itemText: { fontSize: 16, fontWeight: "600", color: "#333" },
    emptyText: { textAlign: "center", color: "#666", marginTop: 20 }
});
