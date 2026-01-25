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
import { API_BASE_URL } from "../config";

export default function StudentProfileScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<any>({
    username: "",
    email: "",
    phone_number: "",
    department: "",
    year: "",
    student_id: "",
    display_name: "",
    first_name: "",
    last_name: "",
    date_joined: "",
    role: "",
    last_login: "",
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenAndProfile = async () => {
      const storedToken = await AsyncStorage.getItem("accessToken");
      if (!storedToken) return;
      setToken(storedToken);
      await fetchProfile(storedToken);
    };
    fetchTokenAndProfile();
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/profile/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (res.ok) {
        if (data.avatar && typeof data.avatar === "string" && !data.avatar.startsWith("http")) {
          data.avatar = `${API_BASE_URL}${data.avatar}`;
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

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission denied", "We need access to your gallery.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ images only
    });

    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission denied", "We need access to your camera.");

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], // ✅ images only
    });

    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleEditAvatar = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Camera", "Gallery"],
          cancelButtonIndex: 0,
        },
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

  const handleUpdateProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (profile.phone_number) formData.append("phone_number", profile.phone_number);
      if (profile.department) formData.append("department", profile.department);
      if (profile.year) formData.append("year", String(profile.year));

      if (avatarUri && !avatarUri.startsWith("http")) { // Only upload if it's a new local URI
        const filename = avatarUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;
        if (type === 'image/jpg') type = 'image/jpeg'; // Common fix

        formData.append("avatar", { uri: avatarUri, name: filename, type } as any);
      }

      const res = await fetch(`${API_BASE_URL}/api/student/profile/update/`, {
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
        const errorMsg = data.detail || (data.errors ? JSON.stringify(data.errors, null, 2) : "Failed to update profile");
        Alert.alert("Data Error", errorMsg);
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
        <Text style={styles.title}>🎓 Student Profile</Text>

        <View style={styles.avatarContainer}>
          <Image
            source={avatarUri ? { uri: avatarUri } : require("../../assets/images/react-logo.png")}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIcon} onPress={handleEditAvatar}>
            <Ionicons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={{ width: "100%" }}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={profile.display_name || "N/A"} editable={false} />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: "48%" }}>
              <Text style={styles.label}>First Name</Text>
              <TextInput style={styles.input} value={profile.first_name || "N/A"} editable={false} />
            </View>
            <View style={{ width: "48%" }}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} value={profile.last_name || "N/A"} editable={false} />
            </View>
          </View>

          <Text style={styles.label}>Role</Text>
          <TextInput style={styles.input} value={profile.role || "Student"} editable={false} />

          <Text style={styles.label}>User Name</Text>
          <TextInput style={styles.input} value={profile.username} editable={false} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={profile.email} editable={false} />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={profile.phone_number}
            onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
          />

          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            value={profile.department}
            editable={false} // Student cannot change department
          />

          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={profile.year ? String(profile.year) : ""}
            editable={false} // Already false, but ensuring consistency
          />

          <Text style={styles.label}>Student ID</Text>
          <TextInput style={styles.input} value={profile.student_id} editable={false} />

          <Text style={styles.label}>Date Joined</Text>
          <TextInput
            style={styles.input}
            value={profile.date_joined ? new Date(profile.date_joined).toLocaleDateString() : "N/A"}
            editable={false}
          />

          <Text style={styles.label}>Last Login</Text>
          <TextInput
            style={styles.input}
            value={profile.last_login ? new Date(profile.last_login).toLocaleString() : "Never"}
            editable={false}
          />
        </View>

        {/* Buttons */}
        <View style={{ width: "100%" }}>
          <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
            <Text style={styles.buttonText}>{loading ? "Updating..." : "Save changes"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => router.push("/student/changepassword")}>
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#FF3B30", marginTop: 15 }]}
            onPress={async () => {
              await AsyncStorage.clear();
              router.replace("/login");
            }}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => handleNav("/student/dashboard")}>
          <Ionicons name="home-outline" size={24} color={pathname === "/student/dashboard" ? "#fff" : "#ccc"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/search")}>
          <Ionicons name="search-outline" size={24} color={pathname === "/student/search" ? "#fff" : "#ccc"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/notice")}>
          <Ionicons name="easel-outline" size={24} color={pathname === "/student/notice" ? "#fff" : "#ccc"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/downloads")}>
          <Ionicons name="download-outline" size={24} color={pathname === "/student/downloads" ? "#fff" : "#ccc"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav("/student/profile")}>
          <Ionicons name="person-outline" size={24} color={pathname === "/student/profile" ? "#fff" : "#ccc"} />
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
  editIcon: { position: "absolute", right: 0, bottom: 0, backgroundColor: "#007BFF", borderRadius: 50, padding: 6 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 5, marginTop: 8, textAlign: "left" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
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
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#00B9BD",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
