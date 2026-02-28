const DEFAULT_API_BASE_URL = "http://192.168.1.15:8080";

function requiredEnv(value: string | undefined, fallback: string) {
  if (value && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

export const env = {
  name: process.env.EXPO_PUBLIC_ENV ?? "development",
  apiBaseUrl: requiredEnv(
    process.env.EXPO_PUBLIC_API_BASE_URL,
    DEFAULT_API_BASE_URL
  ),
};

