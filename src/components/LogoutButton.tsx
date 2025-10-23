"use client";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  return (
    <button
      onClick={() => supabase.auth.signOut()}
      className="rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
    >
      Logout
    </button>
  );
}
