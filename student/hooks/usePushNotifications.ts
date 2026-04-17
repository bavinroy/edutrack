import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../app/config';

let Notifications: any = null;

// Initialize Notifications safely
const initNotifications = () => {
  if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
    console.warn("Skipping Push Notifications in Expo Go (Android) due to SDK 53 limitations.");
    return false;
  }
  
  if (!Notifications) {
    try {
      Notifications = require('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (e) {
      console.warn("Could not load expo-notifications:", e);
      return false;
    }
  }
  return true;
};

// Try to initialize on load
initNotifications();

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>(undefined);
  const responseListener = useRef<any>(undefined);

  useEffect(() => {
    if (!Notifications) return;

    registerForPushNotificationsAsync()
      .then(async token => {
        if (token) {
          setExpoPushToken(token);
          const pushSetting = await AsyncStorage.getItem('@settings_push_notifs');
          if (pushSetting !== 'false') {
             uploadTokenToBackend(token);
          }
        }
      })
      .catch(error => {
        console.warn("Failed to register for push notifications:", error?.message);
      });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      const { title, body } = notification.request.content;
      Alert.alert(title || "Notice", body || "You have a new update.");
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log("Notification Tapped:", response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const uploadTokenToBackend = async (token?: string) => {
    const finalToken = token || expoPushToken;
    if (!finalToken) return;

    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) return;

      await axios.post(`${API_BASE_URL}/api/accounts/notifications/push-token/`, 
        { token: finalToken },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (e: any) {
      console.error("Failed to upload push token to backend:", e.message);
    }
  };

  return { expoPushToken, registerToken: uploadTokenToBackend };
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn("Must use physical device for Push Notifications");
    return null;
  }

  if (!Notifications) return null;

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn("User rejected notification permissions");
    return null;
  }

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn("Push notifications: No projectId found in app.json.");
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e: any) {
    console.warn("Push notifications: Failed to get push token:", e.message);
    token = null;
  }

  return token;
}

