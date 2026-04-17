import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";

type FeeItem = {
  name: string;
  amount: number;
};

export default function FeesScreen() {
  const router = useRouter();
  const { isDark, theme: themeColors } = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [fees, setFees] = useState<FeeItem[]>([]);

  const handleSelect = (type: string) => {
    setSelected(type);
    setShowOptions(false);

    if (type === "Day Scholar") {
      setFees([
        { name: "Tuition Fees", amount: 50000 },
        { name: "Bus Fees", amount: 8000 },
        { name: "Exam Fees", amount: 4150 },
        { name: "ISDTP Fees", amount: 5000 },
        { name: "Breakage Fees", amount: 650 },
        { name: "Association Fees", amount: 400 },
      ]);
    } else if (type === "Hosteller") {
      setFees([
        { name: "Tuition Fees", amount: 50000 },
        { name: "Hostel Fees", amount: 30000 },
        { name: "Mess Fees", amount: 3000 },
        { name: "ISDTP Fees", amount: 5000 },
        { name: "Exam Fees", amount: 4150 },
        { name: "Breakage Fees", amount: 650 },
        { name: "Association Fees", amount: 400 },
      ]);
    } else if (type === "7.5 Student") {
      setFees([{ name: "Association Fees", amount: 400 }]);
    }
  };

  const total = fees.reduce((acc, item) => acc + item.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Fees Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeCard}>
            <Text style={styles.cardSubtitle}>Academic Year 2024-25</Text>
            <Text style={styles.cardTitle}>Fee Management</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Category</Text>
          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => setShowOptions(!showOptions)}
          >
            <View style={styles.selectorLeft}>
                <Ionicons name="people-outline" size={20} color="#3B82F6" />
                <Text style={[styles.selectorText, { color: themeColors.text }]}>
                  {selected ? selected : "Choose Your Scholar Type"}
                </Text>
            </View>
            <Ionicons
              name={showOptions ? "chevron-up" : "chevron-down"}
              size={20}
              color={themeColors.subText}
            />
          </TouchableOpacity>

          {showOptions && (
            <View style={[styles.optionsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              {[
                { label: "Day Scholar", icon: "school-outline" },
                { label: "Hosteller", icon: "bed-outline" },
                { label: "7.5 Student", icon: "person-circle-outline" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.optionRow}
                  onPress={() => handleSelect(item.label)}
                >
                  <Ionicons name={item.icon as any} size={18} color={themeColors.subText} />
                  <Text style={[styles.optionLabel, { color: themeColors.text }]}>{item.label}</Text>
                  {selected === item.label && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {fees.length > 0 && (
            <View style={[styles.feeGroup, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              {fees.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.feeItem,
                    { borderBottomColor: themeColors.border },
                    index === fees.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={[styles.feeName, { color: themeColors.subText }]}>{item.name}</Text>
                  <Text style={[styles.feeAmount, { color: themeColors.text }]}>₹{item.amount.toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: themeColors.text }]}>Grand Total</Text>
                <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {fees.length > 0 && (
            <TouchableOpacity style={styles.payBtn} onPress={() => alert("Redirecting to Payment Gateway...")}>
              <Text style={styles.payText}>PROCEED TO PAY</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  backBtn: { padding: 4 },

  scrollBody: { paddingHorizontal: 24, paddingBottom: 100 },
  welcomeCard: { backgroundColor: "#3B82F6", borderRadius: 24, padding: 24, marginBottom: 25, shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  cardSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },
  cardTitle: { color: "#ffffff", fontSize: 24, fontWeight: "800", marginTop: 5 },

  sectionTitle: { fontSize: 13, fontWeight: "800", marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
  selectorBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10 },
  selectorLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectorText: { fontSize: 15, fontWeight: "700" },

  optionsCard: { borderRadius: 16, padding: 8, borderWidth: 1, marginBottom: 20 },
  optionRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, gap: 12 },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: "600" },

  feeGroup: { borderRadius: 24, padding: 20, borderWidth: 1, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05 },
  feeItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15, borderBottomWidth: 1 },
  feeName: { fontSize: 13, fontWeight: "500" },
  feeAmount: { fontSize: 14, fontWeight: "700" },

  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 15, marginTop: 5 },
  totalLabel: { fontSize: 15, fontWeight: "800" },
  totalValue: { fontSize: 18, fontWeight: "900", color: "#3B82F6" },

  payBtn: { backgroundColor: "#111827", borderRadius: 16, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 25 },
  payText: { color: "#ffffff", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
});
