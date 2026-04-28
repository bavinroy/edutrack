import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  ScrollView,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import StaffBottomNav from "../../components/StaffBottomNav";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

type Letter = { id: number; title: string; content: string; created_at: string };
type Request = {
  id: number;
  letter: Letter;
  student_name: string;
  staff_status: string;
  admin_status: string;
  staff_comment?: string;
  created_at: string;
};

export default function StaffRequestsScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [declineComment, setDeclineComment] = useState("");

  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/request/staff/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      const sorted = Array.isArray(data) ? data.sort((a: Request, b: Request) => {
        if (a.staff_status === 'pending' && b.staff_status !== 'pending') return -1;
        if (a.staff_status !== 'pending' && b.staff_status === 'pending') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }) : [];
      setRequests(sorted);
    } catch (err) {
      Alert.alert("Error", "Failed to load requests");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleAction = async (requestId: number, action: "approved" | "rejected", comment?: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/request/staff/${requestId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staff_status: action, staff_comment: comment }),
      });

      if (res.ok) {
        Alert.alert("Success", `Application ${action === 'approved' ? 'Forwarded' : 'Rejected'}`);
        loadRequests();
      } else {
        Alert.alert("Error", "Failed to process request");
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    } finally {
      setModalVisible(false);
      setDeclineComment("");
    }
  };

  const renderRequestItem = ({ item }: { item: Request }) => {
    const isPending = item.staff_status === "pending";
    const statusMeta = {
      pending: { color: "#F59E0B", icon: "hourglass", label: "PENDING" },
      approved: { color: "#10B981", icon: "check-double", label: "FORWARDED" },
      rejected: { color: "#EF4444", icon: "times-circle", label: "REJECTED" },
    }[item.staff_status as 'pending' | 'approved' | 'rejected'] || { color: "#6366F1", icon: "question-circle", label: "UNKNOWN" };

    return (
      <TouchableOpacity
        style={[styles.reqCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        onPress={() => { setCurrentRequest(item); setModalVisible(true); }}
        activeOpacity={0.8}
      >
        <View style={[styles.statusLine, { backgroundColor: statusMeta.color }]} />
        <View style={styles.reqMain}>
          <View style={styles.reqTop}>
             <View style={styles.reqHeaderLeft}>
                <Text style={[styles.reqSubject, { color: themeColors.text }]}>{item.letter.title}</Text>
                <Text style={[styles.reqSender, { color: themeColors.subText }]}>{item.student_name}</Text>
             </View>
             <View style={[styles.miniBadge, { backgroundColor: `${statusMeta.color}15` }]}>
                <Text style={[styles.miniBadgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
             </View>
          </View>
          
          <Text style={[styles.reqSnippet, { color: themeColors.subText }]} numberOfLines={2}>
            {item.letter.content}
          </Text>

          <View style={styles.reqFooter}>
             <View style={styles.footerInfo}>
                <Ionicons name="calendar-outline" size={12} color={themeColors.subText} />
                <Text style={styles.footerText}>{new Date(item.created_at).toLocaleDateString()}</Text>
             </View>
             {isPending && (
               <View style={styles.actionPrompt}>
                  <Text style={styles.promptText}>Review Required</Text>
                  <Ionicons name="arrow-forward" size={12} color="#6366F1" />
               </View>
             )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Student Applications</Text>
        <TouchableOpacity style={styles.refreshIcon} onPress={loadRequests}>
          <Ionicons name="refresh" size={22} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><EduLoading size={60} /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listBody}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={fetching} onRefresh={loadRequests} colors={["#6366F1"]} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
               <Text style={[styles.sectionSubtitle, { color: themeColors.subText }]}>INBOX & ARCHIVE</Text>
               <View style={[styles.statsRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.statBox}>
                     <Text style={[styles.statNum, { color: '#F59E0B' }]}>{requests.filter(r => r.staff_status === 'pending').length}</Text>
                     <Text style={styles.statLabel}>PENDING</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.statBox}>
                     <Text style={[styles.statNum, { color: '#10B981' }]}>{requests.filter(r => r.staff_status === 'approved').length}</Text>
                     <Text style={styles.statLabel}>PROCESSED</Text>
                  </View>
               </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyShell}>
               <View style={[styles.emptyCircle, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <Ionicons name="documents" size={60} color={isDark ? '#334155' : '#CBD5E1'} />
               </View>
               <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Applications Found</Text>
               <Text style={[styles.emptySub, { color: themeColors.subText }]}>When students submit leave or permission requests, they will appear here for your review.</Text>
            </View>
          }
        />
      )}

      {/* Modern Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: themeColors.bg }]}>
             <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                <View>
                   <Text style={[styles.mSubtitle, { color: themeColors.subText }]}>DOCUMENT REVIEW</Text>
                   <Text style={[styles.mTitle, { color: themeColors.text }]}>Application Details</Text>
                </View>
                <TouchableOpacity style={styles.closeModal} onPress={() => setModalVisible(false)}>
                   <Ionicons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
             </View>

             <ScrollView contentContainerStyle={styles.mScroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.mMetaCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                   <View style={styles.mMetaItem}>
                      <Text style={styles.mMetaLabel}>STUDENT NAME</Text>
                      <Text style={[styles.mMetaVal, { color: themeColors.text }]}>{currentRequest?.student_name}</Text>
                   </View>
                   <View style={styles.mMetaItem}>
                      <Text style={styles.mMetaLabel}>DATE SUBMITTED</Text>
                      <Text style={[styles.mMetaVal, { color: themeColors.text }]}>{currentRequest && new Date(currentRequest.created_at).toDateString()}</Text>
                   </View>
                </View>

                <View style={styles.mLetterBox}>
                   <View style={styles.mLetterHeader}>
                      <Ionicons name="document-text" size={20} color="#6366F1" />
                      <Text style={[styles.mLetterTitle, { color: themeColors.text }]}>{currentRequest?.letter.title}</Text>
                   </View>
                   <Text style={[styles.mLetterBody, { color: themeColors.text }]}>{currentRequest?.letter.content}</Text>
                </View>

                {currentRequest?.staff_status === 'pending' ? (
                  <View style={styles.mActionZone}>
                     <Text style={[styles.mSectionTitle, { color: themeColors.text }]}>STAFF REMARKS (OPTIONAL)</Text>
                     <TextInput
                        style={[styles.mInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                        placeholder="E.g. Verified with parent..."
                        placeholderTextColor={themeColors.subText}
                        multiline
                        value={declineComment}
                        onChangeText={setDeclineComment}
                     />
                     <View style={styles.mBtnRow}>
                        <TouchableOpacity 
                           style={[styles.mBtn, { backgroundColor: '#EF4444' }]} 
                           onPress={() => currentRequest && handleAction(currentRequest.id, "rejected", declineComment)}
                        >
                           <Text style={styles.mBtnText}>REJECT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                           style={[styles.mBtn, { backgroundColor: '#10B981' }]} 
                           onPress={() => currentRequest && handleAction(currentRequest.id, "approved", declineComment)}
                        >
                           <Text style={styles.mBtnText}>APPROVE</Text>
                        </TouchableOpacity>
                     </View>
                  </View>
                ) : (
                  <View style={[styles.mDoneCard, { backgroundColor: currentRequest?.staff_status === 'approved' ? '#10B98115' : '#EF444415' }]}>
                     <FontAwesome5 
                        name={currentRequest?.staff_status === 'approved' ? 'check-circle' : 'times-circle'} 
                        size={32} 
                        color={currentRequest?.staff_status === 'approved' ? '#10B981' : '#EF4444'} 
                     />
                     <Text style={[styles.mDoneTitle, { color: currentRequest?.staff_status === 'approved' ? '#10B981' : '#EF4444' }]}>
                        Application {currentRequest?.staff_status?.toUpperCase()}
                     </Text>
                     {currentRequest?.staff_comment && (
                        <Text style={[styles.mDoneSub, { color: themeColors.subText }]}>
                           Remarks: {currentRequest.staff_comment}
                        </Text>
                     )}
                  </View>
                )}
                <View style={{ height: 40 }} />
             </ScrollView>
          </View>
        </View>
      </Modal>

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
     paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  refreshIcon: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listBody: { padding: 20, paddingBottom: 100 },
  listHeader: { marginBottom: 25 },
  sectionSubtitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 },
  statsRow: { flexDirection: 'row', padding: 20, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginTop: 4 },
  statDivider: { width: 1, height: 30, opacity: 0.5 },

  reqCard: { flexDirection: 'row', borderRadius: 24, borderWidth: 1, marginBottom: 15, overflow: 'hidden', elevation: 2 },
  statusLine: { width: 6 },
  reqMain: { flex: 1, padding: 20 },
  reqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  reqHeaderLeft: { flex: 1, marginRight: 10 },
  reqSubject: { fontSize: 16, fontWeight: '800' },
  reqSender: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  miniBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  miniBadgeText: { fontSize: 9, fontWeight: '900' },
  reqSnippet: { fontSize: 13, lineHeight: 20 },
  reqFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, alignItems: 'center' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  actionPrompt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promptText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },

  emptyShell: { alignItems: 'center', marginTop: 80 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginHorizontal: 40, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { height: '85%', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottomWidth: 1 },
  mSubtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  mTitle: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  closeModal: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  mScroll: { paddingTop: 20 },
  mMetaCard: { flexDirection: 'row', borderRadius: 24, padding: 20, borderWidth: 1, gap: 20, marginBottom: 25 },
  mMetaItem: { flex: 1 },
  mMetaLabel: { fontSize: 9, fontWeight: '800', color: '#9CA3AF', marginBottom: 6 },
  mMetaVal: { fontSize: 14, fontWeight: '700' },

  mLetterBox: { marginBottom: 30 },
  mLetterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  mLetterTitle: { fontSize: 18, fontWeight: '800' },
  mLetterBody: { fontSize: 16, lineHeight: 26, opacity: 0.8 },

  mActionZone: { paddingVertical: 10 },
  mSectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  mInput: { borderRadius: 18, padding: 18, fontSize: 15, borderWidth: 1, height: 120, textAlignVertical: 'top', marginBottom: 20 },
  mBtnRow: { flexDirection: 'row', gap: 15 },
  mBtn: { flex: 1, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  mBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },

  mDoneCard: { alignItems: 'center', padding: 30, borderRadius: 24, gap: 15 },
  mDoneTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  mDoneSub: { fontSize: 13, fontWeight: '600', fontStyle: 'italic', textAlign: 'center' },
});
