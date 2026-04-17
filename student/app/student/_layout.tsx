import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import StudentBottomNav from "../../components/StudentBottomNav";

export default function StudentLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <StudentBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
