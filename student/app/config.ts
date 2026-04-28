// Automatically use the EXPO_PUBLIC_API_URL environment variable if set.
// Otherwise, fallback to the local development IP.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://edutrack-1vq9.onrender.com";
