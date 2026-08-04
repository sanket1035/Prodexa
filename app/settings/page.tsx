"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { User, Mail, ShieldCheck, CheckCircle2, Save, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, updateUserProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) setName(user.displayName || "");
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) { setErrorMsg("Full Name cannot be blank."); return; }

    setSaving(true);
    const res = await updateUserProfile(name.trim());
    setSaving(false);

    if (res.success) setSuccessMsg("Profile updated successfully!");
    else setErrorMsg(res.error || "Failed to save profile changes.");
  };

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto w-full space-y-4">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const initials = name ? name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : "U";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Account Settings</h1>
        <p className="text-sm text-[#71717A] mt-0.5">Manage your profile and account credentials</p>
      </div>

      {/* Success / Error */}
      {successMsg && (
        <div className="bg-[#22C55E]/8 border border-[#22C55E]/20 text-[#22C55E] p-3.5 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-[#EF4444]/8 border border-[#EF4444]/20 text-[#EF4444] p-3.5 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Profile Card */}
      <form onSubmit={handleSave} className="bg-[#111113] border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 border-b border-white/[0.07] flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#D97706]/15 border border-[#D97706]/25 flex items-center justify-center font-bold text-[#D97706] text-xl flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-base font-semibold text-[#FAFAFA]">{name || "User"}</div>
            <div className="text-xs text-[#71717A] font-mono">{user?.email}</div>
            {user?.emailVerified && (
              <div className="inline-flex items-center gap-1 text-[10px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-md mt-1.5">
                <ShieldCheck className="w-3 h-3" />
                Verified Account
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-[#18181B] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#71717A] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email Address <span className="text-[#3F3F46]">(cannot be changed)</span>
            </label>
            <div className="w-full bg-[#18181B] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-[#71717A] font-mono select-none">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.07] bg-[#0D0D0F]/60 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_0_14px_rgba(217,119,6,0.3)] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className="bg-[#111113] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.07]">
          <h2 className="text-sm font-semibold text-[#FAFAFA]">Account Information</h2>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {[
            { label: "Plan", value: "Free — Hackathon Edition" },
            { label: "Account Type", value: user?.email ? "Email / Google OAuth" : "Demo Guest" },
            { label: "Email Verification", value: user?.emailVerified ? "Verified ✓" : "Pending" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-xs text-[#71717A]">{row.label}</span>
              <span className="text-xs font-mono text-[#A1A1AA]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
