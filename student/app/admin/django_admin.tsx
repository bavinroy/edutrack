
import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function DjangoAdminScreen() {
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);

    const adminUrl = `${API_BASE_URL}/admin/`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#00B9BD" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>System Admin</Text>
                <TouchableOpacity onPress={() => webViewRef.current?.reload()}>
                    <Ionicons name="refresh" size={24} color="#00B9BD" />
                </TouchableOpacity>
            </View>

            <View style={styles.webviewContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: adminUrl }}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    style={{ flex: 1 }}
                />
                {loading && (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#00B9BD" />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        height: 50,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#00B9BD',
        marginLeft: 5,
        fontSize: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    webviewContainer: {
        flex: 1,
        position: 'relative',
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
});
