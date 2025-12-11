import { Stack } from "expo-router";
import { SafeAreaView, StyleSheet, Platform, StatusBar } from "react-native";

export default function Layout() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false, // removes the default header
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, // safe padding for Android
  },
});
