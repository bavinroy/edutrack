import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

type Letter = { id: number; title: string; content: string; created_at: string };
type Staff = { id: number; username: string; avatar_url?: string };
type Request = { id: number; letter: Letter; staff_status: string; admin_status: string; created_at: string };

export default function RequestsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"letters" | "requests">("letters");
  const [filterText, setFilterText] = useState("");
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;
      const [lettersRes, requestsRes, staffRes] = await Promise.all([
        fetch("http://10.193.11.125:8000/api/letters/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://10.193.11.125:8000/api/request/student/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://10.193.11.125:8000/api/staff/list/", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLetters(await lettersRes.json());
      setRequests(await requestsRes.json());
      setStaff(await staffRes.json());
    } catch (err) { console.error(err); Alert.alert("Error", "Failed to load data"); }
    finally { setLoading(false); }
  };

  const sendRequest = async (letterId: number, staffId: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;
      const res = await fetch("http://10.193.11.125:8000/api/request/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ letter: letterId, staff: staffId }),
      });
      if (res.ok) { Alert.alert("✅ Success", "Request sent successfully!"); loadData(); } 
      else { Alert.alert("❌ Error", "Failed to send request"); }
    } catch (err) { console.error(err); Alert.alert("Error", "Something went wrong"); }
  };

  const handleNav = (path: string) => { router.push(path as any); };

  const filteredLetters = letters.filter(l =>
    l.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredStaff = selectedStaffId ? staff.filter(s => s.id === selectedStaffId) : staff;

  const renderStaffForLetter = (letterId: number) => (
    <FlatList
      horizontal
      data={filteredStaff}
      keyExtractor={(item) => item.id.toString()}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.staffCard}>
          {item.avatar_url ? <Image source={{ uri: item.avatar_url }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: "#ccc" }]} />}
          <Text style={styles.name}>{item.username}</Text>
          <TouchableOpacity style={styles.staffButton} onPress={() => sendRequest(letterId, item.id)}>
            <Text style={styles.staffButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  const renderLetter = ({ item }: { item: Letter }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content}>{item.content}</Text>
      <Text style={styles.subHeading}>Select Staff:</Text>
      {renderStaffForLetter(item.id)}
    </View>
  );

  const renderRequest = ({ item }: { item: Request }) => {
    const staffStatus = item.staff_status ?? "pending";
    const adminStatus = item.admin_status ?? "pending";
    const getProgress = () => staffStatus === "approved" && adminStatus === "approved" ? 1 : staffStatus === "approved" || adminStatus === "approved" ? 0.5 : 0;
    const statusColor = (status: string) => status === "approved" ? "green" : status === "rejected" ? "red" : "#ffa500";
    const progress = getProgress();
    return (
      <View style={styles.requestCard}>
        <Text style={styles.title}>📄 {item.letter.title}</Text>
        <View style={styles.statusRow}><Text>Staff:</Text><Text style={{ color: statusColor(staffStatus), fontWeight: "bold" }}>{staffStatus === "approved" ? "✅ Approved" : staffStatus === "rejected" ? "❌ Rejected" : "⏳ Pending"}</Text></View>
        <View style={styles.statusRow}><Text>Admin:</Text><Text style={{ color: statusColor(adminStatus), fontWeight: "bold" }}>{adminStatus === "approved" ? "✅ Approved" : adminStatus === "rejected" ? "❌ Rejected" : "⏳ Pending"}</Text></View>
        <View style={styles.progressBarBackground}><View style={[styles.progressBarFill, { flex: progress }]} /><View style={{ flex: 1 - progress }} /></View>
        <Text style={styles.progressText}>{progress === 1 ? "Fully Approved" : progress === 0.5 ? "Partially Approved" : "Pending"}</Text>
      </View>
    );
  };

  if (loading) return (<View style={styles.center}><ActivityIndicator size="large" color="#30e4de" /></View>);

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Header Dropdown */}
      <TouchableOpacity style={styles.header} onPress={() => setShowHeaderMenu(!showHeaderMenu)}>
        <Ionicons name="arrow-back" size={22} color="#30e4de" />
        <Text style={styles.headerTitle}>Requests</Text>
        <Ionicons name={showHeaderMenu ? "chevron-up" : "chevron-down"} size={22} color="#30e4de" />
      </TouchableOpacity>

      {showHeaderMenu && (
        <View style={styles.menuBox}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => handleNav("/student/downloads")}><Ionicons name="download-outline" size={18} color="#fff" /><Text style={styles.menuText}>Downloads</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => handleNav("/student/letter")}><Ionicons name="document-text-outline" size={18} color="#fff" /><Text style={styles.menuText}>Forms</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => handleNav("/student/time table")}><Ionicons name="calendar-outline" size={18} color="#fff" /><Text style={styles.menuText}>Time Table</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => handleNav("/student/results")}><Ionicons name="ribbon-outline" size={18} color="#fff" /><Text style={styles.menuText}>Results</Text></TouchableOpacity>

          {/* Nested Staff Dropdown */}
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: "#007BFF" }]} onPress={() => setShowStaffDropdown(!showStaffDropdown)}>
            <Ionicons name="people-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>{selectedStaffId ? staff.find(s => s.id === selectedStaffId)?.username : "Filter by Staff"}</Text>
          </TouchableOpacity>
          {showStaffDropdown && staff.map(s => (
            <TouchableOpacity key={s.id} style={[styles.menuBtn, { backgroundColor: "#30e4de" }]} onPress={() => { setSelectedStaffId(s.id); setShowStaffDropdown(false); }}>
              <Text style={styles.menuText}>{s.username}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: "#30e4de" }]} onPress={() => { setSelectedStaffId(null); setShowStaffDropdown(false); }}>
            <Text style={styles.menuText}>All Staff</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🔹 Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabButton, activeTab === "letters" && styles.activeTab]} onPress={() => setActiveTab("letters")}><Text style={[styles.tabText, activeTab === "letters" && styles.activeTabText]}>Letters</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === "requests" && styles.activeTab]} onPress={() => setActiveTab("requests")}><Text style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>Requests & Tracking</Text></TouchableOpacity>
      </View>

      {/* 🔹 Search */}
      {activeTab === "letters" && (
        <TextInput style={styles.searchInput} placeholder="Filter letters by title..." value={filterText} onChangeText={setFilterText} />
      )}

      {/* 🔹 Content */}
      {activeTab === "letters" ? (
        filteredLetters.length === 0 ? <Text style={styles.empty}>No letters found</Text> : <FlatList data={filteredLetters} keyExtractor={(item) => `letter-${item.id}`} renderItem={renderLetter} contentContainerStyle={{ paddingBottom: 120 }} />
      ) : requests.length === 0 ? <Text style={styles.empty}>No requests yet</Text> : <FlatList data={requests} keyExtractor={(item) => `request-${item.id}`} renderItem={renderRequest} contentContainerStyle={{ paddingBottom: 120 }} />
      }

      {/* 🔹 Fixed Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons name="home" size={24} color={pathname === "/student/dashboard" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/student/dashboard")} />
        <Ionicons name="search" size={24} color={pathname === "/student/search" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/student/search")} />
        <Ionicons name="desktop-outline" size={24} color={pathname === "/student/notice" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/student/notice")} />
        <Ionicons name="download-outline" size={24} color={pathname === "/student/downloads" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/student/downloads")} />
        <Ionicons name="person-circle-outline" size={24} color={pathname === "/student/profile" ? "#0e0e0dff" : "#fff"} onPress={() => handleNav("/student/profile")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de" },
  menuBox: { backgroundColor: "#eff4f4ff", borderRadius: 12, paddingVertical: 10, marginBottom: 10, alignItems: "center", elevation: 5 },
  menuBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 20, width: "80%", borderRadius: 8, marginVertical: 4, justifyContent: "center", backgroundColor: "#30e4de" },
  menuText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  tabs: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#eee" },
  activeTab: { backgroundColor: "#30e4de" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#555" },
  activeTabText: { color: "#fff" },
  searchInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, margin: 10, backgroundColor: "#fff" },
  card: { backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ddd", elevation: 2 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  content: { fontSize: 14, color: "#555", marginBottom: 8 },
  subHeading: { fontSize: 14, fontWeight: "500", marginTop: 8 },
  staffCard: { alignItems: "center", marginRight: 12, padding: 8, backgroundColor: "#eef", borderRadius: 8, width: 120 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginBottom: 6 },
  name: { fontSize: 14, fontWeight: "bold", marginBottom: 4, textAlign: "center" },
  staffButton: { backgroundColor: "#007BFF", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  staffButtonText: { color: "#fff", fontSize: 12 },
  requestCard: { backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ddd", elevation: 2 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  progressBarBackground: { height: 8, flexDirection: "row", backgroundColor: "#eee", borderRadius: 4, marginTop: 8 },
  progressBarFill: { backgroundColor: "#30e4de", borderRadius: 4 },
  progressText: { marginTop: 4, fontSize: 12, color: "#555", fontWeight: "600" },
  empty: { textAlign: "center", marginVertical: 20, color: "#666" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12, position: "absolute", bottom: 0, width: "100%" },
});
