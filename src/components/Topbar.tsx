"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Zap, Target, User, Crown, LogOut } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function Topbar({
  userEmail,
  sparks,
  brandKitUnlocked,
  setBrandKitUnlocked,
}: {
  userEmail: string;
  sparks: number;
  brandKitUnlocked: boolean;
  setBrandKitUnlocked: (v: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleUpgrade() {
    if (!promoCode) {
      alert("Please enter a promo code!");
      return;
    }
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/auth/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("🎉 You are now Pro! Refreshing...");
        window.location.reload();
      } else {
        alert(data.error || "Upgrade failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    } finally {
      setIsUpgrading(false);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-6 text-sm font-medium">
        <TopItem icon={<BookOpen />} label="Library" />
        <TopItem icon={<Zap />} label={`Sparks ✨ ${sparks}`} />
        <TopItem icon={<Target />} label="Challenge" />
      </div>

      {/* Profile Section */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-1 shadow-sm hover:bg-purple-50 transition"
        >
          <Image
            src="/default-avatar.png"
            alt="avatar"
            width={28}
            height={28}
            className="rounded-full border border-gray-300"
          />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-gray-800">
              {userEmail.split("@")[0]}
            </span>
            <span className="text-xs text-gray-500">Free User</span>
          </div>
        </motion.button>

        {/* Dropdown */}
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

              {!brandKitUnlocked && (
                <div className="flex flex-col px-4 py-3">
                  {!showPromoInput ? (
                    <button
                      onClick={() => setShowPromoInput(true)}
                      className="flex items-center gap-2 text-purple-700 font-medium hover:underline"
                    >
                      <Crown className="h-4 w-4 text-yellow-500" /> Upgrade to Pro
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="rounded-md border px-2 py-1 text-sm"
                      />
                      <button
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                        className="rounded-md bg-purple-600 text-white px-2 py-1 text-sm hover:bg-purple-700"
                      >
                        {isUpgrading ? "Upgrading..." : "Redeem"}
                      </button>
                    </div>
                  )}
                </div>
              )}

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
