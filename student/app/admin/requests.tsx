// app/admin/requests.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ImageBackground,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { API_BASE_URL } from "../config";

type Letter = { id: number; title: string; content: string; created_at: string };
type Request = {
  id: number;
  letter: Letter;
  student_name: string;
  staff_status: string;
  admin_status: string;
  admin_comment?: string;
  principal_status: string;
  principal_comment?: string;
  created_at: string;
};

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [declineComment, setDeclineComment] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/request/principal/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRequests(data);
        } else {
          setRequests([]);
        }
      } else {
        console.log("Failed to fetch principal requests");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    requestId: number,
    action: "approved" | "rejected",
    comment?: string
  ) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(
        `${API_BASE_URL}/api/request/principal/${requestId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            principal_status: action,
            principal_comment: comment,
          }),
        }
      );

      if (res.ok) {
        Alert.alert("Success", `Request ${action}`);
        loadRequests();
      } else {
        const errorText = await res.text();
        console.error(errorText);
        Alert.alert("Error", "Failed to update request");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setModalVisible(false);
      setDeclineComment("");
    }
  };

  const renderRequest = ({ item }: { item: Request }) => {
    if (!item) return null;
    const pending = (item.principal_status || "pending") === "pending";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          pending && {
            borderColor: "#30e4de",
            borderWidth: 2,
            backgroundColor: "rgba(48,228,222,0.1)",
          },
        ]}
        onPress={() => {
          setCurrentRequest(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.title}>📄 {item.letter?.title || "No Title"}</Text>
        <Text style={styles.meta}>
          Student: {item.student_name || "Unknown"}
        </Text>
        <Text style={styles.meta}>
          Staff: {item.staff_status} • Admin: {item.admin_status}
        </Text>
        <Text style={[styles.meta, { fontWeight: 'bold', color: pending ? 'orange' : '#333' }]}>
          Principal: {(item.principal_status || "Pending").toUpperCase()}
        </Text>
        {item.principal_comment && (
          <Text style={styles.comment}>My Comment: {item.principal_comment}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#30e4de" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/back.jpg")}
      style={{ flex: 1 }}
    >
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRequest}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
      />

      {/* Scrollable Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 8 }}>
                {currentRequest?.letter?.title}
              </Text>
              <Text style={{ marginBottom: 10 }}>
                {currentRequest?.letter?.content}
              </Text>
              <Text style={{ marginBottom: 5 }}>
                Student: {currentRequest?.student_name}
              </Text>
              <Text style={{ color: '#555' }}>Staff Status: {currentRequest?.staff_status}</Text>
              <Text style={{ color: '#555' }}>Admin Status: {currentRequest?.admin_status}</Text>
              {currentRequest?.admin_comment && <Text style={{ fontStyle: 'italic', marginBottom: 5 }}>Admin Note: {currentRequest.admin_comment}</Text>}
              <Text style={{ fontWeight: 'bold', marginVertical: 5 }}>Principal Status: {currentRequest?.principal_status}</Text>

              <TextInput
                style={styles.input}
                placeholder="Principal's comment (for rejection/approval)"
                multiline
                value={declineComment}
                onChangeText={setDeclineComment}
              />

              <View style={{ flexDirection: "row", marginTop: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { flex: 1, backgroundColor: "green", marginRight: 5 },
                  ]}
                  onPress={() =>
                    currentRequest && handleAction(currentRequest.id, "approved")
                  }
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    { flex: 1, backgroundColor: "red", marginLeft: 5 },
                  ]}
                  onPress={() =>
                    currentRequest &&
                    handleAction(currentRequest.id, "rejected", declineComment)
                  }
                >
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#ccc", marginTop: 10 }]}
                onPress={() => {
                  setModalVisible(false);
                  setDeclineComment("");
                }}
              >
                <Text style={[styles.buttonText, { color: "#000" }]}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons
          name="home"
          size={24}
          color={pathname === "/admin/dashboard" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/admin/dashboard")}
        />
        <Ionicons
          name="desktop-outline"
          size={24}
          color={pathname === "/admin/notice" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/admin/notice")}
        />
        <Ionicons
          name="person-circle-outline"
          size={24}
          color={pathname === "/admin/profile" ? "#0e0e0dff" : "#fff"}
          onPress={() => router.push("/admin/profile")}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 12, color: "#666", marginBottom: 6 },
  comment: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#333",
    marginBottom: 6,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 8,
    borderRadius: 6,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#30e4de",
    paddingVertical: 12,
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
  },
});
