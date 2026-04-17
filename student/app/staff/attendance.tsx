import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  TextInput, 
  Modal, 
  Switch, 
  StatusBar, 
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchWithAuth } from '../../lib/api_helper';
import { useTheme } from "../../context/ThemeContext";
import StaffBottomNav from "../../components/StaffBottomNav";

const { width } = Dimensions.get("window");

interface Student {
  id: number;
  roll_no: string;
  user: { username: string; first_name?: string; last_name?: string };
  present: boolean;
  status: string;
  avatar_url?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  year?: number;
  semester?: number;
  department?: { id: number; name: string };
}

export default function AttendanceMarking() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [step, setStep] = useState(1); // 1: Setup, 2: Roll Call
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // --- Data Sources ---
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // --- Form State ---
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [batch, setBatch] = useState('4');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('A');
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  // --- Students State ---
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const deptRes = await fetchWithAuth(`${API_BASE_URL}/api/accounts/public/departments/`);
      const subRes = await fetchWithAuth(`${API_BASE_URL}/api/academic/subjects/`);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (subRes.ok) setSubjects(await subRes.json());
    } catch (e) { }
    finally { setInitialLoading(false); }
  };

  const fetchStudents = async () => {
    if (!selectedDept || !selectedSubject || selectedHours.length === 0) {
      Alert.alert("Missing Parameters", "Please ensure Department, Subject and Hours are selected.");
      return;
    }

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/academic/students/?department=${selectedDept}&year=${batch}`;
      if (section !== 'ALL') url += `&section=${section}`;

      const response = await fetchWithAuth(url);
      const data = await response.json();

      if (response.ok) {
        setStudents(data.map((s: any) => ({ ...s, status: 'Present' })));
        setStep(2);
      } else {
        Alert.alert("No Students", "No records match the selected filters.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to retrieve student list.");
    } finally {
      setLoading(false);
    }
  };

  const toggleHour = (h: string) => {
    if (selectedHours.includes(h)) setSelectedHours(prev => prev.filter(x => x !== h));
    else setSelectedHours(prev => [...prev, h]);
  };

  const toggleStatus = (id: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) return { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' };
      return s;
    }));
  };

  const markAll = (status: string) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const submitAttendance = async () => {
    setLoading(true);
    try {
      const payload = {
        subject: selectedSubject,
        date: date.toISOString().split('T')[0],
        year: parseInt(batch),
        semester: parseInt(semester),
        section: section === 'ALL' ? '' : section,
        hour: selectedHours.join(','),
        records: students.map(s => ({ student_id: s.id, status: s.status }))
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/api/academic/attendance/mark/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert("Success", "Attendance registry synchronized!");
        router.back();
      } else {
        Alert.alert("Error", "Failed to sync attendance. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Connectivity issue detected.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{step === 1 ? "Session Params" : "Roll Call"}</Text>
        <View style={styles.headerRight}>
          {step === 2 && (
             <View style={[styles.countBadge, { backgroundColor: '#6366F1' }]}>
                <Text style={styles.countText}>{students.length} Total</Text>
             </View>
          )}
        </View>
      </View>

      {step === 1 ? (
        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Calendar Select */}
          <Text style={styles.inputLabel}>SESSION DATE</Text>
          <TouchableOpacity 
             style={[styles.dateCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
             onPress={() => setShowDatePicker(true)}
          >
             <View style={styles.dateIcon}><Ionicons name="calendar" size={20} color="#6366F1" /></View>
             <Text style={[styles.dateVal, { color: themeColors.text }]}>
                {date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
             </Text>
             <Ionicons name="chevron-down" size={16} color={themeColors.subText} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker value={date} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} />
          )}

          {/* Department */}
          <Text style={[styles.inputLabel, { marginTop: 25 }]}>PROGRAMME / DEPARTMENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
             {departments.map(d => (
               <TouchableOpacity 
                  key={d.id} 
                  style={[styles.chip, { backgroundColor: themeColors.card, borderColor: themeColors.border }, selectedDept === d.id && styles.activeChip]}
                  onPress={() => setSelectedDept(d.id)}
               >
                  <Text style={[styles.chipText, { color: themeColors.text }, selectedDept === d.id && { color: '#fff' }]}>{d.code || d.name}</Text>
               </TouchableOpacity>
             ))}
          </ScrollView>

          {/* Grid Meta (Year & Section) */}
          <View style={styles.metaGrid}>
             <View style={styles.gridCol}>
                <Text style={styles.inputLabel}>YEAR / BATCH</Text>
                <View style={styles.miniChipGrid}>
                   {['1', '2', '3', '4'].map(y => (
                     <TouchableOpacity key={y} style={[styles.miniChip, { backgroundColor: themeColors.card, borderColor: themeColors.border }, batch === y && styles.activeChip]} onPress={() => setBatch(y)}>
                        <Text style={[styles.chipText, { color: themeColors.text }, batch === y && { color: '#fff' }]}>{y}</Text>
                     </TouchableOpacity>
                   ))}
                </View>
             </View>
             <View style={styles.gridCol}>
                <Text style={styles.inputLabel}>SECTION</Text>
                <View style={styles.miniChipGrid}>
                   {['A', 'B', 'C', 'ALL'].map(s => (
                     <TouchableOpacity key={s} style={[styles.miniChip, { backgroundColor: themeColors.card, borderColor: themeColors.border }, section === s && styles.activeChip]} onPress={() => setSection(s)}>
                        <Text style={[styles.chipText, { color: themeColors.text }, section === s && { color: '#fff' }]}>{s}</Text>
                     </TouchableOpacity>
                   ))}
                </View>
             </View>
          </View>

          {/* Subject Select */}
          <Text style={[styles.inputLabel, { marginTop: 25 }]}>ALLOCATED SUBJECT</Text>
          <View style={[styles.subjectContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
             {subjects.map(s => (
               <TouchableOpacity 
                  key={s.id} 
                  style={[styles.subjectItem, selectedSubject === s.id && { backgroundColor: '#6366F110' }]} 
                  onPress={() => setSelectedSubject(s.id)}
               >
                  <View style={[styles.subIcon, { backgroundColor: selectedSubject === s.id ? '#6366F1' : isDark ? '#374151' : '#F1F5F9' }]}>
                    <Ionicons name="book" size={16} color={selectedSubject === s.id ? '#fff' : themeColors.subText} />
                  </View>
                  <View style={styles.subInfo}>
                     <Text style={[styles.subName, { color: themeColors.text }]}>{s.name}</Text>
                     <Text style={styles.subCode}>{s.code}</Text>
                  </View>
                  {selectedSubject === s.id && <Ionicons name="checkmark-circle" size={20} color="#6366F1" />}
               </TouchableOpacity>
             ))}
          </View>

          {/* Hours */}
          <Text style={[styles.inputLabel, { marginTop: 25 }]}>LECTURE HOURS</Text>
          <View style={styles.hourGrid}>
             {['1', '2', '3', '4', '5', '6', '7'].map(h => (
               <TouchableOpacity key={h} style={[styles.hourBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }, selectedHours.includes(h) && styles.activeChip]} onPress={() => toggleHour(h)}>
                  <Text style={[styles.hourText, { color: themeColors.text }, selectedHours.includes(h) && { color: '#fff' }]}>{h}</Text>
               </TouchableOpacity>
             ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={fetchStudents}>
             <Text style={styles.primaryBtnText}>PREPARE ROLL CALL</Text>
             {loading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.summaryStrip, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
             <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#10B981' }]}>{students.filter(s => s.status === 'Present').length}</Text>
                <Text style={styles.summaryLabel}>PRESENT</Text>
             </View>
             <View style={styles.summaryDivider} />
             <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#EF4444' }]}>{students.filter(s => s.status === 'Absent').length}</Text>
                <Text style={styles.summaryLabel}>ABSENT</Text>
             </View>
             <View style={styles.summaryDivider} />
             <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: themeColors.text }]}>{Math.round((students.filter(s => s.status === 'Present').length / students.length) * 100)}%</Text>
                <Text style={styles.summaryLabel}>PERCENTAGE</Text>
             </View>
          </View>

          <View style={styles.rollListHeader}>
             <Text style={[styles.rollTitle, { color: themeColors.subText }]}>RECORDS FOR {date.toLocaleDateString()}</Text>
             <View style={styles.rollActions}>
                <TouchableOpacity onPress={() => markAll('Present')}><Text style={styles.actionP}>ALL P</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => markAll('Absent')}><Text style={styles.actionA}>ALL A</Text></TouchableOpacity>
             </View>
          </View>

          <FlatList
             data={students}
             keyExtractor={item => item.id.toString()}
             contentContainerStyle={styles.studentList}
             renderItem={({ item }) => (
               <TouchableOpacity 
                  style={[styles.sCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }, item.status === 'Absent' && styles.absentCard]} 
                  onPress={() => toggleStatus(item.id)}
               >
                  <View style={styles.sAvatarContainer}>
                      {item.avatar_url ? (
                          <Image source={{ uri: item.avatar_url }} style={styles.sAvatar} />
                      ) : (
                          <View style={[styles.sRollWrap, { backgroundColor: isDark ? '#374151' : '#F1F5F9' }]}>
                             <Text style={[styles.sRoll, { color: themeColors.text }]}>{item.roll_no.slice(-3)}</Text>
                          </View>
                      )}
                  </View>
                  <View style={styles.sMain}>
                     <Text style={[styles.sName, { color: themeColors.text }]}>{item.user.first_name || item.user.username} {item.user.last_name || ''}</Text>
                     <Text style={styles.sFullRoll}>{item.roll_no}</Text>
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: item.status === 'Present' ? '#10B98115' : '#EF444415' }]}>
                    <Text style={[styles.statusLetter, { color: item.status === 'Present' ? '#10B981' : '#EF4444' }]}>{item.status === 'Present' ? 'P' : 'A'}</Text>
                  </View>
               </TouchableOpacity>
             )}
          />

          <View style={[styles.footer, { backgroundColor: themeColors.bg, borderTopColor: themeColors.border }]}>
             <TouchableOpacity style={styles.primaryBtn} onPress={submitAttendance}>
                <Text style={styles.primaryBtnText}>{loading ? "SYNCING REGISTRY..." : "FINALIZE & SAVE"}</Text>
             </TouchableOpacity>
          </View>
        </View>
      )}

      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
     paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  headerRight: { width: 80, alignItems: 'flex-end' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  countText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  scrollBody: { padding: 20 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#9CA3AF', marginBottom: 12 },
  dateCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1 },
  dateIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  dateVal: { flex: 1, fontSize: 15, fontWeight: '700' },

  chipScroll: { paddingBottom: 5, gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  activeChip: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 13, fontWeight: '700' },

  metaGrid: { flexDirection: 'row', marginTop: 25, gap: 15 },
  gridCol: { flex: 1 },
  miniChipGrid: { flexDirection: 'row', gap: 8 },
  miniChip: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  subjectContainer: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  subjectItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  subIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  subInfo: { flex: 1 },
  subName: { fontSize: 14, fontWeight: '700' },
  subCode: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },

  hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hourBox: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  hourText: { fontSize: 14, fontWeight: '900' },

  primaryBtn: { backgroundColor: '#6366F1', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  summaryStrip: { flexDirection: 'row', padding: 20, borderBottomWidth: 1 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 9, fontWeight: '800', color: '#9CA3AF', marginTop: 4 },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#eee' },

  rollListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  rollTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  rollActions: { flexDirection: 'row', gap: 15 },
  actionP: { color: '#10B981', fontSize: 12, fontWeight: '800' },
  actionA: { color: '#EF4444', fontSize: 12, fontWeight: '800' },

  studentList: { padding: 20, paddingBottom: 120 },
  sCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 22, borderWidth: 1, marginBottom: 12 },
  absentCard: { borderColor: '#EF444430', opacity: 0.9 },
  sAvatarContainer: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  sAvatar: { width: '100%', height: '100%' },
  sRollWrap: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  sRoll: { fontSize: 13, fontWeight: '800' },
  sMain: { flex: 1, marginLeft: 15 },
  sName: { fontSize: 15, fontWeight: '700' },
  sFullRoll: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  statusIndicator: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statusLetter: { fontSize: 18, fontWeight: '900' },

  footer: { padding: 20, paddingBottom: 35, borderTopWidth: 1 },
});
