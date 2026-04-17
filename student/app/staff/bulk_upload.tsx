import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  StatusBar,
  Dimensions,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import StaffBottomNav from "../../components/StaffBottomNav";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function BulkUploadScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ users: any[], valid_count: number, errors: string[] } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/accounts/user-creation-requests/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (e) { }
    finally { setHistoryLoading(false); }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) { }
  };

  const processUpload = async (isPreview: boolean = true) => {
    if (!file) return;
    setLoading(true);
    if (!isPreview) setPreviewVisible(false);

    try {
      const token = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      } as any);

      if (isPreview) formData.append("preview", "true");

      const res = await fetch(`${API_BASE_URL}/api/accounts/bulk-upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (isPreview) {
        if (res.ok && data.preview) {
          setPreviewData(data);
          setPreviewVisible(true);
        } else {
          Alert.alert("Validation Error", data.error || data.detail || "Invalid file format.");
        }
      } else {
        if (res.ok) {
          Alert.alert("Success", "Request submitted to Registrar.");
          setFile(null);
          loadHistory();
        } else {
          Alert.alert("Failure", data.detail || "Upload rejected.");
        }
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Check your internet connection.");
    }
  };

  const deleteHistoryItem = (id: number) => {
    Alert.alert("Remove Record", "Delete this history entry?", [
      { text: "Cancel" },
      { text: "Confirm", style: 'destructive', onPress: async () => {
          const token = await AsyncStorage.getItem("accessToken");
          await fetch(`${API_BASE_URL}/api/accounts/user-creation-requests/${id}/delete/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          loadHistory();
      }}
    ]);
  };

  const getStatusMeta = (s: string) => {
    switch (s) {
      case 'approved': return { color: '#10B981', label: 'APPROVED', icon: 'check-circle' };
      case 'rejected': return { color: '#EF4444', label: 'REJECTED', icon: 'times-circle' };
      default: return { color: '#F59E0B', label: 'PENDING', icon: 'hourglass-half' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Bulk Enroll Systems</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setHelpVisible(true)}>
          <Ionicons name="help-circle" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={historyLoading} onRefresh={loadHistory} />}>
        
        {/* Upload Interface */}
        <View style={[styles.uploadCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
           <Text style={[styles.cardTitle, { color: themeColors.text }]}>New Admission Batch</Text>
           <Text style={[styles.cardSub, { color: themeColors.subText }]}>Drop an Excel or CSV file to queue student account creation requests.</Text>
           
           <TouchableOpacity style={[styles.dropZone, { borderStyle: 'dashed' }, file && { borderColor: '#6366F1', backgroundColor: '#6366F108' }]} onPress={pickFile}>
              <View style={[styles.dropIconBox, { backgroundColor: file ? '#6366F115' : isDark ? '#374151' : '#F1F5F9' }]}>
                 <MaterialCommunityIcons name={file ? "file-check" : "file-upload-outline"} size={40} color={file ? "#6366F1" : themeColors.subText} />
              </View>
              <Text style={[styles.fileLabel, { color: themeColors.text }]}>{file ? file.name : "Select Spreadsheet"}</Text>
              {file && <Text style={styles.fileSize}>{(file.size! / 1024).toFixed(1)} KB • Ready for preview</Text>}
           </TouchableOpacity>

           <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: file ? '#6366F1' : themeColors.border }]} 
              disabled={!file || loading}
              onPress={() => processUpload(true)}
           >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>PREVIEW & VALIDATE</Text>}
           </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: themeColors.text }]}>TRANSACTION HISTORY</Text>
           <TouchableOpacity onPress={loadHistory}><Ionicons name="sync" size={16} color={themeColors.subText} /></TouchableOpacity>
        </View>

        {history.map((item, idx) => {
          const meta = getStatusMeta(item.status);
          return (
            <TouchableOpacity key={idx} style={[styles.historyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onLongPress={() => deleteHistoryItem(item.id)}>
               <View style={styles.hTop}>
                  <View style={styles.hInfo}>
                     <Text style={[styles.hDate, { color: themeColors.text }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                     <Text style={styles.hTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={[styles.hBadge, { backgroundColor: `${meta.color}15` }]}>
                     <FontAwesome5 name={meta.icon} size={10} color={meta.color} />
                     <Text style={[styles.hBadgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
               </View>

               {item.admin_comment && (
                 <View style={[styles.hComment, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                    <Text style={styles.hCommentTitle}>REGISTRAR REMARK:</Text>
                    <Text style={[styles.hCommentText, { color: themeColors.text }]}>{item.admin_comment}</Text>
                 </View>
               )}
            </TouchableOpacity>
          );
        })}

        {history.length === 0 && !historyLoading && (
          <View style={styles.emptyWrap}>
             <Ionicons name="documents-outline" size={48} color={themeColors.border} />
             <Text style={[styles.emptyText, { color: themeColors.subText }]}>No recorded upload sessions.</Text>
          </View>
        )}

      </ScrollView>

      {/* Help Modal */}
      <Modal visible={helpVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
           <View style={[styles.modalBox, { backgroundColor: themeColors.card }]}>
              <View style={styles.mHeader}>
                 <Text style={[styles.mTitle, { color: themeColors.text }]}>Sheet Requirements</Text>
                 <TouchableOpacity onPress={() => setHelpVisible(false)}><Ionicons name="close" size={24} color={themeColors.text} /></TouchableOpacity>
              </View>
              <ScrollView style={styles.mBody}>
                 <Text style={styles.mPara}>Include a header row with the following column names (exact case):</Text>
                 {[
                   { k: 'username', d: 'Student Reg Number (Unique)' },
                   { k: 'email', d: 'Verified Institutional Email' },
                   { k: 'first_name', d: 'Students Legal First Name' },
                   { k: 'last_name', d: 'Students Surname' },
                   { k: 'role', d: 'Must be STUDENT' },
                 ].map((row, i) => (
                   <View key={i} style={styles.mRow}>
                      <Text style={styles.mKey}>{row.k}</Text>
                      <Text style={[styles.mDesc, { color: themeColors.subText }]}>{row.d}</Text>
                   </View>
                 ))}
                 <View style={[styles.mInfoBox, { backgroundColor: '#6366F110' }]}>
                    <Ionicons name="bulb" size={16} color="#6366F1" />
                    <Text style={styles.mInfoText}>Password defaults to "Default@123" unless specified in a 'password' column.</Text>
                 </View>
              </ScrollView>
           </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
           <View style={[styles.previewBox, { backgroundColor: themeColors.bg }]}>
              <View style={styles.pHeader}>
                 <Text style={[styles.pTitle, { color: themeColors.text }]}>Upload Verification</Text>
                 <TouchableOpacity onPress={() => setPreviewVisible(false)}><Ionicons name="close" size={24} color={themeColors.text} /></TouchableOpacity>
              </View>

              <ScrollView style={styles.pScroll}>
                 <View style={styles.pStatsRow}>
                    <View style={styles.pStatItem}>
                       <Text style={[styles.pStatNum, { color: '#10B981' }]}>{previewData?.valid_count}</Text>
                       <Text style={styles.pStatLab}>VALID RECORDS</Text>
                    </View>
                    <View style={styles.pStatItem}>
                       <Text style={[styles.pStatNum, { color: '#EF4444' }]}>{previewData?.errors.length}</Text>
                       <Text style={styles.pStatLab}>CONFLICTS</Text>
                    </View>
                 </View>

                 {previewData?.errors.length! > 0 && (
                   <View style={styles.pErrBox}>
                      <Text style={styles.pErrTitle}>FIX REQUIRED:</Text>
                      {previewData?.errors.map((err, i) => <Text key={i} style={styles.pErrText}>• {err}</Text>)}
                   </View>
                 )}

                 <Text style={styles.pSubHead}>DATA PREVIEW (TOP 50)</Text>
                 <ScrollView horizontal style={styles.pTableBox}>
                    <View style={styles.pTable}>
                       <View style={[styles.pTableRow, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                          <Text style={[styles.pHeadCell, { width: 100 }]}>Reg No</Text>
                          <Text style={[styles.pHeadCell, { width: 140 }]}>Name</Text>
                          <Text style={[styles.pHeadCell, { width: 180 }]}>Email</Text>
                       </View>
                       {previewData?.users.map((u, i) => (
                         <View key={i} style={[styles.pTableRow, { borderBottomColor: themeColors.border }]}>
                            <Text style={[styles.pCell, { width: 100, color: themeColors.text }]}>{u.username}</Text>
                            <Text style={[styles.pCell, { width: 140, color: themeColors.text }]}>{u.first_name} {u.last_name}</Text>
                            <Text style={[styles.pCell, { width: 180, color: themeColors.text }]}>{u.email}</Text>
                         </View>
                       ))}
                    </View>
                 </ScrollView>
              </ScrollView>

              <View style={[styles.pFooter, { borderTopColor: themeColors.border }]}>
                 <TouchableOpacity style={styles.pCancel} onPress={() => setPreviewVisible(false)}>
                    <Text style={[styles.pCancelText, { color: themeColors.text }]}>ABORT</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.pConfirm} onPress={() => processUpload(false)}>
                    <Text style={styles.pConfirmText}>SUBMIT BATCH</Text>
                 </TouchableOpacity>
              </View>
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
  helpBtn: { padding: 4 },

  scrollBody: { padding: 20, paddingBottom: 110 },
  uploadCard: { borderRadius: 28, padding: 25, borderWidth: 1, marginBottom: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05 },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  cardSub: { fontSize: 13, lineHeight: 20, marginBottom: 25 },
  dropZone: { 
     height: 180, borderRadius: 24, borderWidth: 2, borderColor: '#eee', 
     justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB05', marginBottom: 25 
  },
  dropIconBox: { width: 70, height: 70, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  fileLabel: { fontSize: 15, fontWeight: '700' },
  fileSize: { fontSize: 11, color: '#6366F1', fontWeight: '800', marginTop: 5 },
  primaryBtn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  historyCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 12 },
  hTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hDate: { fontSize: 14, fontWeight: '700' },
  hTime: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  hBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hBadgeText: { fontSize: 9, fontWeight: '900' },
  hComment: { marginTop: 15, padding: 15, borderRadius: 16 },
  hCommentTitle: { fontSize: 9, fontWeight: '900', color: '#6366F1', marginBottom: 4 },
  hCommentText: { fontSize: 13, fontStyle: 'italic', fontWeight: '500' },

  emptyWrap: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { fontSize: 13, fontWeight: '600', marginTop: 15 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', borderRadius: 28, padding: 24 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mTitle: { fontSize: 18, fontWeight: '800' },
  mBody: { maxHeight: 400 },
  mPara: { fontSize: 14, color: '#9CA3AF', marginBottom: 20, lineHeight: 20 },
  mRow: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  mKey: { color: '#6366F1', fontWeight: '800', width: 80, fontSize: 13 },
  mDesc: { flex: 1, fontSize: 13, fontWeight: '600' },
  mInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, borderRadius: 15, marginTop: 10 },
  mInfoText: { flex: 1, fontSize: 11, color: '#6366F1', fontWeight: '700', lineHeight: 16 },

  previewBox: { width: '95%', height: '90%', borderRadius: 36, overflow: 'hidden' },
  pHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1 },
  pTitle: { fontSize: 20, fontWeight: '800' },
  pScroll: { flex: 1, padding: 25 },
  pStatsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  pStatItem: { flex: 1, backgroundColor: 'rgba(0,0,0,0.03)', padding: 15, borderRadius: 20, alignItems: 'center' },
  pStatNum: { fontSize: 24, fontWeight: '800' },
  pStatLab: { fontSize: 9, fontWeight: '900', color: '#9CA3AF', marginTop: 4 },
  pErrBox: { backgroundColor: '#EF444410', padding: 20, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#EF444420' },
  pErrTitle: { color: '#EF4444', fontWeight: '900', fontSize: 12, marginBottom: 10 },
  pErrText: { color: '#EF4444', fontSize: 12, marginBottom: 4, fontWeight: '600' },
  pSubHead: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', marginBottom: 15, letterSpacing: 1 },
  pTableBox: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  pTable: { minWidth: 420 },
  pTableRow: { flexDirection: 'row', borderBottomWidth: 1, padding: 12 },
  pHeadCell: { fontSize: 11, fontWeight: '900', color: '#9CA3AF' },
  pCell: { fontSize: 13, fontWeight: '600' },
  pFooter: { flexDirection: 'row', padding: 20, paddingBottom: 35, borderTopWidth: 1, gap: 15 },
  pCancel: { flex: 1, height: 56, justifyContent: 'center', alignItems: 'center' },
  pCancelText: { fontWeight: '800', letterSpacing: 1 },
  pConfirm: { flex: 2, height: 56, backgroundColor: '#6366F1', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  pConfirmText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
});
