// src/app/dashboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AddDraftPanel from "@/components/AddDraftPanel";
import ThreadList from "@/components/ThreadList";
import SearchView from "@/components/SearchView";
import BrandKitView from "@/components/BrandKitView";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState("threads");
  const [isAddPanelOpen, setAddPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // 🔹 Draft state (persist ke localStorage)
  const [draft, setDraft] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("creates_draft");
      return saved ? JSON.parse(saved) : { client: "", format: "", hook: "", copy: "" };
    }
    return { client: "", format: "", hook: "", copy: "" };
  });

  // 🔹 Autosave setiap kali draft berubah
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("creates_draft", JSON.stringify(draft));
    }
  }, [draft]);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  // fetch profile once
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, [user]);

  // fetch threads list
  const fetchThreads = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const { data: threadData, error: threadError } = await supabase
        .from("threads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (threadError) throw threadError;
      setThreads(threadData || []);
    } catch (err) {
      console.error("Failed to fetch threads:", err);
      setThreads([]);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  // initial load
  useEffect(() => {
    if (!user) return;
    (async () => {
      await fetchProfile();
      await fetchThreads();
    })();
  }, [user, fetchProfile, fetchThreads]);

  // Realtime listener: listen to changes on threads for this user only
  useEffect(() => {
    if (!user) return;

    // create channel name unique per user (optional)
    const channel = supabase
      .channel(`realtime-threads-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // listen insert, update, delete
          schema: "public",
          table: "threads",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // payload includes: INSERT | UPDATE | DELETE
          // console.debug("Realtime threads payload:", payload);
          // fetch fresh threads once change detected
          fetchThreads().catch((e) => console.error("Realtime fetchThreads err:", e));
        }
      )
      .subscribe();

    return () => {
      // cleanup the channel subscription when unmount or user change
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // older versions might use channel.unsubscribe(); include fallback
        try {
          // @ts-ignore
          channel?.unsubscribe?.();
        } catch (err) {
          // ignore
        }
      }
    };
  }, [user, fetchThreads]);

  if (loading || loadingData)
    return (
      <main className="flex h-screen items-center justify-center text-gray-500">
        Loading your dashboard...
      </main>
    );

  if (!user || !profile) return null;

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[Plus Jakarta Sans] text-gray-800">
      <Sidebar
        active={active}
        setActive={setActive}
        setAddPanelOpen={setAddPanelOpen}
        brandKitUnlocked={!!profile?.is_pro}
      />

      <div className="flex flex-1 flex-col">
        <Topbar profile={profile} sparks={profile?.sparks ?? 0} />

        <section className="flex flex-1 flex-col overflow-y-auto p-8">
          {active === "threads" && <ThreadList />}
          {active === "search" && (
            <SearchView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              threads={threads}
            />
          )}
          {active === "brandkit" && <BrandKitView />}
        </section>
      </div>

      <AnimatePresence>
        {isAddPanelOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween" }}
            className="fixed right-0 top-0 z-50 h-full w-96 border-l border-gray-200 bg-white shadow-xl"
          >
            <AddDraftPanel
              draft={draft}
              setDraft={setDraft}
              sparks={profile?.sparks ?? 0}
              onClose={() => {
                setAddPanelOpen(false);
                localStorage.removeItem("creates_draft");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
