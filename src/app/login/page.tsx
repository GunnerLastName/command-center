"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace("/");
    } else {
      setError("Wrong password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080d13]">
      <div className="w-full max-w-sm px-8 py-10 rounded-2xl border border-white/8 bg-white/3 shadow-2xl">
        <div className="flex flex-col items-center gap-3 mb-8">
          <span className="text-5xl font-bold text-[#fbb415]">⌘</span>
          <h1 className="text-xl font-semibold text-white tracking-tight">Command Center</h1>
          <p className="text-sm text-white/40">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#fbb415]/60 focus:ring-1 focus:ring-[#fbb415]/40 transition-colors"
          />

          {error && (
            <p className="text-sm text-rose-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-[#fbb415] py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
