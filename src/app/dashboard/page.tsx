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
  const [draft, setDraft] = useState({
    client: "",
    format: "",
    hook: "",
    copy: "",
  });
  const [active, setActive] = useState("threads");
  const [isAddPanelOpen, setAddPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandKitUnlocked, setBrandKitUnlocked] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect jika belum login
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  // Fetch profile dan threads dari Supabase
  useEffect(() => {
  const fetchData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      // 🧠 hanya refresh token sekali (saat awal login aja)
      const { data } = await supabase.auth.getSession();
      if (!data.session) await supabase.auth.refreshSession();

      // setelah itu baru ambil data
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


  // Tambah draft baru ke Supabase
  const handleAddDraft = async () => {
    if (!draft.client || !draft.format) return;
    if (profile?.sparks <= 0) {
      alert("✨ You’ve used all your sparks this month. Upgrade to Pro!");
      return;
    }

    try {
      // Insert thread
      const { data: newThread, error: threadError } = await supabase
        .from("threads")
        .insert([
          {
            user_id: user.id,
            client: draft.client,
            format: draft.format,
            hook: draft.hook,
            copy: draft.copy,
            ai_feedback:
              "Nice start 👏! Try this tweak for clarity → Here’s a sharper version.",
            improved_draft: `${draft.copy} (improved)`,
            char_count: draft.copy.length,
          },
        ])
        .select()
        .single();

      if (threadError) throw threadError;

      // Kurangi sparks
      const { error: sparksError } = await supabase
        .from("profiles")
        .update({ sparks: (profile.sparks || 12) - 1, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (sparksError) throw sparksError;

      // Update local state
      setThreads([newThread, ...threads]);
      setProfile({ ...profile, sparks: (profile.sparks || 12) - 1 });
      setDraft({ client: "", format: "", hook: "", copy: "" });
      setAddPanelOpen(false);
    } catch (err) {
      console.error("❌ Error adding draft:", err);
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.hook?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.copy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingData)
    return (
      <main className="flex h-screen items-center justify-center text-gray-500">
        Loading your dashboard...
      </main>
    );

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[Plus Jakarta Sans] text-gray-800">
      {/* Sidebar */}
      <Sidebar
        active={active}
        setActive={setActive}
        setAddPanelOpen={setAddPanelOpen}
        brandKitUnlocked={brandKitUnlocked}
      />

      {/* Main Area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <Topbar
          sparks={profile?.sparks ?? 0}
          brandKitUnlocked={brandKitUnlocked}
          setBrandKitUnlocked={setBrandKitUnlocked}
          userEmail={profile?.full_name || user.email}
        />

        {/* Content */}
        <section className="flex flex-1 flex-col overflow-y-auto p-8">
          {active === "threads" && <ThreadList />}
          {active === "search" && (
            <SearchView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              threads={filteredThreads}
            />
          )}
          {active === "brandkit" && <BrandKitView />}
        </section>
      </div>

      {/* Add Draft Panel */}
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
              onClose={() => setAddPanelOpen(false)}
            />
            <div className="p-6 border-t text-right">
              <button
                onClick={handleAddDraft}
                className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                Start Thread
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
