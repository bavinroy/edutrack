import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

type TimeTable = {
  id: number;
  title: string;
  class_name: string;
  section: string;
  year: string;
  grid: {
    gridData: string[][];
    rowHeaders: string[];
    colHeaders: { label: string; time: string }[];
    courses?: any[];
    metadata?: any;
    collegeName?: string;
    docTitle?: string;
  };
};

export default function StudentTimetable() {
  const [timetables, setTimetables] = useState<TimeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TimeTable | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(-1);
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  useEffect(() => {
    fetchTimetables();
    const day = new Date().getDay(); 
    if (day >= 1 && day <= 6) setCurrentDayIndex(day - 1);
    else setCurrentDayIndex(-1);
  }, []);

  const getUsedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (selected?.grid?.gridData) {
      selected.grid.gridData.forEach((row) => {
        row.forEach((acronym) => {
          if (acronym) counts[acronym] = (counts[acronym] || 0) + 1;
        });
      });
    }
    return counts;
  }, [selected]);

  const fetchTimetables = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/accounts/student/timetables/`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTimetables(data);
        if (data.length > 0) setSelected(data[0]);
      }
    } catch (err) { }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Time Table</Text>
          <View style={{ width: 40 }} />
        </View>

        {!selected ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={themeColors.subText} />
            <Text style={[styles.emptyText, { color: themeColors.subText }]}>No published timetable found for your department.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Header Card */}
            <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.collegeName, { color: themeColors.subText }]}>{selected.grid.collegeName || "Institution Name"}</Text>
                <Text style={[styles.docTitle, { color: themeColors.text }]}>{selected.grid.docTitle || "CLASS TIME TABLE"}</Text>
                
                <View style={[styles.metaGrid, { borderTopColor: themeColors.border }]}>
                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: themeColors.subText }]}>YEAR/SEM</Text>
                        <Text style={[styles.metaValue, { color: themeColors.text }]}>{selected.grid.metadata?.year} / {selected.grid.metadata?.semester}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: themeColors.subText }]}>SECTION</Text>
                        <Text style={[styles.metaValue, { color: themeColors.text }]}>{selected.grid.metadata?.section}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: themeColors.subText }]}>ROOM</Text>
                        <Text style={[styles.metaValue, { color: themeColors.text }]}>{selected.grid.metadata?.roomNo || "N/A"}</Text>
                    </View>
                </View>
            </View>

            {/* Timetable Grid */}
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Weekly Schedule</Text>
            <View style={[styles.tableCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* Column Headers */}
                        <View style={[styles.tableRow, { borderBottomColor: themeColors.border }]}>
                            <View style={[styles.cell, styles.headerCell, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]} />
                            {selected.grid.colHeaders.map((col, idx) => (
                                <View key={idx} style={[styles.cell, styles.headerCell, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]}>
                                    <Text style={[styles.headerTxt, { color: themeColors.text }]}>{col.label}</Text>
                                    <Text style={[styles.timeTxt, { color: themeColors.subText }]}>{col.time}</Text>
                                </View>
                            ))}
                        </View>
                        
                        {/* Table Data */}
                        {selected.grid.gridData.map((rowData, rowIdx) => (
                            <View key={rowIdx} style={[styles.tableRow, { borderBottomColor: themeColors.border }, currentDayIndex === rowIdx && { backgroundColor: isDark ? '#3B82F630' : '#EFF6FF' }]}>
                                <View style={[styles.cell, styles.dayCell, { borderRightColor: themeColors.border }]}>
                                    <Text style={[styles.dayTxt, { color: themeColors.text }, currentDayIndex === rowIdx && { color: '#3B82F6' }]}>{selected.grid.rowHeaders[rowIdx].substring(0, 3)}</Text>
                                </View>
                                {rowData.map((cellData, cellIdx) => (
                                    <View key={cellIdx} style={[styles.cell, { borderRightColor: themeColors.border }]}>
                                        <Text style={[styles.cellTxt, { color: themeColors.text }]}>{cellData || "-"}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Legend */}
            {selected.grid.courses && selected.grid.courses.length > 0 && (
                <>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Course Details</Text>
                    <View style={styles.legendGrid}>
                        {selected.grid.courses.map((course, idx) => (
                            <View key={idx} style={[styles.courseCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                                <View style={[styles.acronymBox, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                                    <Text style={[styles.acronym, { color: themeColors.text }]}>{course.acronym}</Text>
                                </View>
                                <View style={styles.courseInfo}>
                                    <Text style={[styles.courseName, { color: themeColors.text }]}>{course.name}</Text>
                                    <Text style={[styles.teacherName, { color: themeColors.subText }]}>{course.teacher}</Text>
                                    <View style={styles.statRow}>
                                        <Ionicons name="time-outline" size={12} color="#3B82F6" />
                                        <Text style={styles.countTxt}>{getUsedCounts[course.acronym] || 0} sessions/week</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </>
            )}
          </ScrollView>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  backBtn: { padding: 4 },
  
  scrollBody: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
  
  infoCard: { borderRadius: 24, padding: 24, marginBottom: 25, borderWidth: 1, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05 },
  collegeName: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  docTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1 },
  metaItem: { alignItems: 'flex-start' },
  metaLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 15, marginLeft: 5 },
  tableCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, marginBottom: 25 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1 },
  cell: { width: 100, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  headerCell: { height: 60 },
  headerTxt: { fontSize: 12, fontWeight: '800' },
  timeTxt: { fontSize: 10, fontWeight: '600' },
  dayCell: { width: 60, borderRightWidth: 1 },
  dayTxt: { fontSize: 13, fontWeight: '900' },
  cellTxt: { fontSize: 12, fontWeight: '700' },

  legendGrid: { marginBottom: 20 },
  courseCard: { flexDirection: 'row', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, alignItems: 'center' },
  acronymBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  acronym: { fontSize: 14, fontWeight: '800' },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  teacherName: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countTxt: { fontSize: 11, fontWeight: '600', color: '#3B82F6' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { marginTop: 15, textAlign: 'center', paddingHorizontal: 40, fontSize: 14, fontWeight: '500' }
});
