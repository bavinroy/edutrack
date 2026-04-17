import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../app/theme';

let alertListener: any = null;

const originalAlert = Alert.alert;

// Securely override Native Alert and proxy it to our Custom Modal
Alert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
  if (Platform.OS !== 'web' && alertListener) {
    alertListener(title, message, buttons, options);
  } else {
    originalAlert(title, message, buttons, options);
  }
};

export default function GlobalAlert() {
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<any>(null);

  useEffect(() => {
    alertListener = (title: string, message?: string, buttons?: any[], options?: any) => {
      setAlertData({ title, message, buttons, options });
      setVisible(true);
    };
    return () => {
      alertListener = null;
    };
  }, []);

  if (!visible || !alertData) return null;

  const { title, message, buttons } = alertData;

  const titleLower = title?.toLowerCase() || "";
  const isError = titleLower.includes('error') || titleLower.includes('failed') || titleLower.includes('denied');
  const isWarning = titleLower.includes('delete') || titleLower.includes('remove') || titleLower.includes('terminate');
  const isSuccess = titleLower.includes('success');
  
  let iconColor = theme.colors.primary;
  let iconBg = theme.colors.primaryContainer + '30';
  let iconName: any = "information-circle-outline";

  if (isError) {
    iconColor = '#ef4444';
    iconBg = '#fef2f2';
    iconName = "alert-circle-outline";
  } else if (isWarning) {
    iconColor = '#f59e0b';
    iconBg = '#fffbeb';
    iconName = "warning-outline";
  } else if (isSuccess) {
    iconColor = '#10b981';
    iconBg = '#ecfdf5';
    iconName = "checkmark-circle-outline";
  }

  // Handle Logout case directly
  if (titleLower.includes('logout') || titleLower.includes('sign out')) {
      iconColor = '#ef4444';
      iconBg = '#fef2f2';
      iconName = "log-out-outline";
  }

  const defaultButtons = [
    { text: "OK", onPress: () => {} }
  ];

  const actionButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

  const handlePress = (onPress?: () => void) => {
    setVisible(false);
    setTimeout(() => {
        if (onPress) onPress();
    }, 150); // slight delay to ensure modal close animation finishes completely
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalOverlay}>
         <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={28} color={iconColor} />
            </View>
            <Text style={styles.modalTitle}>{title}</Text>
            {message ? <Text style={styles.modalSub}>{message}</Text> : null}
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                {actionButtons.map((btn: any, idx: number) => {
                    const btnText = btn.text || "OK";
                    const btnLower = btnText.toLowerCase();
                    const isDestructive = btn.style === 'destructive' || btnLower === 'delete' || btnLower === 'logout' || btnLower === 'terminate';
                    const isCancel = btn.style === 'cancel' || btnLower === 'cancel';
                    
                    let bg = theme.colors.primary;
                    let tc = '#fff';
                    let bw = 0;
                    
                    if (isCancel) {
                        bg = '#f8fafc';
                        tc = theme.colors.onSurface;
                        bw = 1;
                    } else if (isDestructive) {
                        bg = '#ef4444';
                    }

                    return (
                        <TouchableOpacity 
                            key={idx} 
                            style={[
                                styles.btn, 
                                { backgroundColor: bg, borderColor: '#e2e8f0', borderWidth: bw }
                            ]} 
                            onPress={() => handlePress(btn.onPress)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.btnTxt, { color: tc }]}>{btnText}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
         </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 20 },
    modalIconBox: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 8, textAlign: 'center' },
    modalSub: { fontSize: 13, fontWeight: '500', color: theme.colors.outline, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    btn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
    btnTxt: { fontSize: 14, fontWeight: '700' }
});
