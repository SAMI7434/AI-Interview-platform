const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultProdApiBaseUrl = "https://ai-interview-platform-y4fq.onrender.com";

const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser
  ? ["localhost", "127.0.0.1"].includes(window.location.hostname)
  : false;

export const getApiBaseUrl = (): string => {
  const resolvedBaseUrl = rawApiBaseUrl || (!isLocalHost ? defaultProdApiBaseUrl : "");

  if (!resolvedBaseUrl) {
    throw new Error("VITE_API_BASE_URL is missing. Set it in your environment variables.");
  }

  if (!isLocalHost && /localhost|127\.0\.0\.1/.test(resolvedBaseUrl)) {
    throw new Error(
      "VITE_API_BASE_URL points to localhost in production. Set it to your deployed backend URL."
    );
  }

  return resolvedBaseUrl.replace(/\/$/, "");
};
