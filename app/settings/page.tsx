"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useRouter } from "next/navigation";
import { User, Mail, ShieldCheck, CheckCircle2, Save, AlertCircle, Cpu, Key, Moon, Sun, Monitor, Check } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
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
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full space-y-4">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const initials = name ? name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : "U";

  const apis = [
    { name: "Firebase Firestore", provider: "Database & Auth", status: "Connected", badge: "badge-green" },
    { name: "Google Gemini 1.5 Pro", provider: "Blueprint & Co-Founder AI", status: "Active", badge: "badge-green" },
    { name: "GitHub Integration", provider: "Repo Audit & Code Inspection", status: "Ready", badge: "badge-amber" },
    { name: "OpenAI Fallback API", provider: "Secondary Context Reasoning", status: "Configured", badge: "badge-muted" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto w-full anim-fade">
      {/* Header */}
      <div className="border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your profile, preferences, and connected AI services</p>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="badge badge-green p-3.5 rounded-xl text-sm flex items-center gap-2 w-full">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="badge badge-red p-3.5 rounded-xl text-sm flex items-center gap-2 w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Profile Card */}
      <form onSubmit={handleSave} className="card overflow-hidden">
        <div className="p-6 border-b flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{ background: "rgba(217,119,6,0.15)", color: "var(--accent)", border: "1px solid rgba(217,119,6,0.25)" }}
          >
            {initials}
          </div>
          <div>
            <div className="text-base font-semibold" style={{ color: "var(--text)" }}>{name || "User"}</div>
            <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{user?.email}</div>
            {user?.emailVerified && (
              <div className="badge badge-green mt-1.5 text-[10px]">
                <ShieldCheck className="w-3 h-3" />
                Verified Account
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <User className="w-3.5 h-3.5" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Mail className="w-3.5 h-3.5" />
              Email Address <span style={{ color: "var(--text-faint)" }}>(cannot be changed)</span>
            </label>
            <div className="input flex items-center select-none opacity-75 font-mono">
              {user?.email}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Theme Preference Section */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Interface Theme</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Select your preferred interface appearance mode</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "dark", label: "Dark", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
            { id: "system", label: "System", icon: Monitor },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id as any)}
              className="btn btn-secondary flex-col py-6 h-auto gap-2"
              style={{
                borderColor: theme === id ? "var(--accent)" : "var(--border)",
                background: theme === id ? "rgba(217,119,6,0.08)" : "var(--surface)",
                color: theme === id ? "var(--accent)" : "var(--text-secondary)"
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
              {theme === id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Connected APIs & Integrations */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Connected APIs &amp; Services</h2>
          </div>
          <span className="badge badge-amber font-mono text-[10px]">Active OS Pipeline</span>
        </div>

        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {apis.map((api) => (
            <div key={api.name} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>{api.name}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{api.provider}</div>
              </div>
              <span className={`${api.badge} font-mono text-[11px]`}>
                {api.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Account &amp; Workspace Details</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "Edition", value: "Enterprise Hackathon Edition" },
            { label: "Auth Provider", value: user?.email ? "Email / Google OAuth" : "Demo Guest" },
            { label: "Verification Status", value: user?.emailVerified ? "Verified ✓" : "Pending" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
