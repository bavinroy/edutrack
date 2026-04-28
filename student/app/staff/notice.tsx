import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../config";
import StaffBottomNav from "../../components/StaffBottomNav";
import axios from "axios";
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
  author_avatar?: string;
  acknowledgements_count?: number;
  category?: string;
  target_student: boolean;
  target_staff: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
};

export default function StaffNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [targetStudent, setTargetStudent] = useState(true);
  const [targetStaff, setTargetStaff] = useState(false);

  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const tabs = ["ALL", "ACADEMIC", "EVENTS", "EXAMS", "SPORTS"];

  const fetchNotices = async () => {
    setFetching(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/api/notice/list/`, { 
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      const enhancedData = Array.isArray(data) ? data.map(n => ({
        ...n,
        category: inferCategory(n.title).toUpperCase()
      })) : [];
      setNotices(enhancedData);
    } catch (err) { }
    finally { setLoading(false); setFetching(false); }
  };

  const inferCategory = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("exam") || t.includes("schedule") || t.includes("internal") || t.includes("test")) return "EXAMS";
    if (t.includes("event") || t.includes("fest") || t.includes("celebration")) return "EVENTS";
    if (t.includes("sport") || t.includes("cricket") || t.includes("match")) return "SPORTS";
    return "ACADEMIC";
  };

  useEffect(() => { fetchNotices(); }, []);

  const getFilteredNotices = () => {
    let filtered = notices;
    if (selectedTab !== "ALL") filtered = filtered.filter(n => n.category === selectedTab);
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const getBadgeMeta = (category: string) => {
    switch (category) {
      case "EVENTS": return { color: "#3B82F6", icon: "star-face" };
      case "EXAMS": return { color: "#EF4444", icon: "file-certificate" };
      case "ACADEMIC": return { color: "#F59E0B", icon: "book-open-variant" };
      case "SPORTS": return { color: "#10B981", icon: "trophy" };
      default: return { color: "#6366F1", icon: "bullhorn" };
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);
    setTargetStudent(true);
    setTargetStaff(false);
    setModalVisible(true);
  };

  const handleEdit = (item: Notice) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setImage(null);
    setTargetStudent(item.target_student);
    setTargetStaff(item.target_staff);
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handlePost = async () => {
    if (!title || !content) return Alert.alert("Missing Info", "Title and content are required.");
    
    const token = await AsyncStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("target_student", String(targetStudent));
    formData.append("target_staff", String(targetStaff));

    if (image) {
      const filename = image.split('/').pop() || "notice.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append("image", { uri: image, name: filename, type } as any);
    }

    try {
      setLoading(true);
      if (editingId) {
        await axios.patch(`${API_BASE_URL}/api/notice/${editingId}/update/`, formData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/notice/create/`, formData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        });
      }
      setModalVisible(false);
      fetchNotices();
    } catch (err: any) {
      Alert.alert("System Error", "Failed to broadcast notice.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Confirm Deletion", "This notice and all user acknowledgements will be removed permanently.", [
      { text: "Keep It", style: "cancel" },
      { text: "Delete Permanently", style: "destructive", onPress: async () => {
          const token = await AsyncStorage.getItem("accessToken");
          try {
            await axios.delete(`${API_BASE_URL}/api/notice/${id}/delete/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchNotices();
          } catch (err) { }
        }
      }
    ]);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const renderNoticeItem = ({ item }: { item: Notice }) => {
    const meta = getBadgeMeta(item.category || "ACADEMIC");
    const noticeImg = getImageUrl(item.image);
    return (
      <View style={[styles.nCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.nHeader}>
           <View style={[styles.nBadge, { backgroundColor: `${meta.color}15` }]}>
              <MaterialCommunityIcons name={meta.icon as any} size={14} color={meta.color} />
              <Text style={[styles.nBadgeText, { color: meta.color }]}>{item.category}</Text>
           </View>
           <Text style={[styles.nDate, { color: themeColors.subText }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        <Text style={[styles.nTitle, { color: themeColors.text }]}>{item.title}</Text>
        <Text style={[styles.nContent, { color: themeColors.subText }]} numberOfLines={3}>{item.content}</Text>

        {noticeImg && (
           <Image source={{ uri: noticeImg }} style={styles.nImage} />
        )}

        <View style={styles.nAudience}>
           {item.target_student && <View style={[styles.aTag, { backgroundColor: '#3B82F615' }]}><Text style={{ color: '#3B82F6', fontSize: 9, fontWeight: '800' }}>STUDENTS</Text></View>}
           {item.target_staff && <View style={[styles.aTag, { backgroundColor: '#10B98115' }]}><Text style={{ color: '#10B981', fontSize: 9, fontWeight: '800' }}>FACULTY</Text></View>}
        </View>

        <View style={[styles.nFooter, { borderTopColor: themeColors.border }]}>
           <View style={styles.nAuthor}>
              {item.author_avatar ? (
                  <Image source={{ uri: item.author_avatar }} style={styles.authorImg} />
              ) : (
                  <Ionicons name="person-circle" size={18} color={themeColors.subText} />
              )}
              <Text style={[styles.nAuthorName, { color: themeColors.subText }]}>{item.author_name}</Text>
           </View>
           <View style={styles.nActions}>
              {item.can_edit && (
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.nActionBtn}>
                  <Ionicons name="create-outline" size={20} color="#6366F1" />
                </TouchableOpacity>
              )}
              {item.can_delete && (
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.nActionBtn}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
           </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notice Bulletin</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBlock}>
         <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={20} color={themeColors.subText} />
            <TextInput 
               style={[styles.searchInput, { color: themeColors.text }]}
               placeholder="Search by title or keywords..."
               placeholderTextColor={themeColors.subText}
               value={searchQuery}
               onChangeText={setSearchQuery}
            />
         </View>
      </View>

      {/* Categories Tabs */}
      <View style={styles.tabListHeader}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {tabs.map(tab => (
              <TouchableOpacity 
                 key={tab} 
                 style={[styles.tab, { backgroundColor: themeColors.card, borderColor: themeColors.border }, selectedTab === tab && styles.activeTab]}
                 onPress={() => setSelectedTab(tab)}
              >
                 <Text style={[styles.tabText, { color: themeColors.subText }, selectedTab === tab && { color: '#fff' }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
         </ScrollView>
      </View>

      {loading && notices.length === 0 ? (
        <View style={styles.loader}><EduLoading size={60} /></View>
      ) : (
        <FlatList
          data={getFilteredNotices()}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listBody}
          refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchNotices} colors={["#6366F1"]} />}
          renderItem={renderNoticeItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
               <Ionicons name="megaphone-outline" size={60} color={themeColors.border} />
               <Text style={[styles.emptyText, { color: themeColors.subText }]}>No notices published in this category.</Text>
            </View>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={[styles.modalArea, { backgroundColor: themeColors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{editingId ? "Update Bulletin" : "Create New Bulletin"}</Text>
            <TouchableOpacity style={styles.closeModal} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false}>
             <Text style={styles.formLabel}>BULLETIN TITLE</Text>
             <TextInput 
                style={[styles.formInput, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border, color: themeColors.text }]}
                placeholder="E.g. Internal Assessment Schedule..."
                placeholderTextColor={themeColors.subText}
                value={title}
                onChangeText={setTitle}
             />

             <Text style={[styles.formLabel, { marginTop: 25 }]}>CONTENT & DETAILS</Text>
             <TextInput 
                style={[styles.formInputAlt, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Share the full details of the announcement..."
                placeholderTextColor={themeColors.subText}
                multiline
                value={content}
                onChangeText={setContent}
             />

             <Text style={[styles.formLabel, { marginTop: 25 }]}>TARGET AUDIENCE</Text>
             <View style={styles.targetRow}>
                <TouchableOpacity 
                   style={[styles.targetBtn, targetStudent && { backgroundColor: '#3B82F6' }]} 
                   onPress={() => setTargetStudent(!targetStudent)}
                >
                   <Text style={[styles.targetBtnText, !targetStudent && { color: themeColors.subText }]}>STUDENTS</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.targetBtn, targetStaff && { backgroundColor: '#10B981' }]} 
                   onPress={() => setTargetStaff(!targetStaff)}
                >
                   <Text style={[styles.targetBtnText, !targetStaff && { color: themeColors.subText }]}>FACULTY</Text>
                </TouchableOpacity>
             </View>

             <TouchableOpacity style={[styles.imagePicker, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#6366F1" />
                <Text style={styles.imagePickerText}>{image ? "Change Selected Image" : "Attach Descriptive Banner"}</Text>
             </TouchableOpacity>

             {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

             <TouchableOpacity style={styles.publishBtn} onPress={handlePost}>
                <Text style={styles.publishBtnText}>{editingId ? "SAVE UPDATES" : "BROADCAST NOW"}</Text>
             </TouchableOpacity>
             <View style={{ height: 50 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
     flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
     paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  backBtn: { padding: 4 },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },

  searchBlock: { padding: 20, paddingBottom: 0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600' },

  tabListHeader: { paddingVertical: 20 },
  tabScroll: { paddingHorizontal: 20, gap: 10 },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  activeTab: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  tabText: { fontSize: 12, fontWeight: '800' },

  listBody: { paddingHorizontal: 20, paddingBottom: 110 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  nCard: { borderRadius: 28, padding: 20, marginBottom: 20, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  nHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  nBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6 },
  nBadgeText: { fontSize: 10, fontWeight: '900' },
  nDate: { fontSize: 11, fontWeight: '700' },
  nTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  nContent: { fontSize: 14, lineHeight: 22, opacity: 0.8 },
  nImage: { width: '100%', height: 180, borderRadius: 20, marginTop: 15 },
  nAudience: { flexDirection: 'row', gap: 8, marginTop: 15 },
  aTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  nFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1 },
  nAuthor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorImg: { width: 22, height: 22, borderRadius: 11 },
  nAuthorName: { fontSize: 11, fontWeight: '700' },
  nActions: { flexDirection: 'row', gap: 15 },
  nActionBtn: { padding: 4 },

  emptyWrap: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, fontWeight: '600', marginTop: 20, textAlign: 'center', marginHorizontal: 40 },

  modalArea: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeModal: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  formBody: { padding: 25 },
  formLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#9CA3AF', marginBottom: 12 },
  formInput: { fontSize: 18, fontWeight: '700', paddingBottom: 10, borderBottomWidth: 1 },
  formInputAlt: { fontSize: 15, fontWeight: '600', padding: 20, borderRadius: 24, borderWidth: 1, height: 180, textAlignVertical: 'top' },
  targetRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  targetBtn: { flex: 1, height: 50, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center' },
  targetBtnText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  imagePicker: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  imagePickerText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  imagePreview: { width: '100%', height: 200, borderRadius: 24, marginBottom: 25 },
  publishBtn: { backgroundColor: '#6366F1', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  publishBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});
