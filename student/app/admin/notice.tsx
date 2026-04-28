import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  StatusBar,
  Dimensions,
  Alert,
  ScrollView,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

type Notice = {
  id: number;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  author_name: string;
  target_staff: boolean;
  target_student: boolean;
  target_dept_admin: boolean;
  can_delete?: boolean;
  can_edit?: boolean;
};

export default function PrincipalNoticeScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [targetDeptAdmin, setTargetDeptAdmin] = useState(true);
  const [targetStaff, setTargetStaff] = useState(true);
  const [targetStudent, setTargetStudent] = useState(true);

  const fetchNotices = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");
      
      const res = await axios.get(`${API_BASE_URL}/api/accounts/notice/list/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotices();
    }, [])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Required", "We need access to your photos to attach images.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!title || !content) return Alert.alert("Missing Info", "Please add a title and message for your notice.");
    setIsPosting(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("target_dept_admin", String(targetDeptAdmin));
      formData.append("target_staff", String(targetStaff));
      formData.append("target_student", String(targetStudent));

      if (image) {
        const filename = image.split('/').pop() || "notice.jpg";
        formData.append("image", { uri: image, name: filename, type: 'image/jpeg' } as any);
      }

      await axios.post(`${API_BASE_URL}/api/accounts/notice/create/`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      Alert.alert("Posted", "Your announcement has been shared.");
      setTitle(""); setContent(""); setImage(null); setShowEditor(false);
      fetchNotices();
    } catch (err) {
      Alert.alert("Error", "Could not post the notice. Please check your connection.");
    } finally {
      setIsPosting(false);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete Notice?", "This announcement will be removed for everyone. Still delete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const token = await AsyncStorage.getItem("accessToken");
          try {
            await axios.delete(`${API_BASE_URL}/api/accounts/notice/${id}/delete/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotices();
          } catch (e) { Alert.alert("Error", "Failed to delete notice."); }
        }
      }
    ]);
  };

  const renderNotice = ({ item }: { item: Notice }) => (
    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.authorBadge}>
          <View style={[styles.avatarMini, { backgroundColor: '#6366F115' }]}>
            <Text style={styles.avatarTxt}>{item.author_name[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: themeColors.text }]}>{item.author_name}</Text>
            <Text style={[styles.timestamp, { color: themeColors.subText }]}>{new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={[styles.retractBtn, { backgroundColor: isDark ? '#450a0a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FEE2E2' }]} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.noticeTitle, { color: themeColors.text }]}>{item.title}</Text>
      <Text style={[styles.noticeContent, { color: themeColors.text }]}>{item.content}</Text>

      {item.image && (
        <View style={[styles.noticeImgWrap, { borderColor: themeColors.border }]}>
          <Image source={{ uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}` }} style={styles.noticeImg} />
        </View>
      )}

      <View style={[styles.footerRow, { borderTopColor: themeColors.border }]}>
        <View style={styles.audienceStack}>
          {item.target_dept_admin && <View style={[styles.audTag, { backgroundColor: '#E0E7FF' }]}><Text style={[styles.audTxt, { color: '#4338CA' }]}>HODs</Text></View>}
          {item.target_staff && <View style={[styles.audTag, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.audTxt, { color: '#15803D' }]}>Staff</Text></View>}
          {item.target_student && <View style={[styles.audTag, { backgroundColor: '#FFEDD5' }]}><Text style={[styles.audTxt, { color: '#C2410C' }]}>Students</Text></View>}
        </View>
        <MaterialCommunityIcons name="check-decagram" size={20} color="#6366F1" />
      </View>
    </View>
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
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Announcements</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>SCHOOL NOTICES</Text>
          </View>
          <TouchableOpacity onPress={() => setShowEditor(!showEditor)} style={[styles.toggleBtn, showEditor && { backgroundColor: '#6366F1' }]} activeOpacity={0.8}>
            <Ionicons name={showEditor ? "close" : "megaphone-outline"} size={22} color={showEditor ? "#fff" : "#6366F1"} />
          </TouchableOpacity>
        </View>

        {showEditor && (
          <View style={[styles.editorPanel, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.panelTitle, { color: themeColors.text }]}>New Announcement</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.subText }]}>TITLE</Text>
                <TextInput
                  style={[styles.titleInp, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                  placeholder="Notice Heading..."
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={themeColors.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.subText }]}>MESSAGE</Text>
                <TextInput
                  style={[styles.contentInp, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                  placeholder="Write your message here..."
                  value={content}
                  onChangeText={setContent}
                  multiline
                  placeholderTextColor={themeColors.outline}
                />
              </View>

              <Text style={[styles.label, { color: themeColors.subText }]}>SEND TO</Text>
              <View style={styles.audRow}>
                {[
                  { id: 'hod', label: 'HODs', active: targetDeptAdmin, set: setTargetDeptAdmin },
                  { id: 'staff', label: 'Staff', active: targetStaff, set: setTargetStaff },
                  { id: 'stu', label: 'Students', active: targetStudent, set: setTargetStudent }
                ].map((aud) => (
                  <TouchableOpacity
                    key={aud.id}
                    style={[styles.audChip, aud.active && { backgroundColor: '#6366F1' }, { borderColor: themeColors.border }]}
                    onPress={() => aud.set(!aud.active)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.audChipTxt, { color: aud.active ? '#fff' : themeColors.subText }]}>{aud.label.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editorCtrl}>
                <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: themeColors.border }]} onPress={pickImage} activeOpacity={0.7}>
                  {image ? <Image source={{ uri: image }} style={styles.mediaPre} /> :
                    <><Ionicons name="image-outline" size={20} color="#6366F1" /><Text style={[styles.mediaLab, { color: themeColors.subText }]}>Image</Text></>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dispatchBtn, isPosting && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={isPosting}
                  activeOpacity={0.8}
                >
                  {isPosting ? <EduLoading size={25} /> :
                    <><Text style={styles.dispatchTxt}>POST</Text><Ionicons name="send" size={16} color="#fff" /></>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        <FlatList
          data={notices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotice}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchNotices} colors={["#6366F1"]} />}
          ListHeaderComponent={
            <View style={styles.broadcastHdr}>
              <Text style={[styles.broadcastSum, { color: themeColors.subText }]}>RECENT NOTICES • <Text style={{ color: '#6366F1', fontWeight: '900' }}>{notices.length}</Text></Text>
            </View>
          }
          ListEmptyComponent={
            loading && !fetching ? <EduLoading size={60} style={{ marginTop: 50 }} /> :
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={80} color={themeColors.border} />
                <Text style={[styles.emptyText, { color: themeColors.subText }]}>No announcements yet.</Text>
              </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  headerTitleBox: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.8 },
  headerSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },
  toggleBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

  editorPanel: { padding: 25, borderBottomWidth: 1, maxHeight: 550, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  panelTitle: { fontSize: 22, fontWeight: '900', marginBottom: 25, letterSpacing: -1 },
  inputGroup: { marginBottom: 20 },
  titleInp: { borderRadius: 20, padding: 18, fontSize: 16, fontWeight: '800', borderWidth: 1 },
  contentInp: { borderRadius: 24, padding: 18, fontSize: 15, height: 140, textAlignVertical: 'top', borderWidth: 1, fontWeight: '600' },

  label: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  audRow: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  audChip: { flex: 1, paddingVertical: 14, borderRadius: 18, backgroundColor: 'transparent', alignItems: 'center', borderWidth: 1.5 },
  audChipTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  editorCtrl: { flexDirection: 'row', gap: 12, paddingBottom: 15 },
  mediaBtn: { flex: 0.3, height: 64, borderRadius: 22, borderStyle: 'dotted', borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, overflow: 'hidden' },
  mediaPre: { width: '100%', height: '100%' },
  mediaLab: { fontSize: 10, fontWeight: '800' },
  dispatchBtn: { flex: 0.7, height: 64, borderRadius: 24, backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 8, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15 },
  dispatchTxt: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  listContent: { padding: 20, paddingBottom: 120 },
  broadcastHdr: { marginBottom: 25, paddingHorizontal: 5 },
  broadcastSum: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

  card: { borderRadius: 32, padding: 25, marginBottom: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  authorBadge: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarMini: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 20, fontWeight: '900', color: '#6366F1' },
  authorName: { fontSize: 16, fontWeight: '900' },
  timestamp: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  retractBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  noticeTitle: { fontSize: 22, fontWeight: '900', marginBottom: 12, letterSpacing: -0.8 },
  noticeContent: { fontSize: 15, lineHeight: 24, marginBottom: 20, fontWeight: '500' },
  noticeImgWrap: { width: '100%', height: 240, borderRadius: 28, marginBottom: 25, overflow: 'hidden', borderWidth: 1 },
  noticeImg: { width: '100%', height: '100%' },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 20 },
  audienceStack: { flexDirection: 'row', gap: 8 },
  audTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  audTxt: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 25, paddingHorizontal: 50, lineHeight: 22 }
});
