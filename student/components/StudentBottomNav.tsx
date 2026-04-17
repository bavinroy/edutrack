// components/StudentBottomNav.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function StudentBottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { isDark, theme: themeColors } = useTheme();

    const handleNav = (path: string) => {
        router.push(path as any);
    };

    const isActive = (path: string) => {
        if (path === "/student/dashboard") return pathname === path;
        return pathname.startsWith(path);
    };

    const NavIcon = ({ path, icon, activeIcon, label }: { path: string, icon: any, activeIcon: any, label: string }) => {
        const active = isActive(path);
        return (
            <TouchableOpacity onPress={() => handleNav(path)} style={styles.navItem} activeOpacity={0.7}>
                <View style={[styles.iconBox, active && { backgroundColor: isDark ? '#3B82F630' : '#EFF6FF' }]}>
                    <Ionicons
                        name={active ? activeIcon : icon}
                        size={22}
                        color={active ? '#3B82F6' : themeColors.subText}
                    />
                </View>
                <Text style={[styles.navLab, { color: active ? '#3B82F6' : themeColors.subText }]}>{label}</Text>
                {active && <View style={[styles.activeDot, { backgroundColor: '#3B82F6' }]} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.navBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
                <NavIcon path="/student/dashboard" icon="home-outline" activeIcon="home" label="Home" />
                <NavIcon path="/student/documents" icon="journal-outline" activeIcon="journal" label="Documents" />
                <NavIcon path="/student/notice" icon="notifications-outline" activeIcon="notifications" label="Notices" />
                <NavIcon path="/student/downloads" icon="cloud-download-outline" activeIcon="cloud-download" label="Downloads" />
                <NavIcon path="/student/profile" icon="person-outline" activeIcon="person" label="Profile" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        zIndex: 1000,
    },
    navBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 75,
        borderTopWidth: 1,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 20,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    iconBox: {
        width: 40,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    navLab: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        bottom: -8,
    }
});
