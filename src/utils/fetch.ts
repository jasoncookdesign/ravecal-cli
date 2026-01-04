// src/utils/fetch.ts
import axios, { AxiosRequestConfig } from "axios";

/**
 * Wrapper around axios.get() that:
 * - Applies a default User-Agent (reduces likelihood of bot blocking)
 * - Ensures consistent error handling
 * - Allows you to pass additional axios config if needed
 */
export async function fetchHtml(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        // Default UA to blend in; can be adjusted if sites get stricter.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...config.headers,
      },
      timeout: 15000, // Prevent hanging too long
      ...config,
    });

    return response.data;
  } catch (err: any) {
    // Provide cleaner error messages for CLI output
    const status = err.response?.status;
    const statusText = err.response?.statusText;
    const details =
      status ? `${status} ${statusText || ""}`.trim() : err.message;
    throw new Error(`Failed to fetch ${url}: ${details}`);
  }
}
