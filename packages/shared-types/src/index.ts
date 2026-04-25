export type Role = 'admin' | 'viewer' | 'cx';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type Period = '7d' | '30d' | '90d';
export type Region = 'seoul' | 'busan' | 'all';

export interface MetricsQuery {
  period?: Period;
  region?: Region;
  userId?: string;
}

export interface MetricPoint {
  date: string;
  traffic: number;
  revenue: number;
  gmv: number;
}

export interface MetricsResponse {
  period: Period;
  region: Region;
  userId?: string;
  points: MetricPoint[];
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  region: Region;
  joinedAt: string;
  banned: boolean;
}

export interface UserListResponse {
  users: DirectoryUser[];
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
