import { API_BASE_URL } from "./config.js";

/**
 * Sends a request to the backend and returns the parsed JSON response.
 *
 * Example:
 * const result = await apiRequest("/recommendation", {
 *   method: "POST",
 *   body: JSON.stringify({ age: 45, bmi: 27.5 }),
 * });
 */
export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data;
}

/** Convenience function for GET requests. */
export function getJson(endpoint) {
  return apiRequest(endpoint, { method: "GET" });
}

/** Convenience function for POST requests. */
export function postJson(endpoint, requestBody) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

