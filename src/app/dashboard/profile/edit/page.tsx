"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    let avatarUrl = profile.avatar_url;

    if (avatarFile) {
      const fileName = `${user.id}-${Date.now()}.${avatarFile.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) {
        alert("Upload failed.");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      avatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, avatar_url: avatarUrl })
      .eq("id", user.id);

    if (error) alert(error.message);
    else router.push("/dashboard/profile");
  };

  if (!profile)
    return <div className="p-8 text-gray-500">Loading profile...</div>;

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-12 font-[Plus Jakarta Sans] text-gray-800">
      <div className="mx-auto max-w-lg rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">Edit Profile</h1>

        <div className="space-y-4">
          <label className="block">
            Full Name:
            <input
              type="text"
              value={profile.full_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="block">
            Upload Avatar:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm"
            />
          </label>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </main>
  );
}
