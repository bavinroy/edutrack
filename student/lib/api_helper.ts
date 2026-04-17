import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../app/config";
import { Alert } from 'react-native';
import { useRouter } from "expo-router";

export const fetchWithAuth = async (url: string, options: any = {}) => {
    let token = await AsyncStorage.getItem("accessToken");

    // Add token header
    const headers = {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : undefined,
    };

    try {
        let res = await fetch(url, { ...options, headers });

        // Handle token expiration
        if (res.status === 401) {
            console.log("Token expired, attempting refresh. url:", url);
            const refresh = await AsyncStorage.getItem("refreshToken"); // Assuming refresh token stored here

            if (!refresh) {
                throw new Error("Session expired (No refresh token)");
            }

            const refreshRes = await fetch(`${API_BASE_URL}/api/accounts/token/refresh/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh }),
            });

            if (refreshRes.ok) {
                const newTokens = await refreshRes.json();
                await AsyncStorage.setItem("accessToken", newTokens.access); // Ensure consistent key naming
                token = newTokens.access;

                // Retry original request
                headers.Authorization = `Bearer ${token}`;
                res = await fetch(url, { ...options, headers });
            } else {
                throw new Error("Session expired (Refresh failed)");
            }
        }

        return res;
    } catch (error: any) {
        throw error;
    }
};
