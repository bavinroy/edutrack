import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function StaffBottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { isDark, theme: themeColors } = useTheme();

    const handleNav = (path: string) => {
        router.push(path as any);
    };

    const isActive = (path: string) => {
        if (pathname === path) return true;
        // Handle cases like "/staff/attendance/[id]"
        if (path !== "/staff/dashboard" && pathname.startsWith(path)) return true;
        return false;
    };

    const NavIcon = ({ path, icon, activeIcon, label }: { path: string, icon: any, activeIcon: any, label: string }) => {
        const active = isActive(path);
        return (
            <TouchableOpacity onPress={() => handleNav(path)} style={styles.navItem} activeOpacity={0.7}>
                <View style={[styles.iconBox, active && { backgroundColor: isDark ? '#6366F130' : '#EEF2FF' }]}>
                    <Ionicons
                        name={active ? activeIcon : icon}
                        size={22}
                        color={active ? '#6366F1' : isDark ? '#64748B' : '#94A3B8'}
                    />
                </View>
                <Text style={[styles.navLab, { color: active ? '#6366F1' : isDark ? '#64748B' : '#94A3B8' }]}>{label}</Text>
                {active && <View style={[styles.activeDot, { backgroundColor: '#6366F1' }]} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.navBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
                <NavIcon path="/staff/dashboard" icon="home-outline" activeIcon="home" label="Home" />
                <NavIcon path="/staff/attendance" icon="book-outline" activeIcon="book" label="Attendance" />
                <NavIcon path="/staff/notice" icon="megaphone-outline" activeIcon="megaphone" label="Notices" />
                <NavIcon path="/staff/documents" icon="folder-outline" activeIcon="folder" label="Library" />
                <NavIcon path="/staff/profile" icon="person-outline" activeIcon="person" label="Profile" />
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
        height: Platform.OS === 'ios' ? 90 : 75,
        borderTopWidth: 1,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 25 : 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 20,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 65,
    },
    iconBox: {
        width: 44,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    navLab: {
        fontSize: 8,
        fontWeight: '900',
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
