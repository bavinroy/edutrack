import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, SafeAreaView, ImageBackground,
    KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from './config';
import EduLoading from '../components/EduLoading';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRequestOTP = async () => {
        if (!username || !email) return Alert.alert("Error", "Please enter both Username/Reg No and Email");
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/accounts/password-reset/request/`, { username, email });
            setStep(2);
            Alert.alert("Success", "An OTP has been sent to your email.");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Failed to request OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) return Alert.alert("Error", "Please enter the OTP");
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/accounts/password-reset/verify/`, { username, otp });
            setStep(3);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) return Alert.alert("Error", "Please fill in all fields");
        if (newPassword !== confirmPassword) return Alert.alert("Error", "Passwords do not match");

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/accounts/password-reset/confirm/`, {
                username, otp, new_password: newPassword, confirm_password: confirmPassword
            });
            Alert.alert("Success", "Your password has been reset successfully. You can now login.");
            router.replace("/login");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require("../assets/images/background.jpeg")}
            style={styles.background}
            imageStyle={{ resizeMode: "stretch" }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, width: "100%" }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                        <Text style={{ color: '#fff', marginLeft: 5, fontWeight: 'bold' }}>Back</Text>
                    </TouchableOpacity>

                    {/* Logo & Title */}
                    <View style={styles.headerContainer}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require("../assets/images/logo.png")}
                                style={{ width: 60, height: 60, resizeMode: 'contain' }}
                            />
                        </View>
                        <Text style={styles.title}>EduTrack</Text>
                    </View>

                    <View style={styles.cardContainer}>
                        <Text style={styles.cardTitle}>
                            {step === 1 ? 'Reset Password' : step === 2 ? 'Verify OTP' : 'New Password'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 1 ? 'Enter your details to receive an OTP via email.' :
                                step === 2 ? `Enter the 6-digit OTP sent to ${email}.` :
                                    'Create a strong new password.'}
                        </Text>

                        <View style={styles.formContent}>
                            {step === 1 && (
                                <>
                                    <Text style={styles.label}>Register No / Username</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="person-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                                        <TextInput
                                            placeholder="Enter Register No or Username"
                                            style={styles.inputField}
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                            placeholderTextColor="#999"
                                        />
                                    </View>

                                    <Text style={styles.label}>Registered Email</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="mail-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                                        <TextInput
                                            placeholder="Enter your email"
                                            style={styles.inputField}
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <Text style={styles.label}>6-Digit OTP</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="key-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                                        <TextInput
                                            placeholder="Enter OTP"
                                            style={styles.inputField}
                                            value={otp}
                                            onChangeText={setOtp}
                                            keyboardType="numeric"
                                            maxLength={6}
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                                        <TextInput
                                            placeholder="Enter New Password"
                                            style={styles.inputField}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                    <Text style={styles.label}>Confirm New Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                                        <TextInput
                                            placeholder="Confirm New Password"
                                            style={styles.inputField}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </>
                            )}

                            {loading ? (
                                <EduLoading size={40} />
                            ) : (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={step === 1 ? handleRequestOTP : step === 2 ? handleVerifyOTP : handleResetPassword}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: "center",
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 80,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 5,
        textAlign: 'center'
    },
    cardContainer: {
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        marginBottom: 40,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center'
    },
    formContent: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        marginBottom: 20,
        height: 50,
    },
    inputField: {
        flex: 1,
        height: '100%',
        color: '#333',
    },
    actionButton: {
        backgroundColor: '#0056D2',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#0056D2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
