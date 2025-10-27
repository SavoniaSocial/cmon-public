"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoadingData(true);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: threadData, error: threadError } = await supabase
          .from("threads")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (threadError) throw threadError;
        setThreads(threadData || []);
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

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
        <Topbar
          profile={profile}
          sparks={profile?.sparks ?? 0}
        />

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
              draft={{}}
              setDraft={() => {}}
              sparks={profile?.sparks ?? 0}
              onClose={() => setAddPanelOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
