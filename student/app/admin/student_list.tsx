import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  StatusBar,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

type Student = {
  id: number;
  user: {
     id: number;
     username: string;
     email: string;
     first_name: string;
     last_name: string;
  };
  roll_no: string;
  register_number: string;
  year: number;
  semester: number;
  section: string;
  course: string;
  department_name: string;
  avatar_url: string;
};

export default function StudentListScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState({
     year: "",
     dept: ""
  });

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return router.replace("/login");

      const res = await axios.get(`${API_BASE_URL}/api/academic/students/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  useEffect(() => {
    let result = students;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.user.username.toLowerCase().includes(q) ||
          s.user.first_name.toLowerCase().includes(q) ||
          s.user.last_name.toLowerCase().includes(q) ||
          s.roll_no.toLowerCase().includes(q) ||
          (s.register_number && s.register_number.toLowerCase().includes(q))
      );
    }

    if (filters.year !== "") {
       result = result.filter(s => s.year.toString() === filters.year);
    }

    if (filters.dept !== "") {
       result = result.filter(s => s.department_name && s.department_name.includes(filters.dept));
    }

    setFilteredStudents(result);
  }, [searchQuery, students, filters]);

  const renderStudentItem = ({ item }: { item: Student }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={() => router.push({ pathname: "/admin/student_details", params: { id: item.id } } as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#F9731615' }]}>
            <Text style={[styles.avatarInitial, { color: '#F97316' }]}>{item.user.first_name ? item.user.first_name[0] : item.user.username[0]}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: themeColors.text }]}>
            {item.user.first_name} {item.user.last_name}
          </Text>
          <Text style={[styles.metaData, { color: themeColors.subText }]}>{item.roll_no} • {item.department_name}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: '#F9731610' }]}>
               <Text style={[styles.tagText, { color: '#F97316' }]}>YEAR {item.year}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#6366F110' }]}>
               <Text style={[styles.tagText, { color: '#6366F1' }]}>SEM {item.semester}</Text>
            </View>
            {item.section && (
              <View style={[styles.tag, { backgroundColor: '#8B5CF610' }]}>
                <Text style={[styles.tagText, { color: '#8B5CF6' }]}>SEC {item.section}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.outline} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Students</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>{students.length} TOTAL REGISTERED</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <Ionicons name="search" size={20} color={themeColors.subText} style={{ marginLeft: 15 }} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search by name, roll no, reg no..."
              placeholderTextColor={themeColors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 10 }}>
             <TouchableOpacity 
               style={[styles.filterChip, filters.year === "" && styles.filterChipActive, { borderColor: themeColors.border }]} 
               onPress={() => setFilters({...filters, year: ""})}
             >
                <Text style={[styles.filterText, filters.year === "" && styles.filterTextActive, { color: themeColors.subText }]}>All Years</Text>
             </TouchableOpacity>
             {[1, 2, 3, 4].map(y => (
                <TouchableOpacity 
                  key={y}
                  style={[styles.filterChip, filters.year === y.toString() && styles.filterChipActive, { borderColor: themeColors.border }]} 
                  onPress={() => setFilters({...filters, year: y.toString()})}
                >
                   <Text style={[styles.filterText, filters.year === y.toString() && styles.filterTextActive, { color: themeColors.subText }]}>Year {y}</Text>
                </TouchableOpacity>
             ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.center}><EduLoading size={60} /></View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStudentItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStudents(); }} colors={["#F97316"]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="account-search-outline" size={80} color={themeColors.border} />
                <Text style={[styles.emptyText, { color: themeColors.subText }]}>No students found matching your criteria.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  headerTitleBox: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },

  searchSection: { paddingHorizontal: 20, marginBottom: 5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, height: 50, marginBottom: 15 },
  searchInput: { flex: 1, paddingHorizontal: 15, fontSize: 14, fontWeight: '600' },
  filterScroll: { marginBottom: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  filterChipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterText: { fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#fff' },

  listContent: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 20 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 24, fontWeight: '900' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  metaData: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 20, paddingHorizontal: 50, lineHeight: 22 },
});
