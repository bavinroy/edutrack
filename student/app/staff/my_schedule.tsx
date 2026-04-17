import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { useTheme } from "../../context/ThemeContext";
import StaffBottomNav from "../../components/StaffBottomNav";

const { width } = Dimensions.get("window");
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ScheduleEntry = {
  id?: number;
  period: number;
  start_time?: string;
  end_time?: string;
  subject?: string;
  subject_code?: string;
  class_name: string;
  section: string;
  year: string;
};

type ScheduleData = {
  [key: string]: ScheduleEntry[];
};

export default function MySchedule() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [modalVisible, setModalVisible] = useState(false);
  
  const [form, setForm] = useState({
    id: undefined as number | undefined,
    class_name: '',
    section: '',
    year: '',
    period: '',
    subject: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (DAYS.includes(today)) setSelectedDay(today);
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setFetching(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/academic/schedule/my_schedule/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSchedule(await res.json());
    } catch (error) { }
    finally { setLoading(false); setFetching(false); }
  };

  const openForm = (entry?: ScheduleEntry) => {
    if (entry) {
      setForm({
        id: entry.id,
        class_name: entry.class_name,
        section: entry.section,
        year: entry.year,
        period: entry.period.toString(),
        subject: entry.subject || '',
        start_time: entry.start_time || '',
        end_time: entry.end_time || ''
      });
    } else {
      setForm({ id: undefined, class_name: '', section: '', year: '', period: '', subject: '', start_time: '', end_time: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.class_name || !form.period) return Alert.alert("Missing Info", "Class and Period are required.");
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/academic/schedule/my_schedule/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, day: selectedDay, period: parseInt(form.period) })
      });
      if (res.ok) {
        setModalVisible(false);
        fetchSchedule();
        Alert.alert("Success", "Daily plan updated.");
      }
    } catch (e) { }
  };

  const currentSchedule = (schedule[selectedDay] || []).sort((a, b) => a.period - b.period);

  if (loading) return (
    <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Academic Planner</Text>
        <TouchableOpacity style={styles.syncBtn} onPress={fetchSchedule}>
          <Ionicons name="sync" size={22} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <View style={[styles.dayStrip, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {DAYS.map(day => (
            <TouchableOpacity 
               key={day} 
               style={[styles.dayTab, selectedDay === day && { backgroundColor: '#6366F1' }]} 
               onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayTabText, { color: themeColors.subText }, selectedDay === day && { color: '#fff' }]}>{day.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listArea}
        refreshControl={<RefreshControl refreshing={fetching} onRefresh={fetchSchedule} colors={["#6366F1"]} />}
      >
        <View style={styles.timelineHeader}>
           <MaterialCommunityIcons name="timeline-clock" size={20} color="#6366F1" />
           <Text style={[styles.timelineTitle, { color: themeColors.subText }]}>{selectedDay.toUpperCase()} AGENDA</Text>
        </View>

        {currentSchedule.length === 0 ? (
          <View style={styles.emptyWrap}>
             <View style={[styles.emptyCircle, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <Ionicons name="calendar" size={60} color={isDark ? '#334155' : '#CBD5E1'} />
             </View>
             <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Lectures</Text>
             <Text style={[styles.emptySub, { color: themeColors.subText }]}>You've got no sessions recorded for this day yet.</Text>
          </View>
        ) : (
          currentSchedule.map((item, idx) => (
            <TouchableOpacity key={idx} style={[styles.sCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => openForm(item)}>
               <View style={styles.sTimeBox}>
                  <Text style={[styles.sTimeMain, { color: themeColors.text }]}>{item.start_time || `P${item.period}`}</Text>
                  <Text style={styles.sTimeSub}>{item.end_time || "Session"}</Text>
               </View>
               <View style={styles.sLine} />
               <View style={styles.sMain}>
                  <Text style={[styles.sSubject, { color: themeColors.text }]}>{item.subject || "No Activity Title"}</Text>
                  <View style={styles.sMeta}>
                     <View style={[styles.mBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={[styles.mText, { color: themeColors.subText }]}>{item.class_name}-{item.section}</Text>
                     </View>
                     <View style={[styles.mBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={[styles.mText, { color: themeColors.subText }]}>Yr {item.year}</Text>
                     </View>
                  </View>
               </View>
               <Ionicons name="ellipsis-vertical" size={16} color={themeColors.border} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openForm()}>
         <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Editor Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalBox, { backgroundColor: themeColors.bg }]}>
              <View style={[styles.modalNav, { borderBottomColor: themeColors.border }]}>
                 <Text style={[styles.mNavTitle, { color: themeColors.text }]}>{form.id ? "Edit Planned Session" : "Schedule New Session"}</Text>
                 <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={themeColors.text} /></TouchableOpacity>
              </View>

              <ScrollView style={styles.mForm} showsVerticalScrollIndicator={false}>
                 <Text style={styles.fLabel}>SUBJECT / TOPIC</Text>
                 <TextInput style={[styles.fInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} placeholder="e.g. Computer Networks" placeholderTextColor={themeColors.subText} value={form.subject} onChangeText={t => setForm({...form, subject: t})} />

                 <View style={styles.fRow}>
                    <View style={{ flex: 1 }}>
                       <Text style={styles.fLabel}>PERIOD</Text>
                       <TextInput style={[styles.fInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} placeholder="1" keyboardType="numeric" value={form.period} onChangeText={t => setForm({...form, period: t})} />
                    </View>
                    <View style={{ width: 15 }} />
                    <View style={{ flex: 1 }}>
                       <Text style={styles.fLabel}>YEAR</Text>
                       <TextInput style={[styles.fInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} placeholder="4" keyboardType="numeric" value={form.year} onChangeText={t => setForm({...form, year: t})} />
                    </View>
                 </View>

                 <View style={styles.fRow}>
                    <View style={{ flex: 1 }}>
                       <Text style={styles.fLabel}>CLASS</Text>
                       <TextInput style={[styles.fInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} placeholder="CSE" value={form.class_name} onChangeText={t => setForm({...form, class_name: t})} />
                    </View>
                    <View style={{ width: 15 }} />
                    <View style={{ flex: 1 }}>
                       <Text style={styles.fLabel}>SECTION</Text>
                       <TextInput style={[styles.fInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} placeholder="A" value={form.section} onChangeText={t => setForm({...form, section: t})} />
                    </View>
                 </View>

                 <View style={styles.fRow}>
                    <View style={{ flex: 1 }}>
                       <Text style={styles.fLabel}>START TIME</Text>
                       <TextInput style={[styles.fInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} placeholder="09:00 AM" value={form.start_time} onChangeText={t => setForm({...form, start_time: t})} />
                    </View>
                    <View style={{ width: 15 }} />
                    <View style={{ flex: 1 }}>
                       <Text style={styles.fLabel}>END TIME</Text>
                       <TextInput style={[styles.fInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} placeholder="10:00 AM" value={form.end_time} onChangeText={t => setForm({...form, end_time: t})} />
                    </View>
                 </View>

                 <TouchableOpacity style={styles.fSubmit} onPress={handleSave}>
                    <Text style={styles.fSubmitText}>SYNC WITH PLANNER</Text>
                 </TouchableOpacity>
                 <View style={{ height: 40 }} />
              </ScrollView>
           </View>
        </View>
      </Modal>

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
  syncBtn: { padding: 4 },

  dayStrip: { paddingVertical: 15, borderBottomWidth: 1 },
  dayScroll: { paddingHorizontal: 20, gap: 10 },
  dayTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  dayTabText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  listArea: { padding: 20, paddingBottom: 110 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  timelineTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  sCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 18, borderWidth: 1, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03 },
  sTimeBox: { width: 65, alignItems: 'center' },
  sTimeMain: { fontSize: 13, fontWeight: '800' },
  sTimeSub: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  sLine: { width: 1, height: 40, backgroundColor: '#eee', marginHorizontal: 15 },
  sMain: { flex: 1 },
  sSubject: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  sMeta: { flexDirection: 'row', gap: 8 },
  mBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mText: { fontSize: 10, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginHorizontal: 40, lineHeight: 22 },

  fab: { position: 'absolute', bottom: 95, right: 25, backgroundColor: '#6366F1', width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { height: '85%', borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden' },
  modalNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1 },
  mNavTitle: { fontSize: 18, fontWeight: '800' },
  mForm: { padding: 25 },
  fLabel: { fontSize: 9, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10, marginTop: 15 },
  fInput: { padding: 18, borderRadius: 16, borderWidth: 1, fontSize: 15, fontWeight: '700' },
  fRow: { flexDirection: 'row' },
  fSubmit: { backgroundColor: '#6366F1', height: 62, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 35 },
  fSubmitText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});
