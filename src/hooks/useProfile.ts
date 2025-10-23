// src/hooks/useProfile.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  is_pro?: boolean;
  sparks?: number;
  avatar_url?: string | null;
  bio?: string | null;
};

export default function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setProfile(json.profile || null);
      else throw new Error(json.error || "Failed to fetch profile");
    } catch (err) {
      console.error("refreshProfile error:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, _session) => {
      refreshProfile();
    });
    return () => listener.subscription.unsubscribe();
  }, [refreshProfile]);

  return { profile, loading, refreshProfile, setProfile };
}
