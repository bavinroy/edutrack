import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    TextInput,
    Alert,
    FlatList,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Dimensions,
    Modal,
    KeyboardAvoidingView,
    Platform,
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";
import DeptAdminBottomNav from "../../components/DeptAdminBottomNav";

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

export default function DeptAdminNoticeScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [composeVisible, setComposeVisible] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [targetStaff, setTargetStaff] = useState(true);
    const [targetStudent, setTargetStudent] = useState(true);

    const fetchNotices = async (isRef = false) => {
        if (!isRef) setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return;
            const res = await axios.get(`${API_BASE_URL}/api/accounts/notice/list/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotices(res.data);
        } catch (err) {
            console.error("Notice fetch error", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchNotices(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotices(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const handleSubmit = async () => {
        if (!title || !content) return Alert.alert("Validation", "Title and content are required.");

        setIsPosting(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", content);
            formData.append("target_staff", String(targetStaff));
            formData.append("target_student", String(targetStudent));
            formData.append("target_dept_admin", "false");

            if (image) {
                formData.append("image", {
                    uri: image,
                    type: "image/jpeg",
                    name: "notice_attachment.jpg"
                } as any);
            }

            await axios.post(`${API_BASE_URL}/api/accounts/notice/create/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                },
            });

            Alert.alert("Success", "Notice has been broadcasted.");
            setComposeVisible(false);
            setTitle(""); setContent(""); setImage(null);
            fetchNotices();
        } catch (err) {
            Alert.alert("Oops", "Broadcast failed. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert("Erase Notice", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Erase", style: "destructive", onPress: async () => {
                    const token = await AsyncStorage.getItem("accessToken");
                    try {
                        await axios.delete(`${API_BASE_URL}/api/accounts/notice/${id}/delete/`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        fetchNotices();
                    } catch (err) {
                        Alert.alert("Error", "Could not remove the notice.");
                    }
                }
            }
        ]);
    };

    const renderNotice = ({ item }: { item: Notice }) => (
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.cardHeader}>
                <View style={styles.authorGroup}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: '#6366F120' }]}>
                        <Text style={[styles.avatarTxt, { color: '#6366F1' }]}>{item.author_name[0]}</Text>
                    </View>
                    <View>
                        <Text style={[styles.authorName, { color: themeColors.text }]}>{item.author_name}</Text>
                        <Text style={[styles.dateText, { color: themeColors.subText }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
                {item.can_delete && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[styles.noticeTitle, { color: '#6366F1' }]}>{item.title}</Text>
            <Text style={[styles.noticeContent, { color: themeColors.text }]}>{item.content}</Text>

            {item.image && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image }} style={styles.noticeImage} resizeMode="cover" />
                </View>
            )}

            <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                <View style={styles.audienceRow}>
                    {item.target_staff && (
                        <View style={[styles.tag, { backgroundColor: '#6366F115' }]}>
                            <Text style={[styles.tagTxt, { color: '#6366F1' }]}>STAFF</Text>
                        </View>
                    )}
                    {item.target_student && (
                        <View style={[styles.tag, { backgroundColor: '#10B98115' }]}>
                            <Text style={[styles.tagTxt, { color: '#10B981' }]}>STUDENTS</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.interactBtn}>
                    <Ionicons name="stats-chart" size={14} color={themeColors.subText} />
                    <Text style={[styles.interactTxt, { color: themeColors.subText }]}>Stats</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>Broadcasts</Text>
                <TouchableOpacity onPress={() => onRefresh()}>
                    <Ionicons name="megaphone-outline" size={24} color={themeColors.text} />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
            ) : (
                <FlatList
                    data={notices}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderNotice}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]} />}
                    ListHeaderComponent={
                        <View style={styles.heroSection}>
                            <Text style={[styles.heroTitle, { color: themeColors.text }]}>Department Feed</Text>
                            <Text style={[styles.heroDesc, { color: themeColors.subText }]}>Official announcements and critical alerts issued to your unit.</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="broadcast-off" size={80} color={themeColors.border} />
                            <Text style={[styles.emptyText, { color: themeColors.subText }]}>No active broadcasts currently running.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setComposeVisible(true)}
                activeOpacity={0.9}
            >
                <Ionicons name="create" size={24} color="#fff" />
                <Text style={styles.fabText}>DRAFT NOTICE</Text>
            </TouchableOpacity>

            {/* Compose Modal */}
            <Modal visible={composeVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                        <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalHeaderTitle, { color: '#6366F1' }]}>NEW PUBLIC BROADCAST</Text>
                                <TouchableOpacity onPress={() => setComposeVisible(false)}>
                                    <Ionicons name="close-circle" size={32} color={themeColors.subText} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>SUBJECT LINE</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                                        placeholder="Headline for this notice..."
                                        placeholderTextColor={themeColors.subText}
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: themeColors.subText }]}>CONTENT BODY</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: themeColors.text, borderColor: themeColors.border }]}
                                        placeholder="Detailed explanation..."
                                        placeholderTextColor={themeColors.subText}
                                        multiline
                                        value={content}
                                        onChangeText={setContent}
                                    />
                                </View>

                                <Text style={[styles.label, { color: themeColors.subText }]}>TARGET AUDIENCE</Text>
                                <View style={styles.chipRow}>
                                    <TouchableOpacity
                                        style={[styles.chip, targetStaff ? { backgroundColor: '#6366F1' } : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                                        onPress={() => setTargetStaff(!targetStaff)}
                                    >
                                        <Ionicons name="people" size={16} color={targetStaff ? '#fff' : themeColors.subText} />
                                        <Text style={[styles.chipText, { color: targetStaff ? '#fff' : themeColors.subText }]}>STAFF</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.chip, targetStudent ? { backgroundColor: '#10B981' } : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                                        onPress={() => setTargetStudent(!targetStudent)}
                                    >
                                        <Ionicons name="school" size={16} color={targetStudent ? '#fff' : themeColors.subText} />
                                        <Text style={[styles.chipText, { color: targetStudent ? '#fff' : themeColors.subText }]}>STUDENTS</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={[styles.imagePicker, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: themeColors.border }]} onPress={pickImage}>
                                    {image ? (
                                        <Image source={{ uri: image }} style={styles.previewImg} />
                                    ) : (
                                        <View style={styles.imgPlaceholder}>
                                            <Ionicons name="camera-outline" size={32} color="#6366F1" />
                                            <Text style={[styles.imgPlaceholderTxt, { color: themeColors.subText }]}>Attach Media Item</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.broadcastBtn, { backgroundColor: '#6366F1' }, isPosting && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={isPosting}
                                >
                                    {isPosting ? <ActivityIndicator color="#fff" /> :
                                        <>
                                            <Text style={styles.broadcastTxt}>TRANSMIT NOW</Text>
                                            <Ionicons name="paper-plane" size={18} color="#fff" />
                                        </>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            
            <DeptAdminBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },

    listContent: { padding: 20, paddingBottom: 120 },
    heroSection: { marginBottom: 30 },
    heroTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    heroDesc: { fontSize: 13, marginTop: 6, lineHeight: 20, opacity: 0.8 },

    card: { borderRadius: 28, padding: 22, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    authorGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 18, fontWeight: '900' },
    authorName: { fontSize: 16, fontWeight: '800' },
    dateText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    deleteBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },

    noticeTitle: { fontSize: 19, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
    noticeContent: { fontSize: 15, lineHeight: 24, marginBottom: 18, opacity: 0.9 },
    imageContainer: { borderRadius: 24, overflow: 'hidden', marginBottom: 18 },
    noticeImage: { width: '100%', height: 220 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 18 },
    audienceRow: { flexDirection: 'row', gap: 10 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    tagTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    interactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    interactTxt: { fontSize: 12, fontWeight: '800' },

    fab: { 
        position: 'absolute', bottom: 100, alignSelf: 'center', 
        backgroundColor: '#6366F1', height: 60, borderRadius: 30, 
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, 
        elevation: 10, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.4, shadowRadius: 15 
    },
    fabText: { color: '#fff', fontWeight: '900', marginLeft: 10, fontSize: 13, letterSpacing: 1 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 28, height: '90%', elevation: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    modalHeaderTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },

    inputGroup: { marginBottom: 25 },
    label: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
    input: { borderRadius: 20, padding: 18, fontSize: 15, borderWidth: 1 },
    textArea: { height: 160, textAlignVertical: 'top' },

    chipRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50, borderRadius: 15 },
    chipText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    imagePicker: { height: 150, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 30, overflow: 'hidden' },
    imgPlaceholder: { alignItems: 'center', gap: 10 },
    imgPlaceholderTxt: { fontSize: 14, fontWeight: '700' },
    previewImg: { width: '100%', height: '100%' },

    broadcastBtn: { height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, elevation: 8 },
    broadcastTxt: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 15, fontWeight: '600', marginTop: 20, textAlign: 'center', paddingHorizontal: 50 }
});
