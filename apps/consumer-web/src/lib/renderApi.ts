import { supabase } from "./supabase";

const RENDER_SERVER_URL = "https://fixit-backend.onrender.com"; // Default URL, can be configured via env var

/**
 * Custom fetch client that automatically attaches the user's active session
 * authentication token to the 'Authorization: Bearer' HTTP header.
 */
export const renderApi = {
  async post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async get(endpoint: string) {
    return this.request(endpoint, {
      method: "GET",
    });
  },

  async request(endpoint: string, options: RequestInit = {}) {
    let token: string | undefined;

    // Retrieve active session token
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch (e) {
      console.error("Failed to get session token for renderApi request", e);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${RENDER_SERVER_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Attempt to extract error message from JSON response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, just use status
        }
        throw new Error(errorMessage);
      }

      // Return JSON if there's content
      if (response.status !== 204 && response.headers.get("content-type")?.includes("application/json")) {
        return await response.json();
      }

      return await response.text();
    } catch (error: any) {
      console.error(`[renderApi] Error calling ${endpoint}:`, error);
      throw error;
    }
  }
};
