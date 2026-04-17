import { StyleSheet, View, LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import GlobalAlert from "../components/GlobalAlert";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { Stack as ExpoStack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";

LogBox.ignoreLogs(['warnOfExpoGoPushUsage']);

export default function Layout() {
  usePushNotifications();

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ExpoStack
          screenOptions={{
            headerShown: false,
          }}
        />
        <GlobalAlert />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
