"use client";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-white">
      <AuthForm />
    </main>
  );
}
