import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

export default function StaffBiodataScreen() {
    const { staffId } = useLocalSearchParams();
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (staffId) fetchStaffProfile();
    }, [staffId]);

    const fetchStaffProfile = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await axios.get(`${API_BASE_URL}/api/staff/profile/${staffId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
        } catch (err) {
            console.error("Staff profile error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
                <EduLoading size={60} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
                <Text style={{ color: themeColors.text }}>Dossier not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: "#6366F1" }}>Return to Registry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const initials = (profile.first_name?.[0] || profile.username?.[0] || "S").toUpperCase();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>Staff Intel</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Profile Identity Card */}
                <View style={[styles.profileCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={styles.avatarContainer}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: '#6366F120' }]}>
                                <Text style={styles.avatarTxt}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="shield-checkmark" size={14} color="#fff" />
                        </View>
                    </View>

                    <Text style={[styles.name, { color: themeColors.text }]}>
                        {profile.first_name} {profile.last_name}
                    </Text>
                    <Text style={[styles.designation, { color: themeColors.subText }]}>
                        {profile.designation || "Senior Faculty Member"}
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={[styles.statLabel, { color: themeColors.subText }]}>ROLE</Text>
                            <Text style={[styles.statVal, { color: themeColors.text }]}>
                                {profile.role?.replace("DEPT_", "").replace("_", " ")}
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statLabel, { color: themeColors.subText }]}>DEPT</Text>
                            <Text style={[styles.statVal, { color: themeColors.text }]}>
                                {profile.department || "Engineering"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Professional Details Section */}
                <Text style={styles.sectionLabel}>CORE CREDENTIALS</Text>
                <View style={[styles.infoGrid, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <InfoItem icon="mail" label="Institutional Email" value={profile.email} color="#EF4444" />
                    <InfoItem icon="call" label="Mobile Contact" value={profile.phone_number || "Confidential"} color="#10B981" />
                    <InfoItem icon="finger-print" label="Terminal Access ID" value={profile.username?.toUpperCase()} color="#F59E0B" />
                    <InfoItem icon="calendar" label="Date of Activation" value={profile.date_joined || "N/A"} color="#6366F1" bottom />
                </View>

                {/* Actions */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#6366F115' }]}
                        onPress={() => Linking.openURL(`mailto:${profile.email}`)}
                    >
                        <Ionicons name="mail" size={24} color="#6366F1" />
                        <Text style={[styles.actionLabel, { color: '#6366F1' }]}>Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#10B98115' }]}
                        onPress={() => {
                            if (profile.phone_number) Linking.openURL(`tel:${profile.phone_number}`);
                        }}
                    >
                        <Ionicons name="call" size={24} color="#10B981" />
                        <Text style={[styles.actionLabel, { color: '#10B981' }]}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#8B5CF615' }]}>
                        <Ionicons name="chatbox-ellipses" size={24} color="#8B5CF6" />
                        <Text style={[styles.actionLabel, { color: '#8B5CF6' }]}>Message</Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Info */}
                <Text style={styles.sectionLabel}>SYSTEM METADATA</Text>
                <View style={[styles.metaCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={styles.metaRow}>
                        <Ionicons name="server" size={16} color={themeColors.subText} />
                        <Text style={[styles.metaTxt, { color: themeColors.subText }]}>Profile Object ID: {profile.id}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="time" size={16} color={themeColors.subText} />
                        <Text style={[styles.metaTxt, { color: themeColors.subText }]}>Last Synchronization: Healthy</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoItem({ icon, label, value, color, bottom }: any) {
    const { theme: themeColors } = useTheme();
    return (
        <View style={[styles.infoRow, !bottom && { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: themeColors.subText }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]} numberOfLines={1}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60, borderBottomWidth: 1 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },

    scroll: { padding: 20, paddingBottom: 40 },
    profileCard: { borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 1, marginBottom: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    avatarContainer: { position: 'relative', marginBottom: 20 },
    avatar: { width: 120, height: 120, borderRadius: 45, borderWidth: 4, borderColor: '#6366F130' },
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 50, fontWeight: '900', color: '#6366F1' },
    verifiedBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#6366F1', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },

    name: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
    designation: { fontSize: 13, fontWeight: '700', marginTop: 5, textTransform: 'uppercase' },

    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 25, width: '100%' },
    statBox: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 40 },
    statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
    statVal: { fontSize: 14, fontWeight: '800' },

    sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, color: '#6366F1', marginBottom: 15, marginLeft: 5 },
    infoGrid: { borderRadius: 24, padding: 10, borderWidth: 1, marginBottom: 30 },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    infoContent: { flex: 1, marginLeft: 15 },
    infoLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    infoValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },

    actionGrid: { flexDirection: 'row', gap: 15, marginBottom: 35 },
    actionCard: { flex: 1, height: 90, borderRadius: 24, justifyContent: 'center', alignItems: 'center', gap: 8 },
    actionLabel: { fontSize: 12, fontWeight: '900' },

    metaCard: { borderRadius: 20, padding: 20, borderWidth: 1, gap: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metaTxt: { fontSize: 11, fontWeight: '700' }
});
