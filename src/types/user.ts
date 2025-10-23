export interface UserProfile {
  id: string;
  email: string;
  role: "creator" | "strategist" | "admin";
  created_at?: string;
}
