import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

type Letter = { id: number; title: string; content: string; created_at: string };
type Staff = { id: number; username: string; avatar_url?: string };
type Request = { 
    id: number; 
    letter: Letter; 
    staff_status: string; 
    admin_status: string; 
    principal_status: string;
    created_at: string 
};

export default function RequestsScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"letters" | "tracking">("letters");
  const [filterText, setFilterText] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const [lettersRes, requestsRes, staffRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/letters/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/request/student/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/student/class-advisors/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLetters(await lettersRes.json());
      setRequests(await requestsRes.json());
      setStaff(await staffRes.json());
    } catch (err) { }
    finally { setLoading(false); }
  };

  const sendRequest = async (letterId: number, staffId: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/request/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ letter: letterId, staff: staffId }),
      });
      if (res.ok) { Alert.alert("Success", "Request sent successfully!"); loadData(); }
      else { Alert.alert("Error", "Failed to send request"); }
    } catch (err) { }
  };

  const filteredLetters = letters.filter(l => l.title.toLowerCase().includes(filterText.toLowerCase()));

  const getStatusMeta = (status: string) => {
      switch(status?.toLowerCase()) {
          case 'approved': return { icon: 'checkmark-circle', color: '#10B981', label: 'APPROVED' };
          case 'rejected': return { icon: 'close-circle', color: '#EF4444', label: 'REJECTED' };
          default: return { icon: 'time-outline', color: '#F59E0B', label: 'PENDING' };
      }
  };

  const renderProgress = (item: Request) => {
    const s = getStatusMeta(item.staff_status);
    const a = getStatusMeta(item.admin_status);
    const p = getStatusMeta(item.principal_status);
    
    return (
        <View style={[styles.trackCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.trackTitle, { color: themeColors.text }]}>{item.letter.title}</Text>
            <View style={styles.stepsContainer}>
                <View style={styles.step}>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                    <Text style={[styles.stepLabel, { color: s.color }]}>STAFF</Text>
                </View>
                <View style={[styles.stepConnector, { backgroundColor: themeColors.border }]} />
                <View style={styles.step}>
                    <Ionicons name={a.icon as any} size={20} color={a.color} />
                    <Text style={[styles.stepLabel, { color: a.color }]}>ADMIN</Text>
                </View>
                <View style={[styles.stepConnector, { backgroundColor: themeColors.border }]} />
                <View style={styles.step}>
                    <Ionicons name={p.icon as any} size={20} color={p.color} />
                    <Text style={[styles.stepLabel, { color: p.color }]}>EXEC</Text>
                </View>
            </View>
            <Text style={[styles.trackDate, { color: themeColors.subText }]}>Requested on {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Request Hub</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, activeTab === "letters" && { backgroundColor: isDark ? '#3B82F6' : '#111827', borderColor: isDark ? '#3B82F6' : '#111827' }]} onPress={() => setActiveTab("letters")}>
                <Text style={[styles.tabText, { color: themeColors.subText }, activeTab === "letters" && { color: '#ffffff' }]}>Drafts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, activeTab === "tracking" && { backgroundColor: isDark ? '#3B82F6' : '#111827', borderColor: isDark ? '#3B82F6' : '#111827' }]} onPress={() => setActiveTab("tracking")}>
                <Text style={[styles.tabText, { color: themeColors.subText }, activeTab === "tracking" && { color: '#ffffff' }]}>Tracking</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
            <View style={styles.loader}><EduLoading size={60} /></View>
        ) : (
            <FlatList
                data={(activeTab === "letters" ? filteredLetters : requests) as any}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listBody}
                ListHeaderComponent={activeTab === "letters" ? (
                    <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Ionicons name="search" size={20} color={themeColors.subText} />
                        <TextInput style={[styles.searchInput, { color: themeColors.text }]} placeholder="Search documents..." placeholderTextColor={themeColors.subText} value={filterText} onChangeText={setFilterText} />
                    </View>
                ) : null}
                renderItem={({ item }) => activeTab === "letters" ? (
                    <View style={[styles.letterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                         <View style={styles.letterTop}>
                            <MaterialCommunityIcons name="email-outline" size={24} color="#3B82F6" />
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Text style={[styles.letterTitleText, { color: themeColors.text }]}>{(item as any).title}</Text>
                                <Text style={[styles.letterPreview, { color: themeColors.subText }]} numberOfLines={2}>{(item as any).content}</Text>
                            </View>
                         </View>
                         <Text style={[styles.staffTitle, { color: themeColors.subText }]}>Select Staff to Submit:</Text>
                         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffScroll}>
                             {staff.map(s => (
                                 <TouchableOpacity key={s.id} style={styles.staffOrb} onPress={() => sendRequest((item as any).id, s.id)}>
                                     {s.avatar_url ? <Image source={{ uri: s.avatar_url }} style={styles.staffAvatar} /> : <View style={[styles.staffInitial, { backgroundColor: isDark ? '#374151' : '#EFF6FF' }]}><Text style={[styles.initialText, { color: '#3B82F6' }]}>{s.username[0]}</Text></View>}
                                     <Text style={[styles.staffName, { color: themeColors.text }]} numberOfLines={1}>{s.username}</Text>
                                     <View style={styles.sendBadge}><Ionicons name="send" size={10} color="#fff" /></View>
                                 </TouchableOpacity>
                             ))}
                         </ScrollView>
                    </View>
                ) : renderProgress(item as any)}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="mail-unread-outline" size={64} color={themeColors.border} />
                        <Text style={[styles.emptyText, { color: themeColors.subText }]}>No items found in this category.</Text>
                    </View>
                }
            />
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },

  tabBar: { flexDirection: 'row', paddingHorizontal: 24, gap: 15, marginBottom: 20, paddingTop: 10 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '700' },

  listBody: { paddingHorizontal: 24, paddingBottom: 100 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },

  letterCard: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  letterTop: { flexDirection: 'row' },
  letterTitleText: { fontSize: 15, fontWeight: '700' },
  letterPreview: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  staffTitle: { fontSize: 10, fontWeight: '800', marginTop: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  staffScroll: { paddingBottom: 5 },
  staffOrb: { alignItems: 'center', marginRight: 15, width: 60 },
  staffAvatar: { width: 50, height: 50, borderRadius: 25 },
  staffInitial: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  initialText: { fontSize: 18, fontWeight: '800' },
  staffName: { fontSize: 9, fontWeight: '700', marginTop: 8 },
  sendBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#3B82F6', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

  trackCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  trackTitle: { fontSize: 14, fontWeight: '700', marginBottom: 20 },
  stepsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  step: { alignItems: 'center', width: 60 },
  stepLabel: { fontSize: 8, fontWeight: '900', marginTop: 6 },
  stepConnector: { flex: 1, height: 2, marginBottom: 15 },
  trackDate: { fontSize: 10, textAlign: 'right', fontWeight: '500' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 14 }
});
