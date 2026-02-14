const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, token } = options;

    const authToken = token || this.token;

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...headers,
      },
      credentials: "include",
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        success: false,
        message: "Network error",
      }));
      throw new Error(error.message || "Request failed");
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: unknown }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async register(name: string, email: string, password: string, password_confirmation: string) {
    return this.request<{ message: string }>("/auth/register", {
      method: "POST",
      body: { name, email, password, password_confirmation },
    });
  }

  async logout() {
    return this.request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  }

  async me() {
    return this.request<{ user: unknown }>("/auth/me");
  }

  // Player endpoints
  async getPlayerCampaigns() {
    return this.request<unknown[]>("/player/campaigns");
  }

  async getPlayerCharacters(campaignId: number) {
    return this.request<unknown[]>(`/player/campaigns/${campaignId}/characters`);
  }

  // Backoffice endpoints
  async getCampaigns(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<unknown[]>(`/backoffice/campaigns${query}`);
  }

  async getUsers(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<unknown[]>(`/backoffice/users${query}`);
  }
}

export const api = new ApiClient();
export type { ApiResponse, ApiError };
