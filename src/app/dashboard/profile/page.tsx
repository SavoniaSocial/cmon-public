"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading || loadingProfile)
    return (
      <main className="flex h-screen items-center justify-center text-gray-500">
        Loading profile...
      </main>
    );

  if (!profile)
    return (
      <main className="flex h-screen items-center justify-center text-gray-500">
        Profile not found.
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-12 font-[Plus Jakarta Sans] text-gray-800">
      <div className="mx-auto max-w-2xl rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-purple-700 mb-4">
          Your Profile 🪄
        </h1>

        <div className="space-y-4 text-sm">
          <div>
            <span className="font-semibold text-gray-600">Full Name:</span>
            <p className="text-gray-800">{profile.full_name || "-"}</p>
          </div>

          <div>
            <span className="font-semibold text-gray-600">Email:</span>
            <p className="text-gray-800">{profile.email}</p>
          </div>

          <div>
            <span className="font-semibold text-gray-600">Role:</span>
            <p className="capitalize text-gray-800">{profile.role}</p>
          </div>

          <div>
            <span className="font-semibold text-gray-600">Status:</span>
            <p
              className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${
                profile.is_pro
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {profile.is_pro ? "Pro User" : "Free User"}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-600">Sparks Left:</span>
            <p className="text-gray-800">{profile.sparks}</p>
          </div>

          <div>
            <span className="font-semibold text-gray-600">Created At:</span>
            <p className="text-gray-800">
              {new Date(profile.created_at).toLocaleString()}
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-600">Last Updated:</span>
            <p className="text-gray-800">
              {new Date(profile.updated_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-8 text-right">

            <button
  onClick={() => router.push("/dashboard/profile/edit")}
  className="mt-6 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
>
  ✏️ Edit Profile
</button>


          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
