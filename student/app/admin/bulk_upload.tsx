import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Modal,
    StatusBar,
    Dimensions,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import EduLoading from "../../components/EduLoading";

const { width } = Dimensions.get("window");

export default function BulkUploadScreen() {
    const router = useRouter();
    const { isDark, theme: themeColors } = useTheme();
    
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [loading, setLoading] = useState(false);
    const [helpVisible, setHelpVisible] = useState(false);

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"],
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
            }
        } catch (err) { 
            // console.log(err); 
        }
    };

    const handleUpload = async () => {
        if (!file) return Alert.alert("No File Selected", "Please select a spreadsheet file to upload.");

        Alert.alert(
            "Confirm Upload",
            `Do you want to upload and create accounts for all users in "${file.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Upload Now", style: "default", onPress: processUpload },
            ]
        );
    };

    const processUpload = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const formData = new FormData();
            formData.append("file", {
                uri: file?.uri,
                name: file?.name || "users.xlsx",
                type: file?.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            } as any);

            const res = await axios.post(`${API_BASE_URL}/api/accounts/bulk-upload/`, formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });

            Alert.alert("Upload Complete", res.data.message);
            setFile(null);
        } catch (err: any) {
            const errorData = err.response?.data;
            if (err.response?.status === 207) {
                const errorMsg = errorData.errors?.slice(0, 3).join("\n") + (errorData.errors?.length > 3 ? "\n..." : "");
                Alert.alert("Some Warnings", `${errorData.message}\n\nDetails:\n${errorMsg}`);
            } else {
                Alert.alert("Upload Error", errorData?.detail || errorData?.error || "Could not process the file. Please check the format.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.headerBg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: themeColors.border }}>
        <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Bulk Upload</Text>
            <Text style={[styles.headerSub, { color: themeColors.subText }]}>ADD MULTIPLE USERS</Text>
          </View>
          <TouchableOpacity onPress={() => setHelpVisible(true)} style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Info Strip */}
          <View style={[styles.heroSuite, { borderBottomColor: themeColors.border }]}>
            <View style={[styles.tokenBox, { backgroundColor: '#6366F115' }]}>
              <MaterialCommunityIcons name="file-upload-outline" size={54} color="#6366F1" />
            </View>
            <Text style={[styles.heroTitle, { color: themeColors.text }]}>Import Users</Text>
            <Text style={[styles.heroDesc, { color: themeColors.subText }]}>
              Upload a spreadsheet (.xlsx or .csv) to create multiple accounts at once.
            </Text>
          </View>

          {/* Upload Area */}
          <View style={{ padding: 25 }}>
          <View style={styles.injectionShell}>
            <Text style={[styles.shellLab, { color: themeColors.subText }]}>CHOOSE FILE</Text>
            <TouchableOpacity
              style={[styles.injectionZone, { backgroundColor: themeColors.card, borderColor: themeColors.border }, file && { borderColor: '#6366F1', borderStyle: 'solid', backgroundColor: '#6366F105' }]}
              onPress={pickFile}
              activeOpacity={0.7}
            >
              <View style={[styles.zoneOrb, { backgroundColor: file ? '#6366F115' : isDark ? '#334155' : '#F8FAFC' }]}>
                <Ionicons
                  name={file ? "checkmark-circle" : "document-text-outline"}
                  size={36}
                  color={file ? "#6366F1" : themeColors.outline}
                />
              </View>
              <Text style={[styles.zoneTxt, { color: file ? '#6366F1' : themeColors.text }]}>
                {file ? file.name : "Tap to select file"}
              </Text>
              {file ? (
                <View style={styles.readyPill}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.readyTxt}>FILE READY</Text>
                </View>
              ) : (
                <Text style={[styles.formatTxt, { color: themeColors.outline }]}>XLSX OR CSV FILES ONLY</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.executeBtn, (!file || loading) && { opacity: 0.5 }]}
              onPress={handleUpload}
              disabled={!file || loading}
              activeOpacity={0.8}
            >
              {loading ? <EduLoading size={25} /> :
                <>
                  <Text style={styles.executeTxt}>UPLOAD NOW</Text>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                </>}
            </TouchableOpacity>
          </View>
          </View>

          {/* Steps */}
          <View style={[styles.protocolStack, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.protocolLab, { color: themeColors.text }]}>HOW IT WORKS</Text>

            {[
              { id: '1', title: 'Check Data', desc: 'We check if the file format and details are correct.' },
              { id: '2', title: 'Check Existing Users', desc: 'We ensure no duplicate accounts are created.' },
              { id: '3', title: 'Create Accounts', desc: 'New accounts are created with a default password.' }
            ].map((step, idx) => (
              <View key={step.id} style={[styles.protocolItem, idx === 2 && { marginBottom: 0 }]}>
                <View style={[styles.protocolStep, { backgroundColor: '#6366F115' }]}><Text style={styles.stepNum}>{step.id}</Text></View>
                <View style={styles.protocolBody}>
                  <Text style={[styles.pTitle, { color: themeColors.text }]}>{step.title}</Text>
                  <Text style={[styles.pDesc, { color: themeColors.subText }]}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Format Help Modal */}
        <Modal visible={helpVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <View style={styles.modalIndicator} />
              <View style={{ marginBottom: 25 }}>
              <View style={styles.modalHdr}>
                <Text style={styles.modalRole}>FILE FORMAT</Text>
                <TouchableOpacity onPress={() => setHelpVisible(false)}>
                  <Ionicons name="close-circle" size={28} color={themeColors.outline} />
                </TouchableOpacity>
              </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                <Text style={[styles.guideText, { color: themeColors.subText }]}>Your spreadsheet must have the following columns precisely as named below:</Text>

                {[
                  { key: 'username', req: true, desc: 'ID or Enrollment Number' },
                  { key: 'email', req: true, desc: 'Email Address' },
                  { key: 'role', req: true, desc: 'ADMIN, STAFF, or STUDENT' },
                  { key: 'department', req: false, desc: 'Department Name' }
                ].map((field) => (
                  <View key={field.key} style={[styles.fieldCard, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: themeColors.border }]}>
                    <Text style={[styles.fieldKey, { color: themeColors.text }]}>{field.key} {field.req && <Text style={{ color: '#EF4444' }}>*</Text>}</Text>
                    <Text style={[styles.fieldVal, { color: themeColors.subText }]}>{field.desc}</Text>
                  </View>
                ))}

                <View style={[styles.intelBox, { backgroundColor: '#6366F110', borderColor: '#6366F130' }]}>
                  <Ionicons name="information-circle" size={24} color="#6366F1" />
                  <Text style={[styles.intelTxt, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>Tip: Use <Text style={{ fontWeight: '900' }}>Default@123</Text> as the default password for new users.</Text>
                </View>

                <TouchableOpacity style={styles.ackBtn} onPress={() => setHelpVisible(false)}>
                  <Text style={styles.ackTxt}>GOT IT</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
    headerTitleBox: { flex: 1, marginLeft: 10 },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },
    helpBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F115', justifyContent: 'center', alignItems: 'center' },

    scrollContent: { paddingBottom: 60 },

    heroSuite: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, marginHorizontal: 25 },
    tokenBox: { width: 96, height: 96, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 4 },
    heroTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
    heroDesc: { fontSize: 13, textAlign: 'center', lineHeight: 22, paddingHorizontal: 30, marginTop: 12, fontWeight: '600' },

    injectionShell: {  },
    shellLab: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginLeft: 6, textTransform: 'uppercase' },
    injectionZone: { height: 230, borderRadius: 36, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 24, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
    zoneOrb: { width: 70, height: 70, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    zoneTxt: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
    formatTxt: { fontSize: 10, fontWeight: '900', marginTop: 12, letterSpacing: 1 },
    readyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366F1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 18, gap: 8 },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    readyTxt: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

    executeBtn: { backgroundColor: '#6366F1', height: 68, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 35, elevation: 12, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15 },
    btnIconBox: { width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    executeTxt: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },

    protocolStack: { marginHorizontal: 25, marginTop: 20, marginBottom: 20, borderRadius: 32, padding: 26, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1 },
    protocolLab: { fontSize: 11, fontWeight: '900', marginBottom: 25, letterSpacing: 1.5, textTransform: 'uppercase' },
    protocolItem: { flexDirection: 'row', gap: 20, marginBottom: 28 },
    protocolStep: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    stepNum: { color: '#6366F1', fontWeight: '900', fontSize: 11 },
    protocolBody: { flex: 1 },
    pTitle: { fontSize: 16, fontWeight: '800' },
    pDesc: { fontSize: 13, marginTop: 4, lineHeight: 20, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 28, maxHeight: '85%' },
    modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalRole: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 1.5 },
    guideText: { fontSize: 14, lineHeight: 22, marginBottom: 25, fontWeight: '600' },
    fieldCard: { padding: 18, borderRadius: 22, marginBottom: 14, borderWidth: 1 },
    fieldKey: { fontSize: 15, fontWeight: '800' },
    fieldVal: { fontSize: 13, marginTop: 6, fontWeight: '600' },
    intelBox: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 24, marginVertical: 25, borderWidth: 1 },
    intelTxt: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 18 },
    ackBtn: { backgroundColor: '#1E293B', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    ackTxt: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});
