import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

export default function StaffProfileScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<any>({
    username: "",
    email: "",
    phone_number: "",
    department: "",
    designation: "",
    staff_id: "",
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Fetch token and profile on mount
  useEffect(() => {
    const fetchTokenAndProfile = async () => {
      const storedToken = await AsyncStorage.getItem("accessToken");
      if (!storedToken) return;
      setToken(storedToken);
      await fetchProfile(storedToken);
    };
    fetchTokenAndProfile();
  }, []);

  // Fetch profile function (student-style)
  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch("http://10.193.11.125:8000/api/staff/profile/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }

      if (res.ok) {
        if (data.avatar && typeof data.avatar === "string" && !data.avatar.startsWith("http")) {
          data.avatar = `http://10.193.11.125:8000${data.avatar}`;
        }

        setProfile(data);
        if (data.avatar) setAvatarUri(data.avatar);
      } else {
        Alert.alert("Error fetching profile", data.detail || "Unknown error");
      }
    } catch (err) {
      console.error("Network error:", err);
      Alert.alert("Network Error", "Failed to connect to server");
    }
  };

  // Image picker functions
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied", "We need access to your gallery.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied", "We need access to your camera.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleEditAvatar = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Camera", "Gallery"], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhotoWithCamera();
          else if (buttonIndex === 2) pickImageFromGallery();
        }
      );
    } else {
      Alert.alert(
        "Select Image",
        "Choose an option",
        [
          { text: "Camera", onPress: takePhotoWithCamera },
          { text: "Gallery", onPress: pickImageFromGallery },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("phone_number", profile.phone_number);
      formData.append("department", profile.department);
      formData.append("designation", profile.designation);

      if (avatarUri) {
        const filename = avatarUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;
        formData.append("avatar", { uri: avatarUri, name: filename, type } as any);
      }

      const res = await fetch("http://10.193.11.125:8000/api/staff/profile/update/", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Profile updated successfully");
        setProfile({ ...profile, ...data });
        if (data.avatar) setAvatarUri(data.avatar);
      } else {
        Alert.alert("Error", data.detail || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNav = (route: string) => router.push(route as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>📝 Staff Profile</Text>

        <View style={styles.avatarContainer}>
          <Image
            source={avatarUri ? { uri: avatarUri } : require("../../assets/images/react-logo.png")}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIcon} onPress={handleEditAvatar}>
            <Ionicons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ width: "100%" }}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={profile.username} editable={false} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={profile.email} editable={false} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={profile.phone_number}
            onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
          />

          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            value={profile.department}
            onChangeText={(text) => setProfile({ ...profile, department: text })}
          />

          <Text style={styles.label}>Designation</Text>
          <TextInput
            style={styles.input}
            value={profile.designation}
            onChangeText={(text) => setProfile({ ...profile, designation: text })}
          />

        </View>

        <View style={{ width: "100%" }}>
          <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
            <Text style={styles.buttonText}>{loading ? "Updating..." : "Save changes"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => router.push("/staff/changepassword")}>
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => handleNav("/staff/dashboard")}>
          <Ionicons name="home-outline" size={24} color={pathname === "/staff/dashboard" ? "#fff" : "#ccc"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/staff/notice")}>
          <Ionicons name="easel-outline" size={24} color={pathname === "/staff/notice" ? "#fff" : "#ccc"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/staff/profile")}>
          <Ionicons name="person-outline" size={24} color={pathname === "/staff/profile" ? "#fff" : "#ccc"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center", paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  editIcon: { position: "absolute", right: 0, bottom: 0, backgroundColor: "#00B9BD", borderRadius: 50, padding: 6 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 5, marginTop: 8, textAlign: "left" },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, backgroundColor: "#f9f9f9", marginBottom: 10 },
  button: {
    backgroundColor: "#00B9BD",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#00B9BD", paddingVertical: 10, position: "absolute", bottom: 0, left: 0, right: 0 },
});
