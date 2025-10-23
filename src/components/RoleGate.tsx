"use client";
import { useAuth } from "@/context/AuthContext";

export default function RoleGate({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const currentRole = user?.user_metadata?.role || "creator";

  if (currentRole !== role) return null;
  return <>{children}</>;
}
