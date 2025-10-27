"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Camera } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState({ full_name: false, email: false });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      alert("✅ Avatar updated successfully!");
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert("❌ Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFieldSave(field: "full_name" | "email") {
    try {
      const value = profile[field];
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);
      if (error) throw error;
      setIsEditing({ ...isEditing, [field]: false });
      alert("✅ Profile updated!");
    } catch (err) {
      alert("❌ Failed to update field.");
    }
  }

  if (loading)
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

  const avatarUrl = profile.avatar_url || "/default-avatar.png";

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-12 font-[Plus Jakarta Sans] text-gray-800">
      <div className="mx-auto max-w-lg rounded-xl border bg-white p-8 shadow-sm relative">
        <h1 className="text-2xl font-bold text-purple-700 mb-8">Your Profile 🪄</h1>

        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative">
            <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-purple-100 shadow-sm">
  <Image
    src={profile?.avatar_url || "/default-avatar.png"}
    alt="Avatar"
    fill
    className="object-cover rounded-full"
  />
</div>

            <label
              htmlFor="avatar-upload"
              className="absolute bottom-2 right-2 bg-purple-600 text-white rounded-full p-2 cursor-pointer hover:bg-purple-700"
            >
              <Camera size={16} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          {uploading && (
            <p className="text-xs text-gray-400 mt-2">Uploading avatar...</p>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-5 text-sm">
          {/* Full Name */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-600">Full Name</p>
              {isEditing.full_name ? (
                <input
                  type="text"
                  value={profile.full_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  className="border rounded-md px-2 py-1 text-sm w-full mt-1"
                />
              ) : (
                <p className="text-gray-800">{profile.full_name || "-"}</p>
              )}
            </div>
            <button
              onClick={() =>
                isEditing.full_name
                  ? handleFieldSave("full_name")
                  : setIsEditing({ ...isEditing, full_name: true })
              }
              className="text-purple-600 hover:text-purple-800"
            >
              <Pencil size={16} />
            </button>
          </div>

          {/* Email */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-600">Email</p>
              {isEditing.email ? (
                <input
                  type="text"
                  value={profile.email || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="border rounded-md px-2 py-1 text-sm w-full mt-1"
                />
              ) : (
                <p className="text-gray-800">{profile.email}</p>
              )}
            </div>
            <button
              onClick={() =>
                isEditing.email
                  ? handleFieldSave("email")
                  : setIsEditing({ ...isEditing, email: true })
              }
              className="text-purple-600 hover:text-purple-800"
            >
              <Pencil size={16} />
            </button>
          </div>

          {/* Status */}
          <div>
            <p className="font-semibold text-gray-600">Status</p>
            <p
              className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${
                profile.is_pro
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {profile.is_pro ? "Pro User 🏅" : "Free User"}
            </p>
          </div>

          {/* Sparks */}
          <div>
            <p className="font-semibold text-gray-600">Sparks Left</p>
            <p className="text-gray-800">{profile.sparks}</p>
          </div>

          {/* Timestamps */}

          <div>
            <p className="font-semibold text-gray-600">Created: </p>
            <p className="text-sx text-gray-500 space-y-1"> {new Date(profile.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Change Password */}
        <div className="mt-10 text-center">
          <button
            onClick={() => router.push("/dashboard/profile/change-password")}
            className="rounded-md bg-purple-600 px-4 py-2 text-white text-sm hover:bg-purple-700"
          >
            Change Password
          </button>
        </div>

        {/* Back */}
        <div className="mt-6 text-right">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
