const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser
  ? ["localhost", "127.0.0.1"].includes(window.location.hostname)
  : false;

export const getApiBaseUrl = (): string => {
  if (!rawApiBaseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is missing. Set it in your environment variables."
    );
  }

  if (!isLocalHost && /localhost|127\.0\.0\.1/.test(rawApiBaseUrl)) {
    throw new Error(
      "VITE_API_BASE_URL points to localhost in production. Set it to your deployed backend URL."
    );
  }

  return rawApiBaseUrl.replace(/\/$/, "");
};
