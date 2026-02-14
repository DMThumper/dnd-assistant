export interface User {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  backoffice_access: boolean;
  can_manage_roles: boolean;
  created_at: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_at: string;
}

export interface LoginErrorResponse {
  requires_verification?: boolean;
}

export interface RegisterResponse {
  user: User;
  requires_verification: boolean;
}

export interface AuthResponse {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  backoffice_access: boolean;
  can_manage_roles: boolean;
  created_at: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export type AuthError = {
  message: string;
  errors?: Record<string, string[]>;
};
