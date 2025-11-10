"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Zap, Target, User, Crown, LogOut } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function Topbar({
  profile,
  sparks,
}: {
  profile: any;
  sparks: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const isPro = profile?.is_pro;
  const name = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const avatar = profile?.avatar_url || "/default-avatar.png";

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-6 text-sm font-medium">
        <TopItem icon={<BookOpen />} label="Library" />
        <TopItem icon={<Zap />} label={`Sparks ✨ ${sparks}`} />
        <TopItem icon={<Target />} label="Challenge" />
      </div>

      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-1 shadow-sm hover:bg-purple-50 transition"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
            <Image
              src={profile?.avatar_url || "/default-avatar.png"}
              alt="avatar"
              fill
              className="object-cover rounded-full"
            />
          </div>

          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-gray-800">{name}</span>
            <span
              className={`text-xs font-medium ${
                isPro ? "text-yellow-600" : "text-gray-500"
              }`}
            >
              {isPro ? "Pro User 🏅" : "Free User"}
            </span>
          </div>
        </motion.button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-12 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50"
          >
            <div className="flex flex-col divide-y divide-gray-100 text-sm">
              <button
                onClick={() => (window.location.href = "/dashboard/profile")}
                className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50"
              >
                <User className="h-4 w-4 text-gray-500" /> See Full Profile
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}

function TopItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
    >
      {icon}
      {label}
    </motion.button>
  );
}
