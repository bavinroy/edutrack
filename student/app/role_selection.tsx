
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RoleSelectionScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                {/* Border Frame (Simulated by container padding or border view) */}

                {/* Icons and Buttons */}
                <View style={styles.roleContainer}>
                    {/* Student */}
                    <View style={styles.roleItem}>
                        <Ionicons name="person" size={80} color="#333" />
                        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: "/login", params: { role: 'student' } })}>
                            <Text style={styles.buttonText}>STUDENT LOGIN</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Staff */}
                    <View style={styles.roleItem}>
                        <Ionicons name="person-circle-outline" size={80} color="#000" />
                        <View style={styles.bookIconOverlay}>
                            {/* Optional overlay icon for "book" effect if needed, using unicode or another icon overlapping */}
                        </View>
                        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: "/login", params: { role: 'staff' } })}>
                            <Text style={styles.buttonText}>STAFF LOGIN</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Admin */}
                    <View style={styles.roleItem}>
                        <Ionicons name="settings" size={80} color="#000" />
                        <View style={styles.tieIconOverlay}>
                            {/* Optional overlay for "tie" effect */}
                        </View>
                        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: "/login", params: { role: 'admin' } })}>
                            <Text style={styles.buttonText}>ADMIN LOGIN</Text>
                        </TouchableOpacity>
                    </View>

                </View>

                {/* Decorative Borders (Corner Doodles) - Using absolute positioning for simplicity */}
                {/* Top Left */}
                <Image source={require("../assets/images/background.jpeg")} style={[styles.doodle, styles.topLeft]} resizeMode="cover" />
                {/* Note: User provided a doodle image, but I don't have it as an asset yet. 
                   I will use a white background or a placeholder border.*/}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    roleContainer: {
        alignItems: 'center',
        justifyContent: 'space-evenly', // Distribute items evenly
        height: '80%', // Occupy most of the screen
        width: '100%',
    },
    roleItem: {
        alignItems: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#30c7b6', // Teal color from image
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginTop: 15,
        minWidth: 200,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    doodle: {
        position: 'absolute',
        width: 100,
        height: 100,
        opacity: 0.1 // Just a subtle touch if using existing background
    },
    topLeft: { top: 0, left: 0 },

    // Placeholder overlays for specific icons if needed
    bookIconOverlay: {},
    tieIconOverlay: {}
});
