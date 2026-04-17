// app/dept_admin/timetable_view.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function DeptAdminTimetableView() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isDark, theme: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<any>(null);

  useEffect(() => {
    if (id) fetchTimetable();
  }, [id]);

  const fetchTimetable = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimetable(data);
      } else {
        Alert.alert("Error", "Could not retrieve schedule details.");
      }
    } catch (e) {
      console.log("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  if (!timetable || !timetable.grid) {
      return (
          <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
              <Text style={{ color: themeColors.text }}>No data found.</Text>
              <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                  <Text style={{ color: '#6366F1' }}>Go Back</Text>
              </TouchableOpacity>
          </View>
      );
  }

  const { grid } = timetable;
  const { metadata, courses, gridData, rowHeaders, colHeaders, collegeName, docTitle } = grid;

  const renderGrid = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.gridContainer, { borderColor: themeColors.border }]}>
        {/* Header Row */}
        <View style={[styles.gridRow, { borderBottomColor: themeColors.border }]}>
          <View style={[styles.cell, styles.dayHeaderCell, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderRightColor: themeColors.border }]}>
            <Text style={[styles.gridHeaderText, { color: themeColors.text }]}>Day / Hour</Text>
          </View>
          {colHeaders.map((col: any, i: number) => (
            <React.Fragment key={i}>
              {/* Break Columns */}
              {i === 2 && (
                <View style={[styles.cell, styles.breakCol, { backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRightColor: themeColors.border, width: 30 }]}>
                   <View style={styles.verticalTextContainer}>
                    <Text style={[styles.verticalText, { color: themeColors.subText }]}>BREAK</Text>
                  </View>
                </View>
              )}
              {i === 4 && (
                <View style={[styles.cell, styles.breakCol, { backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRightColor: themeColors.border, width: 35 }]}>
                  <View style={styles.verticalTextContainer}>
                    <Text style={[styles.verticalText, { color: themeColors.subText }]}>LUNCH</Text>
                  </View>
                </View>
              )}
              {i === 6 && (
                <View style={[styles.cell, styles.breakCol, { backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRightColor: themeColors.border, width: 25 }]}>
                  <View style={styles.verticalTextContainer}>
                    <Text style={[styles.verticalText, { color: themeColors.subText, fontSize: 8 }]}>B</Text>
                  </View>
                </View>
              )}

              <View style={[styles.cell, styles.periodHeaderCell, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderRightColor: themeColors.border }]}>
                <Text style={[styles.periodNumber, { color: themeColors.text }]}>{col.label}</Text>
                <Text style={[styles.periodTime, { color: themeColors.subText }]}>{col.time}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Day Rows */}
        {rowHeaders.map((dayLabel: string, rIndex: number) => (
          <View key={rIndex} style={[styles.gridRow, { borderBottomColor: themeColors.border }]}>
            <View style={[styles.cell, styles.dayCell, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderRightColor: themeColors.border }]}>
              <Text style={[styles.dayText, { color: themeColors.text }]}>{dayLabel}</Text>
            </View>

            {colHeaders.map((_: any, cIndex: number) => {
              const currentAcronym = gridData[rIndex] ? gridData[rIndex][cIndex] : "";
              return (
                <React.Fragment key={cIndex}>
                  {cIndex === 2 && <View style={[styles.cell, styles.breakCol, { borderRightColor: themeColors.border, width: 30 }]} />}
                  {cIndex === 4 && <View style={[styles.cell, styles.breakCol, { borderRightColor: themeColors.border, width: 35 }]} />}
                  {cIndex === 6 && <View style={[styles.cell, styles.breakCol, { borderRightColor: themeColors.border, width: 25 }]} />}

                  <View style={[styles.cell, styles.contentCell, { borderRightColor: themeColors.border }]}>
                    <Text style={[styles.cellContentText, { color: themeColors.text }]}>{currentAcronym}</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>View Schedule</Text>
          <Text style={[styles.headerSub, { color: themeColors.subText }]}>INSPECTION MODE</Text>
        </View>
        <TouchableOpacity onPress={fetchTimetable} style={[styles.refreshBtn, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="refresh" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.collegeName, { color: '#EF4444' }]}>{collegeName || "SELVAM COLLEGE OF TECHNOLOGY"}</Text>
              <Text style={[styles.deptName, { color: themeColors.text }]}>Department of {metadata.department}</Text>
              <Text style={[styles.docTitle, { color: themeColors.subText }]}>{docTitle}</Text>
              
              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
              
              <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>ACADEMIC YEAR</Text>
                      <Text style={[styles.metaVal, { color: themeColors.text }]}>{metadata.academicYear}</Text>
                  </View>
                  <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>YEAR / SEM</Text>
                      <Text style={[styles.metaVal, { color: themeColors.text }]}>{metadata.year} / {metadata.semester}</Text>
                  </View>
                  <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>DEGREE</Text>
                      <Text style={[styles.metaVal, { color: themeColors.text }]}>{metadata.degree}</Text>
                  </View>
                  <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>SEC / ROOM</Text>
                      <Text style={[styles.metaVal, { color: themeColors.text }]}>{metadata.section} - {metadata.roomNo}</Text>
                  </View>
              </View>
          </View>

          {/* Grid section */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>WEEKLY GRID</Text>
          {renderGrid()}

          {/* Allocation table */}
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 30 }]}>SUBJECT MAPPING</Text>
          {courses.map((c: any, i: number) => (
              <View key={i} style={[styles.courseCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.courseHeader}>
                      <View style={[styles.badge, { backgroundColor: '#6366F115' }]}><Text style={{color: '#6366F1', fontWeight: '900'}}>{c.acronym}</Text></View>
                      <View style={{ flex: 1, marginLeft: 15 }}>
                          <Text style={[styles.courseName, { color: themeColors.text }]}>{c.name}</Text>
                          <Text style={[styles.courseCode, { color: themeColors.subText }]}>{c.code} • {c.periodsPerWeek} Hrs/Wk</Text>
                      </View>
                  </View>
                  <View style={[styles.facultyBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                      <Ionicons name="person-outline" size={14} color="#6366F1" />
                      <Text style={[styles.facultyName, { color: themeColors.text }]}>{c.faculty}</Text>
                  </View>
              </View>
          ))}
          
          <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitleBox: { flex: 1, marginLeft: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { padding: 20 },
  infoCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 25 },
  collegeName: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 5 },
  deptName: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  docTitle: { fontSize: 11, fontWeight: '700', textAlign: 'center', opacity: 0.7 },
  divider: { height: 1, marginVertical: 15, opacity: 0.5 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  metaItem: { width: (width - 90) / 2 },
  metaLabel: { fontSize: 9, fontWeight: '900', color: '#999', marginBottom: 4 },
  metaVal: { fontSize: 13, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, opacity: 0.5 },
  
  gridContainer: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1 },
  cell: { justifyContent: 'center', alignItems: 'center', padding: 5, borderRightWidth: 1 },
  dayHeaderCell: { width: 60, height: 50 },
  gridHeaderText: { fontSize: 9, fontWeight: '900', textAlign: 'center' },
  periodHeaderCell: { width: 100, height: 50 },
  periodNumber: { fontSize: 12, fontWeight: '900' },
  periodTime: { fontSize: 8, textAlign: 'center', marginTop: 2 },
  dayCell: { width: 60, height: 45 },
  dayText: { fontSize: 11, fontWeight: '900' },
  contentCell: { width: 100, height: 45, backgroundColor: 'transparent' },
  cellContentText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  breakCol: { alignItems: 'center', justifyContent: 'center' },
  verticalTextContainer: { transform: [{ rotate: '-90deg' }], width: 45, height: 100, alignItems: 'center', justifyContent: 'center' },
  verticalText: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },

  courseCard: { borderRadius: 20, padding: 15, borderWidth: 1, marginBottom: 12 },
  courseHeader: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  courseName: { fontSize: 14, fontWeight: '800' },
  courseCode: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  facultyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, marginTop: 12 },
  facultyName: { fontSize: 12, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
