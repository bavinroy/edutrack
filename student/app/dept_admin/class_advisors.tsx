import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Modal, TextInput, Alert, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

export default function ClassAdvisorsScreen() {
    const router = useRouter();
    const [advisors, setAdvisors] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [year, setYear] = useState("");
    const [advisor1Id, setAdvisor1Id] = useState("");
    const [advisor2Id, setAdvisor2Id] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");

            // Fetch Advisors
            const advRes = await fetch(`${API_BASE_URL}/api/accounts/class-advisors/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (advRes.ok) setAdvisors(await advRes.json());

            // Fetch Staff
            const staffRes = await fetch(`${API_BASE_URL}/api/accounts/department-staff/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (staffRes.ok) setStaffList(await staffRes.json());

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!year || !advisor1Id) {
            Alert.alert("Error", "Year and Advisor 1 are required");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("accessToken");
            const payload = {
                year: parseInt(year),
                advisor1: parseInt(advisor1Id),
                advisor2: advisor2Id ? parseInt(advisor2Id) : null
            };

            let url = `${API_BASE_URL}/api/accounts/class-advisors/`;
            let method = "POST";
            if (editingId) {
                url += `${editingId}/`;
                method = "PUT";
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setModalVisible(false);
                fetchData(); // reload all
                setYear("");
                setAdvisor1Id("");
                setAdvisor2Id("");
                setEditingId(null);
            } else {
                const err = await res.json();
                let msg = JSON.stringify(err);
                if (err.non_field_errors) msg = err.non_field_errors[0];
                Alert.alert("Error", msg);
            }
        } catch (e) {
            Alert.alert("Error", "Network error");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            await fetch(`${API_BASE_URL}/api/accounts/class-advisors/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { Alert.alert("Error", "Failed to delete"); }
    };

    return (
        <ImageBackground source={require("../../assets/images/back.jpg")} style={styles.background} resizeMode="cover">
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} color="#00B9BD" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Class Advisors</Text>
                <TouchableOpacity onPress={() => {
                    setEditingId(null);
                    setYear("");
                    setAdvisor1Id("");
                    setAdvisor2Id("");
                    setModalVisible(true);
                }}>
                    <Ionicons name="add-circle" size={30} color="#00B9BD" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={advisors}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.ItemTitle}>Year {item.year}</Text>
                            <Text style={styles.itemText}>Advisor 1: {item.advisor1_name}</Text>
                            <Text style={styles.itemText}>Advisor 2: {item.advisor2_name || "None"}</Text>
                        </View>
                        <View style={styles.actionRow}>
                            <TouchableOpacity onPress={() => {
                                setYear(item.year.toString());
                                setAdvisor1Id(item.advisor1 ? item.advisor1.toString() : "");
                                setAdvisor2Id(item.advisor2 ? item.advisor2.toString() : "");
                                setEditingId(item.id);
                                setModalVisible(true);
                            }}>
                                <Ionicons name="pencil" size={20} color="blue" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 15 }}>
                                <Ionicons name="trash" size={20} color="red" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{editingId ? "Edit" : "Assign"} Class Advisors</Text>

                        <Text style={styles.label}>Year</Text>
                        <TextInput
                            placeholder="e.g. 1"
                            value={year}
                            onChangeText={setYear}
                            keyboardType="numeric"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Advisor 1 (ID)</Text>
                        <TextInput
                            placeholder="Staff ID"
                            value={advisor1Id}
                            onChangeText={setAdvisor1Id}
                            keyboardType="numeric"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Advisor 2 (Optional ID)</Text>
                        <TextInput
                            placeholder="Staff ID"
                            value={advisor2Id}
                            onChangeText={setAdvisor2Id}
                            keyboardType="numeric"
                            style={styles.input}
                        />

                        <Text style={styles.sectionHeader}>Available Staff (Tap to copy ID)</Text>
                        <ScrollView style={{ maxHeight: 150, marginBottom: 15, width: '100%', borderColor: '#ddd', borderWidth: 1, borderRadius: 5 }}>
                            {staffList.map(s => (
                                <TouchableOpacity key={s.id} onPress={() => {
                                    if (!advisor1Id) setAdvisor1Id(s.id.toString());
                                    else if (!advisor2Id && advisor1Id !== s.id.toString()) setAdvisor2Id(s.id.toString());
                                }} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                                    <Text>{s.id}: {s.username}</Text>
                                </TouchableOpacity>
                            ))}
                            {staffList.length === 0 && <Text style={{ padding: 10, color: '#999' }}>No staff found</Text>}
                        </ScrollView>

                        <View style={styles.row}>
                            <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 20, color: "#00B9BD", fontWeight: "bold" },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginVertical: 8, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ItemTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    itemText: { color: '#555' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalView: { backgroundColor: 'white', padding: 20, borderRadius: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    input: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ddd', marginBottom: 10 },
    label: { fontWeight: 'bold', marginBottom: 5, marginTop: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
    saveBtn: { backgroundColor: '#00B9BD', padding: 10, borderRadius: 5, width: '40%', alignItems: 'center' },
    cancelBtn: { backgroundColor: '#FF6347', padding: 10, borderRadius: 5, width: '40%', alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold' },
    sectionHeader: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
    actionRow: { flexDirection: 'row', alignItems: 'center' }
});
