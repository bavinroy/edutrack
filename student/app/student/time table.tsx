import React, { useEffect, useState } from "react";
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

type Row = { day: string; cells: string[] };
type TimeTable = {
  id: number;
  title: string;
  class_name: string;
  section: string;
  year: string;
  grid: {
    periods: string[];
    rows: Row[];
    meta?: { notes?: string; active_day?: string };
  };
};

export default function StudentTimetable() {
  const [timetables, setTimetables] = useState<TimeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TimeTable | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  const getTodayName = (): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = new Date().getDay();
    return days[day];
  };
  const [today, setToday] = useState(getTodayName());

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const res = await fetch(
          "http://10.193.11.125:8000/api/accounts/student/timetables/",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setTimeout(() => {
          setTimetables(data);
          if (data.length > 0) {
            setSelected(data[0]);
            if (data[0].grid.meta?.active_day)
              setToday(data[0].grid.meta.active_day);
          }
          setLoading(false);
        }, 500);
      } catch (err) {
        Alert.alert("Error", "Could not fetch timetables");
        setLoading(false);
      }
    };

    fetchTimetables();
    const interval = setInterval(() => setToday(getTodayName()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
        <View style={styles.center}>
          <Text style={styles.noText}>No timetable available</Text>
        </View>
      </ImageBackground>
    );
  }

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

      {/* Info */}
      <Text style={styles.heading}>
        {selected.title || `${selected.class_name} ${selected.section}`}
      </Text>
      <Text style={styles.subText}>Year: {selected.year}</Text>

      {/* Grid */}
      <ScrollView horizontal style={{ marginTop: 10 }}>
        <View style={{ minWidth: screenWidth }}>
          <View style={[styles.row, styles.headerRow]}>
            <View style={[styles.cell, styles.dayCell]}>
              <Text style={styles.headerText}>Day / Period</Text>
            </View>
            {selected.grid.periods.map((p, i) => (
              <View key={i} style={[styles.cell, styles.periodCell]}>
                <Text style={styles.headerText}>{p}</Text>
              </View>
            ))}
          </View>

          {selected.grid.rows.map((row, rIndex) => {
            const isToday = row.day === today;
            return (
              <View
                key={rIndex}
                style={[styles.row, isToday && styles.todayRow]}
              >
                <View style={[styles.cell, styles.dayCell]}>
                  <Text
                    style={[styles.dayText, isToday && styles.todayText]}
                  >
                    {row.day}
                  </Text>
                </View>
                {row.cells.map((cell, cIndex) => (
                  <View key={cIndex} style={[styles.cell, styles.periodCell]}>
                    <Text style={styles.cellText}>{cell || "---"}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Notes */}
      {selected.grid.meta?.notes && (
        <Text style={styles.notes}>Notes: {selected.grid.meta.notes}</Text>
      )}

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

// Styles remain the same

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

  heading: { fontSize: 20, fontWeight: "bold", color: "#000", marginBottom: 4, paddingHorizontal: 16 },
  subText: { color: "#160909ff", marginBottom: 10, paddingHorizontal: 16 },
  row: { flexDirection: "row" },
  headerRow: { backgroundColor: "#0bbdd8ff" },
  todayRow: { backgroundColor: "#d0f0d0" },
  cell: { borderWidth: 1, borderColor: "#2a2828ff", justifyContent: "center", padding: 6 },
  dayCell: { width: 100, backgroundColor: "#f8f9fa" },
  periodCell: { minWidth: 120, backgroundColor: "#fff" },
  headerText: { fontWeight: "bold", textAlign: "center", color: "#000" },
  cellText: { textAlign: "center", color: "#333" },
  dayText: { textAlign: "center", fontWeight: "600", color: "#000" },
  todayText: { fontWeight: "bold", color: "#30e4de" },

  notes: { marginTop: 12, fontStyle: "italic", color: "#fff", backgroundColor: "rgba(0,0,0,0.3)", padding: 6, borderRadius: 6, marginHorizontal: 16 },

  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12 },
});
