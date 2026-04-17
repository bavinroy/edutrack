import React, { useEffect, useState, useCallback } from "react";
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
  ScrollView,
  StatusBar,
  Dimensions,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

type Letter = { id: number; title: string; content: string; created_at: string };
type Request = {
  id: number;
  letter: Letter;
  student_name: string;
  staff_status: string;
  admin_status: string;
  principal_status: string;
  principal_comment?: string;
  created_at: string;
};

type AccountRequest = {
  id: number;
  uploaded_by_name: string;
  department_name: string;
  file: string;
  status: string;
  created_at: string;
};

export default function AdminRequestsScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'letters' | 'accounts'>('letters');
  const [requests, setRequests] = useState<Request[]>([]);
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [currentAccountRequest, setCurrentAccountRequest] = useState<AccountRequest | null>(null);

  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

      const headers = { Authorization: `Bearer ${token}` };
      
      if (activeTab === 'letters') {
        const res = await axios.get(`${API_BASE_URL}/api/accounts/request/principal/list/`, { headers });
        setRequests(res.data);
      } else {
        const res = await axios.get(`${API_BASE_URL}/api/accounts/account-request/list/`, { headers });
        setAccountRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab])
  );

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await axios.patch(`${API_BASE_URL}/api/accounts/request/principal/${id}/`, {
        principal_status: status,
        principal_comment: comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", `Request has been ${status}.`);
      setModalVisible(false);
      setComment("");
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Could not complete the action.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccountAction = async (id: number, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await axios.post(`${API_BASE_URL}/api/accounts/account-request/${id}/action/`, {
        action: action,
        comment: comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", `Account request ${action}ed.`);
      setAccountModalVisible(false);
      setComment("");
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", "Action failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStatus = (status: string) => {
    const s = status.toLowerCase();
    let color = "#f59e0b"; // pending
    if (s === 'approved' || s === 'completed' || s === 'active') color = "#10b981";
    if (s === 'rejected' || s === 'failed' || s === 'denied') color = "#ef4444";

    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusTxt, { color }]}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  const renderLetter = ({ item }: { item: Request }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={() => { setCurrentRequest(item); setModalVisible(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHdr}>
        <View style={[styles.iconHole, { backgroundColor: '#6366F115' }]}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#6366F1" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.itemTitle, { color: themeColors.text }]}>{item.letter.title}</Text>
          <Text style={[styles.itemMeta, { color: themeColors.subText }]}>Student: {item.student_name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.outline} />
      </View>
      <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
        <View style={styles.dateBox}>
          <Ionicons name="time-outline" size={14} color={themeColors.subText} />
          <Text style={[styles.dateTxt, { color: themeColors.subText }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {renderStatus(item.principal_status || 'pending')}
      </View>
    </TouchableOpacity>
  );

  const renderAccount = ({ item }: { item: AccountRequest }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={() => { setCurrentAccountRequest(item); setAccountModalVisible(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHdr}>
        <View style={[styles.iconHole, { backgroundColor: '#10B98115' }]}>
          <Ionicons name="person-add-outline" size={26} color="#10B981" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.itemTitle, { color: themeColors.text }]}>Account Request</Text>
          <Text style={[styles.itemMeta, { color: themeColors.subText }]}>{item.uploaded_by_name} • {item.department_name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.outline} />
      </View>
      <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
        <View style={styles.dateBox}>
          <Ionicons name="time-outline" size={14} color={themeColors.subText} />
          <Text style={[styles.dateTxt, { color: themeColors.subText }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {renderStatus(item.status)}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Requests</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>PENDING APPROVALS</Text>
          </View>
          <TouchableOpacity onPress={() => { setRefreshing(true); fetchData(); }} style={styles.refreshBtn}>
            <Ionicons name="sync" size={20} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabsWrapper, { backgroundColor: themeColors.bg }]}>
          <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'letters' && { backgroundColor: themeColors.card, elevation: 4 }]}
              onPress={() => setActiveTab('letters')}
            >
              <Text style={[styles.tabTxt, { color: activeTab === 'letters' ? '#6366F1' : themeColors.subText }]}>Letters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'accounts' && { backgroundColor: themeColors.card, elevation: 4 }]}
              onPress={() => setActiveTab('accounts')}
            >
              <Text style={[styles.tabTxt, { color: activeTab === 'accounts' ? '#6366F1' : themeColors.subText }]}>Accounts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
        ) : (
          <FlatList
            data={(activeTab === 'letters' ? requests : accountRequests) as any[]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={activeTab === 'letters' ? renderLetter as any : renderAccount as any}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={["#6366F1"]} />}
            ListHeaderComponent={
              <View style={styles.intelHdr}>
                <Text style={[styles.intelTxt, { color: themeColors.subText }]}>PENDING: <Text style={{ color: '#6366F1', fontWeight: '900' }}>{(activeTab === 'letters' ? requests : accountRequests).filter(x => (x as any).status === 'PENDING' || (x as any).principal_status === 'pending').length}</Text></Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="check-circle-outline" size={80} color={themeColors.border} />
                <Text style={[styles.emptyText, { color: themeColors.subText }]}>No pending requests to show.</Text>
              </View>
            }
          />
        )}

        {/* Decision Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <View style={styles.modalIndicator} />
              <View style={styles.modalHdr}>
                <Text style={styles.modalRole}>REVIEW REQUEST</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color={themeColors.outline} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>{currentRequest?.letter.title}</Text>
                <View style={styles.authorSection}>
                  <View style={[styles.authorCircle, { backgroundColor: '#6366F115' }]}>
                    <Text style={styles.authorInt}>{currentRequest?.student_name[0]}</Text>
                  </View>
                  <View>
                    <Text style={[styles.authorName, { color: themeColors.text }]}>{currentRequest?.student_name}</Text>
                    <Text style={[styles.authorRole, { color: themeColors.subText }]}>Student</Text>
                  </View>
                </View>

                <View style={[styles.caseDetails, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: themeColors.border }]}>
                  <Text style={[styles.caseContent, { color: themeColors.text }]}>{currentRequest?.letter.content}</Text>
                </View>

                <Text style={[styles.inpLabel, { color: themeColors.subText }]}>YOUR COMMENT</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                  placeholder="Add a comment (optional)..."
                  multiline
                  value={comment}
                  onChangeText={setComment}
                  placeholderTextColor={themeColors.outline}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnReject, { borderColor: themeColors.border }]}
                    onPress={() => currentRequest && handleAction(currentRequest.id, 'rejected')}
                    disabled={isProcessing}
                  >
                    <Text style={styles.btnTxtReject}>REJECT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnApprove]}
                    onPress={() => currentRequest && handleAction(currentRequest.id, 'approved')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxtApprove}>APPROVE</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Account Decision Modal */}
        <Modal visible={accountModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <View style={styles.modalIndicator} />
              <View style={styles.modalHdr}>
                <Text style={styles.modalRole}>REVIEW ACCOUNTS</Text>
                <TouchableOpacity onPress={() => setAccountModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color={themeColors.outline} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>New Account Request</Text>
                <View style={styles.authorSection}>
                  <View style={[styles.authorCircle, { backgroundColor: '#10B98115' }]}><Ionicons name="person-add" size={20} color="#10B981" /></View>
                  <View>
                    <Text style={[styles.authorName, { color: themeColors.text }]}>{currentAccountRequest?.uploaded_by_name}</Text>
                    <Text style={[styles.authorRole, { color: themeColors.subText }]}>{currentAccountRequest?.department_name}</Text>
                  </View>
                </View>

                <View style={[styles.protocolBox, { backgroundColor: '#6366F110', borderColor: '#6366F130' }]}>
                  <Ionicons name="information-circle" size={24} color="#6366F1" />
                  <Text style={[styles.protocolTxt, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>Approving this will create accounts for the listed users.</Text>
                </View>

                <Text style={[styles.inpLabel, { color: themeColors.subText }]}>YOUR COMMENT</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                  placeholder="Add a comment (optional)..."
                  multiline
                  value={comment}
                  onChangeText={setComment}
                  placeholderTextColor={themeColors.outline}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnReject, { borderColor: themeColors.border }]}
                    onPress={() => currentAccountRequest && handleAccountAction(currentAccountRequest.id, 'reject')}
                    disabled={isProcessing}
                  >
                    <Text style={styles.btnTxtReject}>REJECT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnApprove]}
                    onPress={() => currentAccountRequest && handleAccountAction(currentAccountRequest.id, 'approve')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxtApprove}>APPROVE</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  headerTitleBox: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

  tabsWrapper: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  tabsContainer: { flexDirection: 'row', padding: 5, borderRadius: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabTxt: { fontSize: 13, fontWeight: '800' },

  listContent: { padding: 20, paddingBottom: 100 },
  intelHdr: { marginBottom: 15, paddingHorizontal: 5 },
  intelTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  card: { borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHdr: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  iconHole: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 15 },
  itemTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  itemMeta: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 15 },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTxt: { fontSize: 11, fontWeight: '700' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 9, fontWeight: '900' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 20, paddingHorizontal: 50, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '90%' },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalRole: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 1.5 },
  modalTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },

  authorSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20, marginBottom: 25 },
  authorCircle: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  authorInt: { fontSize: 20, fontWeight: '900', color: '#6366F1' },
  authorName: { fontSize: 16, fontWeight: '800' },
  authorRole: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  caseDetails: { borderRadius: 24, padding: 22, marginBottom: 30, borderWidth: 1 },
  caseContent: { fontSize: 15, lineHeight: 24, fontWeight: '500' },

  inpLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  textArea: { borderRadius: 22, padding: 20, fontSize: 15, height: 120, textAlignVertical: 'top', borderWidth: 1, marginBottom: 30, fontWeight: '600' },

  modalActions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  btnApprove: { backgroundColor: '#6366F1', flex: 1.6, elevation: 8, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  btnReject: { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnTxtApprove: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  btnTxtReject: { color: '#EF4444', fontWeight: '900', fontSize: 11, letterSpacing: 1 },

  protocolBox: { flexDirection: 'row', alignItems: 'center', gap: 15, borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1 },
  protocolTxt: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 20 }
});
