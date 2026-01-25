
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
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";

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
  const [showMenu, setShowMenu] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(-1);

  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    fetchTimetables();

    // Determine today's row index (Mon=0, Sat=5)
    // Adjust logic if rowHeaders are customizable, but typically Mon-Sat
    const day = new Date().getDay(); // 0=Sun, 1=Mon, ...
    if (day >= 1 && day <= 6) {
      setCurrentDayIndex(day - 1);
    } else {
      setCurrentDayIndex(-1); // Sunday
    }

  }, []);

  // --- Helpers ---
  const getUsedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (selected && selected.grid && selected.grid.gridData) {
      selected.grid.gridData.forEach((row) => {
        row.forEach((acronym) => {
          if (acronym) {
            counts[acronym] = (counts[acronym] || 0) + 1;
          }
        });
      });
    }
    return counts;
  }, [selected]);

  const totalAllocated = Object.values(getUsedCounts).reduce((a, b) => a + b, 0);

  const fetchTimetables = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(
        `${API_BASE_URL}/api/accounts/student/timetables/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTimetables(data);
        if (data.length > 0) {
          setSelected(data[0]);
        }
      } else {
        setTimetables([]);
      }
    } catch (err) {
      console.log(err);
      // Alert.alert("Error", "Could not fetch timetables");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <ImageBackground
        source={require("../../assets/images/back.jpg")}
        style={styles.bg}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading timetables...</Text>
        </View>
      </ImageBackground>
    );
  }

  if (!selected) {
    return (
      <ImageBackground
        source={require("../../assets/images/back.jpg")}
        style={styles.bg}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#30e4de" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TIME TABLE</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.noText}>No published timetable found.</Text>
        </View>
      </ImageBackground>
    );
  }

  const { rowHeaders, colHeaders, gridData, courses, metadata, collegeName, docTitle } = selected.grid;

  // --- Render Sections ---

  const renderHeaderInfo = () => (
    <View style={styles.card}>
      <Text style={styles.collegeName}>{collegeName || "College Name"}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 5 }}>
        <Text style={styles.deptLabel}>Department of </Text>
        <Text style={[styles.deptLabel, { textDecorationLine: 'underline' }]}>{metadata?.department || "..."}</Text>
      </View>
      <Text style={styles.docTitle}>{docTitle || "CLASS TIME TABLE"}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Academic Year: <Text style={styles.metaVal}>{metadata?.academicYear}</Text></Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Year/Sem: <Text style={styles.metaVal}>{metadata?.year} / {metadata?.semester}</Text></Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Deg/Branch: <Text style={styles.metaVal}>{metadata?.degree} - {metadata?.department}</Text></Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Section: <Text style={styles.metaVal}>{metadata?.section}</Text></Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Room No: <Text style={styles.metaVal}>{metadata?.roomNo}</Text></Text>
        </View>
      </View>
    </View>
  );

  const renderAllocations = () => (
    <View style={[styles.card, { marginTop: 10 }]}>
      <Text style={styles.secTitle}>COURSE ALLOCATION</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.allocHeader}>
            <Text style={[styles.ahCell, { width: 40 }]}>S.No</Text>
            <Text style={[styles.ahCell, { width: 70 }]}>Code</Text>
            <Text style={[styles.ahCell, { width: 70 }]}>Acronym</Text>
            <Text style={[styles.ahCell, { width: 150 }]}>Course Name</Text>
            <Text style={[styles.ahCell, { width: 120 }]}>Faculty</Text>
            <Text style={[styles.ahCell, { width: 50 }]}>L/W</Text>
            <Text style={[styles.ahCell, { width: 50 }]}>Used</Text>
          </View>
          {courses?.map((c, i) => (
            <View key={i} style={styles.allocRow}>
              <Text style={[styles.aCell, { width: 40, textAlign: 'center' }]}>{i + 1}</Text>
              <Text style={[styles.aCell, { width: 70 }]}>{c.code}</Text>
              <Text style={[styles.aCell, { width: 70, fontWeight: 'bold' }]}>{c.acronym}</Text>
              <Text style={[styles.aCell, { width: 150 }]}>{c.name}</Text>
              <Text style={[styles.aCell, { width: 120 }]}>{c.faculty}</Text>
              <Text style={[styles.aCell, { width: 50, textAlign: 'center' }]}>{c.periodsPerWeek}</Text>
              <Text style={[styles.aCell, { width: 50, textAlign: 'center', fontWeight: 'bold', color: 'green' }]}>
                {getUsedCounts[c.acronym] || 0}
              </Text>
            </View>
          ))}
          <View style={styles.allocRow}>
            <Text style={[styles.aCell, { flex: 1, textAlign: 'right', fontWeight: 'bold', paddingRight: 10 }]}>Total Periods:</Text>
            <Text style={[styles.aCell, { width: 50, textAlign: 'center', fontWeight: 'bold' }]}>{totalAllocated}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ImageBackground
      source={require("../../assets/images/back.jpg")}
      style={styles.bg}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#30e4de" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TIME TABLE</Text>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Ionicons
            name={showMenu ? "chevron-up" : "chevron-down"}
            size={22}
            color="#30e4de"
          />
        </TouchableOpacity>
      </View>

      {/* Menu */}
      {showMenu && (
        <View style={styles.menuBox}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/downloads")}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Downloads</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/letter")}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Forms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push("/student/results")}
          >
            <Ionicons name="ribbon-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Results</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* 1. Header Info */}
        {renderHeaderInfo()}

        {/* 2. Grid */}
        <View style={[styles.card, { marginTop: 10 }]}>
          <ScrollView horizontal>
            <View>
              {/* Header Row */}
              <View style={[styles.row, styles.headerRow]}>
                <View style={[styles.cell, styles.dayCell]}>
                  <Text style={styles.headerText}>Day / Period</Text>
                </View>
                {colHeaders?.map((col, i) => (
                  <View key={i} style={[styles.cell, styles.periodCell]}>
                    <Text style={styles.headerText}>{col.label}</Text>
                    <Text style={{ fontSize: 9, textAlign: 'center', marginTop: 2 }}>{col.time}</Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {rowHeaders?.map((day, rIndex) => {
                const isToday = rIndex === currentDayIndex;
                const rowData = gridData ? gridData[rIndex] : [];

                return (
                  <View key={rIndex} style={[styles.row, isToday && styles.todayRow]}>
                    {/* Day Label */}
                    <View style={[styles.cell, styles.dayCell]}>
                      <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                    </View>

                    {/* Cells */}
                    {colHeaders?.map((_, cIndex) => {
                      const cellData = rowData ? rowData[cIndex] : "";
                      return (
                        <View key={cIndex} style={[styles.cell, styles.periodCell]}>
                          <Text style={styles.cellText}>{cellData || "---"}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 3. Allocations */}
        {renderAllocations()}

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons
          name="home"
          size={24}
          color="#fff"
          onPress={() => router.push("/student/dashboard")}
        />
        <Ionicons
          name="search"
          size={24}
          color="#fff"
          onPress={() => router.push("/student/search")}
        />
        <Ionicons
          name="grid-outline"
          size={24}
          color="#fff"
          onPress={() => router.push("/student/time table")}
        />
        <Ionicons
          name="download-outline"
          size={24}
          color="#fff"
          onPress={() => router.push("/student/downloads")}
        />
        <Ionicons
          name="person-circle-outline"
          size={24}
          color="#fff"
          onPress={() => router.push("/student/profile")}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: "cover" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#fff" },
  noText: { fontSize: 18, color: "#fff", fontWeight: "bold" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de" },

  menuBox: {
    backgroundColor: "#eff4f4ff",
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "80%",
    backgroundColor: "#30e4de",
    borderRadius: 8,
    marginVertical: 6,
    justifyContent: "center",
  },
  menuText: { color: "#fff", fontSize: 16, marginLeft: 8, fontWeight: "600" },

  card: { backgroundColor: 'rgba(255,255,255,0.95)', marginHorizontal: 10, borderRadius: 8, padding: 10 },

  collegeName: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#000', marginBottom: 2, textTransform: 'uppercase' },
  deptLabel: { fontSize: 14, color: '#333', fontWeight: '600' },
  docTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginVertical: 5, textDecorationLine: 'underline' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  metaVal: { color: '#000', fontWeight: 'bold' },

  secTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#00796b', textDecorationLine: 'underline' },

  // Grid
  row: { flexDirection: "row" },
  headerRow: { backgroundColor: "#0bbdd8ff" },
  todayRow: { backgroundColor: "#d0f0d0" },
  cell: { borderWidth: 1, borderColor: "#ccc", justifyContent: "center", padding: 6 },
  dayCell: { width: 80, backgroundColor: "#f8f9fa", justifyContent: 'center', alignItems: 'center' },
  periodCell: { width: 90, backgroundColor: "#fff", justifyContent: 'center', alignItems: 'center' },
  headerText: { fontWeight: "bold", textAlign: "center", color: "#000", fontSize: 11 },
  cellText: { textAlign: "center", color: "#333", fontWeight: 'bold', fontSize: 11 },
  dayText: { textAlign: "center", fontWeight: "600", color: "#000" },
  todayText: { fontWeight: "bold", color: "#00796b" },

  // Allocation Table
  allocHeader: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1 },
  allocRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 4 },
  ahCell: { fontSize: 10, fontWeight: 'bold', padding: 4, textAlign: 'center', borderRightWidth: 1, borderColor: '#ddd' },
  aCell: { fontSize: 10, padding: 4, borderRightWidth: 1, borderColor: '#eee' },

  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12, position: 'absolute', bottom: 0, width: '100%' },
});

