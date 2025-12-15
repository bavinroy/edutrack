import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");

// --- Types ---

type Course = {
  id: string;
  code: string;
  acronym: string;
  name: string;
  faculty: string;
  periodsPerWeek: string;
};

type Metadata = {
  academicYear: string;
  semester: string;
  degree: string;
  department: string;
  year: string;
  section: string;
  roomNo: string;
};

type SavedTimetable = {
  id: number;
  title: string;
  class_name: string;
  section: string;
  year: string;
  created_at: string;
  status: 'draft' | 'pending_verification' | 'published' | 'rejected';
  department_name?: string;
};

// --- Component ---

export default function StaffTimetableEditor() {
  const router = useRouter();

  // --- State ---
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'list'>('editor');
  const [savedTimetables, setSavedTimetables] = useState<SavedTimetable[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Editable Constants
  const [collegeName, setCollegeName] = useState("SELVAM COLLEGE OF TECHNOLOGY");
  const [docTitle, setDocTitle] = useState("TIME TABLE");

  const [metadata, setMetadata] = useState<Metadata>({
    academicYear: "2024 - 2025",
    semester: "",
    degree: "B.E/B.TECH",
    department: "LOADING...",
    year: "",
    section: "",
    roomNo: "",
  });

  const [courses, setCourses] = useState<Course[]>([
    { id: "1", code: "", acronym: "", name: "", faculty: "", periodsPerWeek: "" },
  ]);

  // Editable Row Headers (Days)
  const [rowHeaders, setRowHeaders] = useState<string[]>(["MON", "TUE", "WED", "THU", "FRI", "SAT"]);

  // Editable Column Headers (Periods)
  const [colHeaders, setColHeaders] = useState([
    { label: "I", time: "09.15 AM\n10.00 AM" },
    { label: "II", time: "10.00 AM\n10.45 AM" },
    { label: "III", time: "11.00 AM\n11.45 AM" },
    { label: "IV", time: "11.45 AM\n12.30 PM" },
    { label: "V", time: "01.15 PM\n02.00 PM" },
    { label: "VI", time: "02.00 PM\n02.45 PM" },
    { label: "VII", time: "02.55 PM\n03.45 PM" },
  ]);

  // Grid Data: 6 Rows (Days) x 7 Columns (Periods)
  const [gridData, setGridData] = useState<string[][]>(
    Array.from({ length: 6 }, () => Array(7).fill(""))
  );

  const [selectedCell, setSelectedCell] = useState<{ rIndex: number; cIndex: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchUserDept();
    fetchSavedTimetables();
  }, []);

  const fetchUserDept = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/accounts/whoami/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const deptName = data.department?.name || data.department || "Unknown Dept";
          setMetadata(prev => ({ ...prev, department: deptName.toUpperCase() }));
        }
      }
    } catch (e) {
      console.log("Failed to fetch dept", e);
    }
  };

  const fetchSavedTimetables = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      // Assuming /api/accounts/timetables/view/ is the endpoint we just modified to show own lists
      // Actually original was /api/accounts/timetables/ which is the ListCreateView. 
      // But I also modified TimeTableListView which is at /timetables/view/.
      // Let's use /api/accounts/timetables/view/
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/view/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTimetables(data);
      }
    } catch (e) {
      console.log("Fetch saved error", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadTimetable = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentId(data.id);
        // Hydrate State
        if (data.grid) {
          if (data.grid.metadata) setMetadata(data.grid.metadata);
          if (data.grid.courses) setCourses(data.grid.courses);
          if (data.grid.gridData) setGridData(data.grid.gridData);
          if (data.grid.rowHeaders) setRowHeaders(data.grid.rowHeaders);
          if (data.grid.colHeaders) setColHeaders(data.grid.colHeaders);
          if (data.grid.collegeName) setCollegeName(data.grid.collegeName);
          if (data.grid.docTitle) setDocTitle(data.grid.docTitle);
        }
        setViewMode('editor');
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load timetable");
    }
  };

  const handlePublish = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/${id}/publish/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Timetable sent for verification.");
        fetchSavedTimetables();
      } else {
        Alert.alert("Error", data.error || "Failed to publish");
      }
    } catch (e) {
      Alert.alert("Error", "Network error");
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Delete Timetable", "Are you sure you want to delete this timetable? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/${id}/delete/`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              Alert.alert("Success", "Timetable deleted.");
              fetchSavedTimetables();
            } else {
              Alert.alert("Error", "Failed to delete.");
            }
          } catch (e) {
            Alert.alert("Error", "Network error");
          }
        }
      }
    ]);
  };

  // --- Calculations ---

  // --- Calculations ---

  const getUsedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    gridData.forEach((row) => {
      row.forEach((acronym) => {
        if (acronym) {
          counts[acronym] = (counts[acronym] || 0) + 1;
        }
      });
    });
    return counts;
  }, [gridData]);

  const totalAllocated = Object.values(getUsedCounts).reduce((a, b) => a + b, 0);

  // --- Handlers ---

  const handleMetadataChange = (key: keyof Metadata, val: string) => {
    setMetadata((prev) => ({ ...prev, [key]: val }));
  };

  const handleCourseChange = (id: string, field: keyof Course, val: string) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const addCourse = () => {
    const newId = (courses.length + 1).toString();
    setCourses([...courses, { id: newId, code: "", acronym: "", name: "", faculty: "", periodsPerWeek: "0" }]);
  };

  const removeCourse = (id: string) => {
    Alert.alert("Delete Course", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setCourses(courses.filter((c) => c.id !== id)) }
    ]);
  };

  // Header Editing Handlers
  const handleRowHeaderChange = (idx: number, txt: string) => {
    const newRows = [...rowHeaders];
    newRows[idx] = txt;
    setRowHeaders(newRows);
  };

  const handleColHeaderChange = (idx: number, field: 'label' | 'time', txt: string) => {
    const newCols = [...colHeaders];
    newCols[idx] = { ...newCols[idx], [field]: txt };
    setColHeaders(newCols);
  };

  const openCellPicker = (rIndex: number, cIndex: number) => {
    setSelectedCell({ rIndex, cIndex });
    setModalVisible(true);
  };

  const selectCourseForCell = (acronym: string) => {
    if (selectedCell) {
      const { rIndex, cIndex } = selectedCell;
      const newGrid = gridData.map(row => [...row]);
      newGrid[rIndex][cIndex] = acronym;
      setGridData(newGrid);
    }
    setModalVisible(false);
  };

  const pickAndParseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      } as any);

      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/parse/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await res.json();
      setUploading(false);

      if (res.ok) {
        Alert.alert("Success", "Timetable data extracted!");
        // Auto-fill state
        if (data.metadata) setMetadata(prev => ({ ...prev, ...data.metadata }));
        if (data.courses) setCourses(data.courses);
        if (data.gridData) setGridData(data.gridData);
        if (data.rowHeaders) setRowHeaders(data.rowHeaders);
        if (data.colHeaders) setColHeaders(data.colHeaders);
        if (data.collegeName) setCollegeName(data.collegeName);
        if (data.docTitle) setDocTitle(data.docTitle);
      } else {
        Alert.alert("Error", data.error || "Failed to parse file.");
      }
    } catch (e) {
      setUploading(false);
      Alert.alert("Error", "Upload failed.");
      console.log(e);
    }
  };

  const saveTimetable = async () => {
    // Basic backend integration placeholder
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return Alert.alert("Error", "Not logged in");

    // Construct payload
    const payload = {
      title: `${metadata.degree} ${metadata.department} - ${metadata.semester}`,
      class_name: `${metadata.degree} ${metadata.department}`,
      section: metadata.section,
      year: metadata.year,
      grid: {
        metadata,
        courses,
        gridData,
        rowHeaders,
        colHeaders,
        collegeName,
        docTitle
      }
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/timetables/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) Alert.alert("Success", "Timetable Saved Successfully");
      else Alert.alert("Error", "Failed to save");
    } catch (e) {
      Alert.alert("Error", "Network error");
    }
  };

  // --- Renderers ---

  const renderHeader = () => (
    <View style={styles.headerCard}>
      {/* College Name Editable */}
      <TextInput
        style={[styles.collegeName, { borderBottomWidth: 1, borderColor: 'transparent' }]}
        value={collegeName}
        onChangeText={setCollegeName}
        multiline
      />

      {/* Department Subtitle Editable */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>Department of </Text>
        <TextInput
          style={{ fontSize: 14, fontWeight: "600", color: "#333", borderBottomWidth: 1, borderColor: '#ccc', minWidth: 100, textAlign: 'center' }}
          value={metadata.department}
          onChangeText={(v) => handleMetadataChange("department", v)}
        />
      </View>

      {/* Doc Title Editable */}
      <TextInput
        style={[styles.docTitle, { borderBottomWidth: 1, borderColor: 'transparent' }]}
        value={docTitle}
        onChangeText={setDocTitle}
      />

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Academic Year</Text>
          <TextInput style={styles.metaInput} value={metadata.academicYear} onChangeText={(v) => handleMetadataChange("academicYear", v)} />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Year / Sem</Text>
          <View style={{ flexDirection: 'row' }}>
            <TextInput style={[styles.metaInput, { width: 40 }]} value={metadata.year} onChangeText={(v) => handleMetadataChange("year", v)} />
            <Text style={{ alignSelf: 'center', marginHorizontal: 5 }}>/</Text>
            <TextInput style={[styles.metaInput, { width: 40 }]} value={metadata.semester} onChangeText={(v) => handleMetadataChange("semester", v)} />
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Degree / Branch</Text>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <TextInput style={[styles.metaInput, { flex: 0.3 }]} value={metadata.degree} onChangeText={(v) => handleMetadataChange("degree", v)} />
            <Text style={{ alignSelf: 'center', marginHorizontal: 5 }}>-</Text>
            <TextInput style={[styles.metaInput, { flex: 1 }]} value={metadata.department} onChangeText={(v) => handleMetadataChange("department", v)} />
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Section</Text>
          <TextInput style={styles.metaInput} value={metadata.section} onChangeText={(v) => handleMetadataChange("section", v)} />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Room No</Text>
          <TextInput style={styles.metaInput} value={metadata.roomNo} onChangeText={(v) => handleMetadataChange("roomNo", v)} />
        </View>
      </View>
    </View>
  );

  const renderGrid = () => (
    <View style={styles.gridContainer}>
      {/* Header Row */}
      <View style={styles.gridRow}>
        <View style={[styles.cell, styles.dayHeaderCell]}>
          <Text style={styles.gridHeaderText}>Day/Hr</Text>
        </View>
        {colHeaders.map((col, i) => (
          <React.Fragment key={i}>
            {/* Break Columns Logic */}
            {i === 2 && (
              <View style={[styles.cell, styles.breakCol]}>
                <View style={styles.verticalTextContainer}>
                  <Text style={styles.verticalText}>B R E A K</Text>
                </View>
              </View>
            )}
            {i === 4 && (
              <View style={[styles.cell, styles.breakCol]}>
                <View style={styles.verticalTextContainer}>
                  <Text style={styles.verticalText}>L U N C H</Text>
                </View>
              </View>
            )}
            {i === 6 && (
              <View style={[styles.cell, styles.breakCol, { width: 20 }]}>
                {/* Short Break */}
                <View style={styles.verticalTextContainer}>
                  <Text style={[styles.verticalText, { fontSize: 8 }]}>B</Text>
                </View>
              </View>
            )}

            <View style={[styles.cell, styles.periodHeaderCell]}>
              <TextInput
                style={[styles.periodNumber, { borderBottomWidth: 0, padding: 0, minWidth: 20, textAlign: 'center' }]}
                value={col.label}
                onChangeText={(t) => handleColHeaderChange(i, 'label', t)}
              />
              <TextInput
                style={[styles.periodTime, { borderBottomWidth: 0, padding: 0, minWidth: 50, textAlign: 'center' }]}
                value={col.time}
                multiline
                onChangeText={(t) => handleColHeaderChange(i, 'time', t)}
              />
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Day Rows */}
      {rowHeaders.map((dayLabel, rIndex) => (
        <View key={rIndex} style={styles.gridRow}>
          {/* Editable Day Label */}
          <View style={[styles.cell, styles.dayCell]}>
            <TextInput
              style={[styles.dayText, { width: '100%', textAlign: 'center' }]}
              value={dayLabel}
              onChangeText={(t) => handleRowHeaderChange(rIndex, t)}
            />
          </View>

          {/* Cells */}
          {colHeaders.map((_, cIndex) => {
            const currentAcronym = gridData[rIndex] ? gridData[rIndex][cIndex] : "";
            return (
              <React.Fragment key={cIndex}>
                {/* Break Fillers */}
                {cIndex === 2 && <View style={[styles.cell, styles.breakCol]} />}
                {cIndex === 4 && <View style={[styles.cell, styles.breakCol]} />}
                {cIndex === 6 && <View style={[styles.cell, styles.breakCol, { width: 20 }]} />}

                <TouchableOpacity
                  style={[styles.cell, styles.contentCell]}
                  onPress={() => openCellPicker(rIndex, cIndex)}
                >
                  <Text style={styles.cellContentText}>{currentAcronym}</Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      ))}
    </View>
  );

  const renderAllocationTable = () => (
    <View style={styles.allocationContainer}>
      <Text style={styles.sectionTitle}>COURSE - ALLOCATION</Text>
      <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
        <View>
          <View style={styles.allocHeader}>
            <Text style={[styles.allocHeadColl, { width: 40 }]}>S.No</Text>
            <Text style={[styles.allocHeadColl, { width: 80 }]}>Code</Text>
            <Text style={[styles.allocHeadColl, { width: 80 }]}>Acronym</Text>
            <Text style={[styles.allocHeadColl, { width: 150 }]}>Course Name</Text>
            <Text style={[styles.allocHeadColl, { flex: 1 }]}>Faculty Name & Dept</Text>
            <Text style={[styles.allocHeadColl, { width: 60 }]}>Hrs/Wk</Text>
            <Text style={[styles.allocHeadColl, { width: 60 }]}>Used</Text>
            <Text style={[styles.allocHeadColl, { width: 40 }]}>Del</Text>
          </View>

          {courses.map((c, idx) => {
            const used = getUsedCounts[c.acronym] || 0;
            const required = parseInt(c.periodsPerWeek) || 0;
            const isOver = used > required;
            const isUnder = used < required && required > 0;

            return (
              <View key={c.id} style={styles.allocRow}>
                <Text style={[styles.allocCell, { width: 40, textAlign: 'center' }]}>{idx + 1}</Text>
                <TextInput style={[styles.allocInput, { width: 80 }]} value={c.code} onChangeText={v => handleCourseChange(c.id, 'code', v)} />
                <TextInput style={[styles.allocInput, { width: 80, fontWeight: 'bold' }]} value={c.acronym} onChangeText={v => handleCourseChange(c.id, 'acronym', v)} />
                <TextInput style={[styles.allocInput, { width: 150 }]} value={c.name} onChangeText={v => handleCourseChange(c.id, 'name', v)} multiline />
                <TextInput style={[styles.allocInput, { flex: 1 }]} value={c.faculty} onChangeText={v => handleCourseChange(c.id, 'faculty', v)} multiline />
                <TextInput
                  style={[styles.allocInput, { width: 60, textAlign: 'center' }]}
                  value={c.periodsPerWeek}
                  keyboardType="numeric"
                  onChangeText={v => handleCourseChange(c.id, 'periodsPerWeek', v)}
                />
                <Text style={[styles.allocCell, { width: 60, textAlign: 'center', color: isOver ? 'red' : isUnder ? '#ff9800' : 'green', fontWeight: 'bold' }]}>
                  {used}
                </Text>
                <TouchableOpacity style={{ width: 40, alignItems: 'center', justifyContent: 'center' }} onPress={() => removeCourse(c.id)}>
                  <Ionicons name="trash-outline" size={16} color="red" />
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity style={styles.addCourseBtn} onPress={addCourse}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Add Course / Activity</Text>
          </TouchableOpacity>

          <View style={styles.totalRow}>
            <Text style={{ fontWeight: 'bold', flex: 1, textAlign: 'right', paddingRight: 10 }}>Total Periods Allocated:</Text>
            <Text style={{ fontWeight: 'bold', width: 60, textAlign: 'center' }}>{totalAllocated}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'published': return 'green';
      case 'pending_verification': return 'orange';
      case 'rejected': return 'red';
      default: return '#888';
    }
  };

  const renderListView = () => (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 10 }}>
      <FlatList
        data={savedTimetables}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchSavedTimetables} />}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No saved timetables found.</Text>}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{item.title || "Untitled"}</Text>
              <View style={{ backgroundColor: getStatusColor(item.status), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{item.status.replace("_", " ").toUpperCase()}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#666', marginVertical: 4 }}>{item.class_name} - {item.section} ({item.year})</Text>

            <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#00796b', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 }}
                onPress={() => handleLoadTimetable(item.id)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Edit</Text>
              </TouchableOpacity>
              {(item.status === 'draft' || item.status === 'rejected') && (
                <>
                  <TouchableOpacity
                    style={{ backgroundColor: '#FFA000', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 }}
                    onPress={() => handlePublish(item.id)}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Publish</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#d32f2f', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
            {item.status === 'published' && <Text style={{ color: 'green', marginTop: 5, fontSize: 12, fontStyle: 'italic' }}>Verified</Text>}
          </View>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.navTitle}>{viewMode === 'list' ? "My Timetables" : "Editor"}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'editor' : 'list')} style={{ marginRight: 15 }}>
            <Ionicons name={viewMode === 'list' ? "create-outline" : "list-outline"} size={24} color="#00796b" />
          </TouchableOpacity>

          {viewMode === 'editor' && (
            <>
              <TouchableOpacity onPress={pickAndParseFile} style={{ marginRight: 15 }}>
                {uploading ? <ActivityIndicator size="small" color="#00796b" /> : <Ionicons name="cloud-upload-outline" size={24} color="#00796b" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={saveTimetable}><Ionicons name="save-outline" size={24} color="#00796b" /></TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {viewMode === 'list' ? renderListView() : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {renderHeader()}
            <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
              {renderGrid()}
            </ScrollView>
            {renderAllocationTable()}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Course Picker Modal */}
      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Course / Activity</Text>
            <ScrollView>
              <TouchableOpacity style={styles.modalItem} onPress={() => selectCourseForCell("")}>
                <Text style={[styles.modalItemText, { color: 'red' }]}>Clear Cell</Text>
              </TouchableOpacity>
              {courses.map(c => (
                <TouchableOpacity key={c.id} style={styles.modalItem} onPress={() => selectCourseForCell(c.acronym)}>
                  <Text style={styles.modalItemText}>{c.acronym} - {c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  navHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ddd' },
  navTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  scrollContent: { padding: 10, paddingBottom: 50 },

  // Header Card
  headerCard: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
  collegeName: { fontSize: 18, fontWeight: "bold", textAlign: "center", color: "#d32f2f", textTransform: 'uppercase' },
  headerSubtitle: { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 4, color: "#333" },
  docTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", textDecorationLine: "underline", marginVertical: 10, color: "#000" },

  metaRow: { flexDirection: 'row', marginBottom: 8, justifyContent: 'space-between' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  metaLabel: { fontSize: 12, fontWeight: 'bold', marginRight: 5, color: '#555' },
  metaInput: { borderBottomWidth: 1, borderColor: '#999', paddingVertical: 0, paddingHorizontal: 5, fontSize: 13, color: '#000', minWidth: 50, fontWeight: '600' },

  // Grid
  gridContainer: { borderWidth: 1, borderColor: '#000', backgroundColor: '#fff', marginBottom: 20 },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', minHeight: 40 },
  cell: { borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 2 },

  dayHeaderCell: { width: 60, backgroundColor: '#eceff1' },
  gridHeaderText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },

  periodHeaderCell: { width: 140, backgroundColor: '#eceff1' }, // Increased from 80
  periodNumber: { fontSize: 12, fontWeight: 'bold' },
  periodTime: { fontSize: 9, textAlign: 'center', marginTop: 2 },

  dayCell: { width: 60, backgroundColor: '#eceff1' },
  dayText: { fontWeight: 'bold', fontSize: 12 },

  contentCell: { width: 140, backgroundColor: '#fff' }, // Increased from 80
  cellContentText: { fontWeight: 'bold', fontSize: 13, textAlign: 'center', flexWrap: 'wrap', flexShrink: 1 },

  breakCol: { width: 30, backgroundColor: '#e0e0e0', padding: 0 },
  verticalTextContainer: { transform: [{ rotate: '-90deg' }], width: 100, alignItems: 'center', justifyContent: 'center' },
  verticalText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, color: '#555' },

  // Allocation
  allocationContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline', marginBottom: 10, textAlign: 'center' },

  allocHeader: { flexDirection: 'row', backgroundColor: '#eceff1', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 8 },
  allocHeadColl: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 2 },

  allocRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 5, alignItems: 'center' },
  allocCell: { fontSize: 12 },
  allocInput: { fontSize: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 4, marginHorizontal: 2, color: '#000' },

  addCourseBtn: { backgroundColor: '#00796b', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  totalRow: { flexDirection: 'row', marginTop: 10, padding: 10, backgroundColor: '#e0f2f1', borderRadius: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 10, padding: 20, elevation: 5 },
  modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#00796b' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  modalItemText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  modalItemSub: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 4 },
  closeModalBtn: { marginTop: 20, backgroundColor: '#d32f2f', padding: 10, borderRadius: 5, alignItems: 'center' },
});
