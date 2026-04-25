export interface UserProfile {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface ApiResponse<T> {
  message: string;
  status: number;
  data?: T;
}

export interface ProfileResponse {
  user: UserProfile;
}