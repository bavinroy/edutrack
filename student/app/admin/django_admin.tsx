import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function DjangoAdminScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);

    const adminUrl = `${API_BASE_URL}/admin/`;

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
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Admin Portal</Text>
                        <View style={styles.systemStatus}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusTxt}>SYSTEM ONLINE</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => webViewRef.current?.reload()} style={styles.refreshBtn}>
                        <Ionicons name="sync" size={20} color="#6366F1" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.terminal, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
                    <WebView
                        ref={webViewRef}
                        source={{ uri: adminUrl }}
                        onLoadStart={() => setLoading(true)}
                        onLoadEnd={() => setLoading(false)}
                        style={{ flex: 1, backgroundColor: 'transparent' }}
                        incognito={false}
                    />
                    {loading && (
                        <View style={[styles.scrim, { backgroundColor: themeColors.bg }]}>
                            <ActivityIndicator size="large" color="#6366F1" />
                            <Text style={[styles.scrimTxt, { color: themeColors.subText }]}>Opening Admin Portal...</Text>
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={[styles.protocolFooter, { backgroundColor: themeColors.headerBg, borderTopColor: themeColors.border }]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={16} color="#6366F1" />
                    <Text style={[styles.protocolTxt, { color: themeColors.subText }]}>SECURE CONNECTION ACTIVE</Text>
                </View>
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
    systemStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    statusTxt: { fontSize: 8, fontWeight: '900', color: '#10B981', letterSpacing: 1 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

    terminal: { flex: 1, position: 'relative' },
    scrim: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 15 },
    scrimTxt: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

    protocolFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderTopWidth: 1 },
    protocolTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }
});
