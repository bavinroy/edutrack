// app/dept_admin/django_admin.tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import { useTheme } from '../../context/ThemeContext';
import EduLoading from '../../components/EduLoading';
import DeptAdminBottomNav from '../../components/DeptAdminBottomNav';

const { width } = Dimensions.get("window");

export default function DeptAdminDjangoAdminScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);

    const adminUrl = `${API_BASE_URL}/admin/`;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
            
            <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Admin Console</Text>
                    <View style={styles.systemStatus}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusTxt}>PROTECTED SESSION</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => webViewRef.current?.reload()} style={[styles.refreshBtn, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name="sync" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            <View style={styles.terminal}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: adminUrl }}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    style={{ flex: 1, backgroundColor: themeColors.bg }}
                    incognito={false}
                />
                {loading && (
                    <View style={[styles.scrim, { backgroundColor: themeColors.bg }]}>
                        <EduLoading size={60} />
                        <Text style={[styles.scrimTxt, { color: themeColors.subText }]}>Initializing Secure Link...</Text>
                    </View>
                )}
            </View>

            <View style={[styles.protocolFooter, { backgroundColor: themeColors.headerBg, borderTopColor: themeColors.border }]}>
                <MaterialCommunityIcons name="shield-lock" size={14} color="#10B981" />
                <Text style={[styles.protocolTxt, { color: '#10B981' }]}>ENCRYPTED HOD GATEWAY ACTIVE</Text>
            </View>

            <DeptAdminBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitleBox: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    systemStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    statusTxt: { fontSize: 8, fontWeight: '900', color: '#10B981', letterSpacing: 1 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    terminal: { flex: 1, position: 'relative' },
    scrim: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 15 },
    scrimTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

    protocolFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderTopWidth: 1 },
    protocolTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 1 }
});
