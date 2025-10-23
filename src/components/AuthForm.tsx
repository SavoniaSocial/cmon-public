"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) alert(error.message);
      else alert("🎉 Account created! Check your inbox to verify.");
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-purple-700 mb-4">
        {isLogin ? "Login" : "Sign Up"} to CMON
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            className="w-full rounded-md border px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-sm text-gray-600 hover:underline"
      >
        {isLogin ? "Need an account? Sign up" : "Already have one? Login"}
      </button>
    </div>
  );
}
