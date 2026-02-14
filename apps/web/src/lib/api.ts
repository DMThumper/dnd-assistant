import type {
  User,
  LoginResponse,
  RegisterResponse,
  AuthResponse,
  VerifyEmailResponse,
} from "@/types/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "dnd-auth-token";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiClient {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {} } = options;

    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      credentials: "include",
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      throw new ApiClientError("Unauthorized", 401);
    }

    // Handle validation errors (422)
    if (response.status === 422) {
      const error = await response.json();
      throw new ApiClientError(
        error.message || "Validation error",
        422,
        error.errors
      );
    }

    // Handle 403 Forbidden (may include requires_verification)
    if (response.status === 403) {
      const error = await response.json();
      const apiError = new ApiClientError(
        error.message || "Forbidden",
        403,
        error.errors
      );
      // Attach requires_verification flag if present
      if (error.requires_verification) {
        (apiError as ApiClientError & { requiresVerification?: boolean }).requiresVerification = true;
      }
      throw apiError;
    }

    // Handle other errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Network error",
      }));
      throw new ApiClientError(
        error.message || "Request failed",
        response.status
      );
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  async register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) {
    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: { name, email, password, password_confirmation },
    });
  }

  async logout() {
    try {
      await this.request<{ message: string }>("/auth/logout", {
        method: "POST",
      });
    } finally {
      this.setToken(null);
    }
  }

  async me() {
    return this.request<AuthResponse>("/auth/me").then((response) => ({
      ...response,
      data: { user: response.data as unknown as User },
    }));
  }

  async refresh() {
    const response = await this.request<{ token: string }>("/auth/refresh", {
      method: "POST",
    });

    if (response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async resendVerification(email: string) {
    return this.request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: { email },
    });
  }

  async verifyEmail(id: string, hash: string, expires: string, signature: string) {
    const params = new URLSearchParams({ expires, signature });
    return this.request<VerifyEmailResponse>(
      `/auth/email/verify/${id}/${hash}?${params}`
    );
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

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export const api = new ApiClient();
export type { User };
