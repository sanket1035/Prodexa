"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { User, Mail, ShieldCheck, CheckCircle2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, updateUserProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      setName(user.displayName || "");
    }
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Full Name cannot be blank.");
      return;
    }

    setSaving(true);
    const res = await updateUserProfile(name.trim());
    setSaving(false);

    if (res.success) {
      setSuccessMsg("Profile updated successfully!");
    } else {
      setErrorMsg(res.error || "Failed to save profile changes.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-[#8B8F97] font-mono text-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-[#2A2D31] pb-6 space-y-1">
        <h1 className="text-2xl font-medium text-[#EDEDEF] tracking-tight flex items-center gap-2.5">
          <User className="w-6 h-6 text-[#D97B3F]" />
          Account & Profile Settings
        </h1>
        <p className="text-sm text-[#8B8F97]">
          Manage your profile name and verified account credentials.
        </p>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-[#5FA88A]/10 border border-[#5FA88A]/30 text-[#5FA88A] p-3.5 rounded-[6px] text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#C25A4D]/10 border border-[#C25A4D]/30 text-[#C25A4D] p-3.5 rounded-[6px] text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Editable Form */}
      <form onSubmit={handleSave} className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[#8B8F97] border-b border-[#2A2D31] pb-2">
            Personal Details
          </h2>

          {/* Avatar Preview & Name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#D97B3F]/20 border border-[#D97B3F]/40 flex items-center justify-center font-mono font-bold text-[#D97B3F] text-xl">
              {name ? name[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="text-base font-medium text-[#EDEDEF]">{name || "User"}</div>
              <div className="text-xs font-mono text-[#8B8F97]">{user?.email}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#EDEDEF] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#8B8F97]" />
              Full Name (Editable)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2.5 text-sm text-[#EDEDEF] focus:border-[#D97B3F] outline-none font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8B8F97] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#8B8F97]" />
              Email Address
            </label>
            <div className="flex items-center justify-between bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2.5 text-xs text-[#8B8F97] font-mono">
              <span>{user?.email}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#5FA88A] bg-[#5FA88A]/10 px-2 py-0.5 rounded border border-[#5FA88A]/20">
                <ShieldCheck className="w-3 h-3" />
                Verified Account
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#2A2D31] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-mono text-xs font-medium px-5 py-2.5 rounded-[6px] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
