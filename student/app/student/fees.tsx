import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

type FeeItem = {
  name: string;
  amount: number;
};

export default function FeesScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [showOptions, setShowOptions] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [showMenu, setShowMenu] = useState(false);

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

  const handleNav = (path: string) => {
    router.push(path as any);
  };

  const total = fees.reduce((acc, item) => acc + item.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../assets/images/back.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          {/* 🔹 Header */}
          <TouchableOpacity
            style={styles.header}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons name="arrow-back" size={22} color="#30e4de" />
            <Text style={styles.headerTitle}>FEES DETAILS</Text>
            <Ionicons
              name={showMenu ? "chevron-up" : "chevron-down"}
              size={22}
              color="#30e4de"
            />
          </TouchableOpacity>

          {/* 🔹 Dropdown Menu */}
          {showMenu && (
            <View style={styles.menuBox}>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => router.push("/student/documents")}
              >
                <Ionicons name="cash-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>Materials</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => router.push("/student/time table")}
              >
                <Ionicons name="ribbon-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>Time Table</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => router.push("/student/letter")}
              >
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>Forms</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => router.push("/student/requests")}
              >
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>Request</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🔹 Scholar Selector */}
          <TouchableOpacity
            style={styles.chooseBtn}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Text style={styles.btnText}>
              {selected ? selected : "Choose Your Scholar"}
            </Text>
            <Ionicons
              name={showOptions ? "chevron-up" : "chevron-down"}
              size={20}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>

          {showOptions && (
            <View style={styles.menuBox}>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => handleSelect("Day Scholar")}
              >
                <Ionicons name="school-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>Day Scholar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => handleSelect("Hosteller")}
              >
                <Ionicons name="bed-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>Hosteller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => handleSelect("7.5 Student")}
              >
                <Ionicons name="person-circle-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>7.5 Student</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🔹 Fees Table */}
          {selected && (
            <View style={styles.table}>
              <View style={styles.rowHeader}>
                <Text style={styles.cellHeader}>Fee Allocation</Text>
                <Text style={styles.cellHeader}>Amount</Text>
              </View>

              <FlatList
                data={fees}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false} // ✅ Prevent nested scrolling error
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <Text style={styles.cell}>{item.name}</Text>
                    <Text style={styles.cell}>₹{item.amount}</Text>
                  </View>
                )}
              />

              {/* Total */}
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.cellHeader}>Total</Text>
                <Text style={styles.cellHeader}>₹{total}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 🔹 Fixed Bottom Navigation */}
        <View style={styles.bottomNav}>
          <Ionicons
            name="home"
            size={24}
            color={pathname === "/student/dashboard" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/dashboard")}
          />
          <Ionicons
            name="search"
            size={24}
            color={pathname === "/student/search" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/search")}
          />
          <Ionicons
            name="desktop-outline"
            size={24}
            color={pathname === "/student/notice" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/notice")}
          />
          <Ionicons
            name="download-outline"
            size={24}
            color={pathname === "/student/downloads" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/downloads")}
          />
          <Ionicons
            name="person-circle-outline"
            size={24}
            color={pathname === "/student/profile" ? "#0e0e0dff" : "#fff"}
            onPress={() => handleNav("/student/profile")}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#30e4de" },
  chooseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    backgroundColor: "#30e4de",
    borderRadius: 8,
    marginBottom: 12,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  menuBox: {
    backgroundColor: "#eff4f4",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 5,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "80%",
    backgroundColor: "#30e4de",
    borderRadius: 8,
    marginVertical: 6,
    justifyContent: "center",
  },
  menuText: { color: "#fff", fontSize: 16, marginLeft: 8, fontWeight: "600" },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingBottom: 8,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#43a047",
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  totalRow: { backgroundColor: "#e8f5e9" },
  cell: { fontSize: 15 },
  cellHeader: { fontWeight: "bold", fontSize: 16, color: "#fff" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#30e4de",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});
