"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      setProfile(data);
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (!error) router.push("/dashboard/profile");
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-12 font-[Plus Jakarta Sans] text-gray-800">
      <div className="mx-auto max-w-2xl rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-purple-700 mb-4">Edit Profile</h1>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-gray-600 mb-1">Full Name</label>
            <input
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Bio</label>
            <textarea
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Avatar URL</label>
            <input
              value={profile.avatar_url || ""}
              onChange={(e) =>
                setProfile({ ...profile, avatar_url: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
