import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Button,
  Alert,
  Pressable,
  ImageBackground,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Cell = string;
type Row = { day: string; cells: Cell[] };
type TimeTableData = { title: string; className: string; year: string; periods: string[]; rows: Row[] };
type TimeTableFromBackend = { id: number; title: string; class_name: string; year: string; grid: { periods: string[]; rows: Row[]; meta?: { notes?: string; active_day?: string } } };
type MergedCell = { row: number; colStart: number; colEnd: number; content: string };

export default function StaffTimetableEditor() {
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  const [tables, setTables] = useState<TimeTableData[]>([{
    title: "",
    className: "",
    year: "",
    periods: ["09:00-09:50", "10:00-10:50"],
    rows: [
      { day: "Day 1", cells: ["", ""] },
      { day: "Day 2", cells: ["", ""] },
      { day: "Day 3", cells: ["", ""] },
      { day: "Day 4", cells: ["", ""] },
      { day: "Day 5", cells: ["", ""] },
      { day: "Day 6", cells: ["", ""] },
      { day: "Book Free Day", cells: ["", ""] },
      { day: "Holiday", cells: ["", ""] },
    ],
  }]);
  const [uploadedTimetables, setUploadedTimetables] = useState<TimeTableFromBackend[]>([]);
  const [mergedCells, setMergedCells] = useState<MergedCell[]>([]);
  const [selection, setSelection] = useState<{ row: number; col: number } | null>(null);

  const collegeDays = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Book Free Day", "Holiday"];

  const getDefaultToday = (): string => {
    const day = new Date().getDay();
    if (day === 0) return "Holiday";
    if (day === 6) return "Book Free Day";
    return `Day ${day}`;
  };
  const [today, setToday] = useState(getDefaultToday());

  useEffect(() => {
    const interval = setInterval(() => setToday(getDefaultToday()), 60 * 1000);
    fetchUploadedTimetables();
    return () => clearInterval(interval);
  }, []);

  /** ------------------ Table CRUD ------------------ **/
  const updateTable = (index: number, newTable: TimeTableData) => { const updated = [...tables]; updated[index] = newTable; setTables(updated); };
  const addNewTable = () => setTables([...tables, { title: "", className: "", year: "", periods: ["09:00-09:50"], rows: [{ day: "Day 1", cells: [""] }] }]);
  const deleteTable = (index: number) => Alert.alert("Confirm Delete", "Delete this timetable?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => setTables(tables.filter((_, i) => i !== index)) }]);

  /** ------------------ Merge Cells ------------------ **/
  const handleCellLongPress = (rowIndex: number, colIndex: number) => {
    if (!selection) { setSelection({ row: rowIndex, col: colIndex }); return; }
    if (selection.row !== rowIndex) { Alert.alert("Error", "Only horizontal merge allowed!"); setSelection(null); return; }
    const start = Math.min(selection.col, colIndex);
    const end = Math.max(selection.col, colIndex);
    const content = tables[0].rows[rowIndex].cells.slice(start, end + 1).join(" | ");
    setMergedCells([...mergedCells, { row: rowIndex, colStart: start, colEnd: end, content }]);
    const newRows = [...tables[0].rows];
    for (let c = start + 1; c <= end; c++) newRows[rowIndex].cells[c] = "";
    newRows[rowIndex].cells[start] = content;
    updateTable(0, { ...tables[0], rows: newRows });
    setSelection(null);
  };
  const isCellMerged = (row: number, col: number) => mergedCells.find((m) => m.row === row && m.colStart <= col && col <= m.colEnd);

  /** ------------------ File / Backend ------------------ **/
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.assets?.length) Alert.alert("File Selected", result.assets[0].name);
  };
  const saveAllTimetables = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      for (const t of tables) {
        const payload = { title: t.title, class_name: t.className, year: t.year, grid: { periods: t.periods, rows: t.rows, meta: { active_day: today } } };
        const res = await fetch("http://10.193.11.125:8000/api/accounts/timetables/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save");
      }
      Alert.alert("Success", "All timetables saved!");
      fetchUploadedTimetables();
    } catch { Alert.alert("Error", "Failed to save timetables"); }
  };
  const fetchUploadedTimetables = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      const res = await fetch("http://10.193.11.125:8000/api/accounts/timetables/view/", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUploadedTimetables(data);
    } catch { Alert.alert("Error", "Could not fetch timetables"); }
  };
  const deleteUploadedTimetable = async (id: number) => {
    const token = await AsyncStorage.getItem("accessToken");
    Alert.alert("Confirm", "Delete this uploaded timetable?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`http://10.193.11.125:8000/api/accounts/timetables/${id}/delete/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setUploadedTimetables(uploadedTimetables.filter((t) => t.id !== id));
            else Alert.alert("Error", "Failed to delete");
          } catch { Alert.alert("Error", "Something went wrong"); }
        },
      },
    ]);
  };

  /** ------------------ Render ------------------ **/
  return (
    <ImageBackground source={require("../../assets/images/back.jpg")} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color="#30e4de" /></TouchableOpacity>
          <Text style={styles.headerTitle}>TIMETABLE</Text>
          <TouchableOpacity onPress={() => router.push("/staff/notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#30e4de" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 10 }}>
          {/* Today Selector */}
          <ScrollView horizontal style={{ marginVertical: 10 }}>
            {collegeDays.map((d) => (
              <Button key={d} title={d} color={d === today ? "#0dd7d7ff" : "#3c6ec4ff"} onPress={() => setToday(d)} />
            ))}
          </ScrollView>

          {/* Timetable Cards */}
          {tables.map((table, tIndex) => (
            <View key={tIndex} style={styles.tableWrapper}>
              <Text style={styles.tableTitle}>{table.title || `Timetable ${tIndex + 1}`}</Text>
              {/* Inputs */}
              <TextInput placeholder="Department" value={table.title} onChangeText={(v) => updateTable(tIndex, { ...table, title: v })} style={styles.input} />
              <TextInput placeholder="Year" value={table.className} onChangeText={(v) => updateTable(tIndex, { ...table, className: v })} style={styles.input} />
              <TextInput placeholder="Description" value={table.year} onChangeText={(v) => updateTable(tIndex, { ...table, year: v })} style={styles.input} />

              {/* Grid */}
              <ScrollView horizontal style={{ marginTop: 10 }}>
                <View style={{ minWidth: screenWidth }}>
                  <View style={[styles.row, styles.headerRow]}>
                    <View style={[styles.cell, styles.dayCell]}><Text style={styles.headerText}>Day / Period</Text></View>
                    {table.periods.map((p, i) => <View key={i} style={[styles.cell, styles.periodCell]}><Text style={styles.headerText}>{p}</Text></View>)}
                  </View>
                  {table.rows.map((row, rIndex) => {
                    const isToday = row.day === today;
                    return (
                      <View key={rIndex} style={[styles.row, isToday && styles.todayRow]}>
                        <View style={[styles.cell, styles.dayCell]}><Text style={[styles.dayText, isToday && styles.todayText]}>{row.day}</Text></View>
                        {row.cells.map((cell, cIndex) => {
                          const merged = isCellMerged(rIndex, cIndex);
                          const isFirst = merged && merged.colStart === cIndex;
                          if (merged && !isFirst) return <View key={cIndex} style={[styles.cell, styles.periodCell]} />;
                          return (
                            <Pressable key={cIndex} onLongPress={() => handleCellLongPress(rIndex, cIndex)}>
                              <View style={[styles.cell, styles.periodCell, merged && isFirst && { flex: merged.colEnd - merged.colStart + 1 }]}>
                                <TextInput value={merged && isFirst ? merged.content : cell} onChangeText={(v) => { const newRows = [...table.rows]; newRows[rIndex].cells[cIndex] = v; updateTable(tIndex, { ...table, rows: newRows }); if (merged && isFirst) setMergedCells(mergedCells.map(m => m === merged ? { ...m, content: v } : m)); }} style={styles.cellInput} editable={!merged || isFirst} />
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={{ marginTop: 10 }}>
                <Button title="Delete This Timetable" color="red" onPress={() => deleteTable(tIndex)} />
              </View>
            </View>
          ))}

          {/* Global Actions */}
          <View style={{ marginVertical: 15 }}>
            <Button title="Add Another Table" onPress={addNewTable} />
            <View style={{ height: 10 }} />
            <Button title="Save All Timetables" onPress={saveAllTimetables} />
            <View style={{ height: 10 }} />
            <Button title="Upload File" onPress={pickFile} />
          </View>

          {/* Uploaded Timetables */}
          <Text style={styles.sectionHeader}>📋 Uploaded Timetables</Text>
          {uploadedTimetables.length > 0 ? uploadedTimetables.map((item) => (
            <View key={item.id} style={styles.uploadedCard}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>{item.class_name} - ({item.year})</Text>
              <ScrollView horizontal style={{ marginTop: 10 }}>
                <View>
                  <View style={[styles.row, styles.headerRow]}>
                    <View style={[styles.cell, styles.dayCell]}><Text style={styles.headerText}>Day/Period</Text></View>
                    {item.grid.periods.map((p, i) => <View key={i} style={[styles.cell, styles.periodCell]}><Text style={styles.headerText}>{p}</Text></View>)}
                  </View>
                  {item.grid.rows.map((row, rIndex) => (
                    <View key={rIndex} style={[styles.row, row.day === today && styles.todayRow]}>
                      <View style={[styles.cell, styles.dayCell]}><Text style={[styles.dayText, row.day === today && styles.todayText]}>{row.day}</Text></View>
                      {row.cells.map((cell, cIndex) => <View key={cIndex} style={[styles.cell, styles.periodCell]}><Text style={styles.cellText}>{cell}</Text></View>)}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View style={{ marginTop: 10 }}>
                <Button title="Delete This Timetable" color="red" onPress={() => deleteUploadedTimetable(item.id)} />
              </View>
            </View>
          )) : <Text style={{ textAlign: "center", color: "#fff" }}>📭 No timetables uploaded</Text>}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <Ionicons name="home" size={24} color="#fff" onPress={() => router.push("/staff/dashboard")} />
          <Ionicons name="desktop-outline" size={24} color="#fff" onPress={() => router.push("/staff/notice")} />

          <Ionicons name="person-circle-outline" size={24} color="#fff" onPress={() => router.push("/staff/profile")} />
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: "cover" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de" },
  tableWrapper: { borderWidth: 1, borderColor: "#999", padding: 10, marginBottom: 20, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.85)" },
  tableTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  input: { borderWidth: 1, padding: 8, marginBottom: 8, borderRadius: 5, backgroundColor: "#fff" },
  row: { flexDirection: "row" },
  cell: { borderWidth: 1, borderColor: "#ccc", justifyContent: "center", padding: 6 },
  dayCell: { width: 100, backgroundColor: "#f8f9fa" },
  periodCell: { minWidth: 120, backgroundColor: "#fff" },
  headerRow: { backgroundColor: "#0bbdd8ff" },
  headerText: { fontWeight: "bold", textAlign: "center", color: "#000" },
  cellInput: { textAlign: "center" },
  dayText: { textAlign: "center", fontWeight: "600", color: "#000" },
  todayText: { fontWeight: "bold", color: "#30e4de" },
  todayRow: { backgroundColor: "#d0f0d0" },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginVertical: 10, color: "#fff" },
  uploadedCard: { backgroundColor: "rgba(255,255,255,0.9)", padding: 12, marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  title: { fontWeight: "bold", marginBottom: 4 },
  cellText: { textAlign: "center", color: "#333" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#30e4de", paddingVertical: 12 },
});
