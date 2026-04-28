// Automatically use the EXPO_PUBLIC_API_URL environment variable if set.
// Otherwise, fallback to the local development IP.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.25.224.125:8000";
