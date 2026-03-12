import { createClient, API_BASE } from "@/lib/supabase/client";
import type { ProgressMap } from "@/types";

/**
 * Get a fresh access token, refreshing the session if needed.
 * Returns null if the session is invalid (caller should redirect to login).
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (!error && data?.session?.access_token) {
    return data.session.access_token;
  }

  // Try refreshing
  if (data?.session?.refresh_token) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed?.session?.access_token) {
      return refreshed.session.access_token;
    }
  }

  return null;
}

/** Authenticated fetch wrapper. Returns the Response or throws. */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Session expired");
  }

  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(options.headers || {})),
    Authorization: `Bearer ${token}`,
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export const api = {
  goals: {
    async list() {
      const res = await authFetch("/api/goals");
      if (!res.ok) throw new Error("Failed to load goals");
      return res.json();
    },

    async get(goalId: string) {
      const res = await authFetch(`/api/goals/${goalId}`);
      if (!res.ok) throw new Error("Failed to load goal");
      return res.json();
    },

    async create(data: Record<string, unknown>) {
      const res = await authFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save goal");
      }
      return res.json();
    },

    async update(goalId: string, data: Record<string, unknown>) {
      const res = await authFetch(`/api/goals/${goalId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update goal");
      }
      return res.json();
    },

    async delete(goalId: string) {
      const res = await authFetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    },

    async saveProgress(goalId: string, progress: ProgressMap) {
      const res = await authFetch(`/api/goals/${goalId}/progress`, {
        method: "POST",
        body: JSON.stringify({ progress }),
      });
      if (!res.ok) throw new Error("Failed to save progress");
      return res.json();
    },
  },

  plan: {
    async generate(data: Record<string, unknown>) {
      const res = await authFetch("/api/generate-plan", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired");
        const err = await res.json();
        throw new Error(err.error || "Failed to generate plan");
      }
      return res.json();
    },
  },

  user: {
    async delete(token: string) {
      const res = await fetch(`${API_BASE}/api/user/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete account");
      }
      return res.json();
    },

    async sendTestEmail(token: string) {
      const res = await fetch(`${API_BASE}/api/notifications/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send test email");
      }
      return res.json();
    },
  },
};
