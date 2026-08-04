"use client";

import React, { useEffect, useState } from "react";
import { CoFounderMessage } from "@/lib/types/cofounder";
import { Bot, Send, User, Sparkles, Copy, Check, ShieldAlert, Award, Code2, AlertTriangle, CheckCircle2, HelpCircle, Lightbulb } from "lucide-react";

interface MentorReviewData {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  judgeQuestions: string[];
  demoSuggestions: string[];
  actionableFix?: string;
}

interface AICofounderTabProps {
  projectId: string;
  projectName: string;
  healthScore?: number;
  readinessScore?: number | null;
}

export default function AICofounderTab({
  projectId,
  projectName,
  healthScore = 25,
  readinessScore = null,
}: AICofounderTabProps) {
  const [messages, setMessages] = useState<CoFounderMessage[]>([
    {
      id: "init-1",
      sender: "cofounder",
      role: "advisor",
      text: `Hey! I'm your AI Co-Founder for ${projectName}. I have full visibility into your blueprint context, health progress (${healthScore}%), and launch readiness metrics. Ask me anything or request an Investor Review below!`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [mentorReview, setMentorReview] = useState<MentorReviewData | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(false);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch persistent chat messages from Firestore /api/cofounder?projectId=xxx on mount
  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/cofounder?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          const loadedMsgs: CoFounderMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "cofounder",
            text: m.text,
            role: m.advisorRole || "advisor",
            actionableFix: m.actionableFix,
            timestamp: m.createdAt || new Date().toISOString(),
          }));
          setMessages(loadedMsgs);
        }
      })
      .catch(() => {});
  }, [projectId]);

  const quickPrompts = [
    "What will hackathon judges criticize about this project?",
    "How do I improve my landing page hero section?",
    "What is the single most critical gap I must fix before launch?",
    "How can I increase my Launch Readiness Score?",
  ];

  const requestMentorReview = async () => {
    setLoadingMentor(true);
    try {
      const res = await fetch("/api/cofounder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          isMentorReview: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.review) {
        setMentorReview(data.review);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMentor(false);
    }
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: CoFounderMessage = {
      id: "user_" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (input === textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/cofounder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userMessage: textToSend,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            sender: data.message.role === "user" ? "user" : "cofounder",
            text: data.message.text,
            role: data.message.advisorRole || "advisor",
            actionableFix: data.message.actionableFix,
            timestamp: data.message.createdAt || new Date().toISOString(),
          },
        ]);
      } else {
        throw new Error(data.message || "Failed to get AI Co-Founder response");
      }
    } catch {
      const fallbackMsg: CoFounderMessage = {
        id: "cf_" + Date.now(),
        sender: "cofounder",
        role: "pm",
        text: `Based on ${projectName}'s current metrics (${healthScore}% health progress, ${readinessScore !== null ? `${readinessScore}% readiness` : "unvalidated"}), focus on making your hero value prop outcome-driven and ensure your GitHub repository includes a clean MIT LICENSE file for open-source verification.`,
        actionableFix: `// Quick Fix for Hero Value Prop:\n"Launch With Confidence. Audit & Fix Pre-Launch Gaps in Under 90 Seconds."`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2D31] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D97B3F]/10 border border-[#D97B3F]/30 rounded-[6px] flex items-center justify-center text-[#D97B3F]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-[#EDEDEF]">AI Co-Founder & Strategy Advisor</h3>
              <span className="text-[10px] font-mono uppercase bg-[#5FA88A]/10 text-[#5FA88A] px-2 py-0.5 rounded border border-[#5FA88A]/20">
                Firestore Memory Persisted
              </span>
            </div>
            <p className="text-xs text-[#8B8F97] mt-0.5">
              Project-specific advice backed by real blueprint memory, GitHub analysis, and compressed context memory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={requestMentorReview}
            disabled={loadingMentor}
            className="flex items-center gap-1.5 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] px-3.5 py-2 rounded-[6px] text-xs font-mono font-medium transition-colors disabled:opacity-50"
          >
            <Award className="w-4 h-4" />
            {loadingMentor ? "Auditing Investor Review..." : "Investor Review"}
          </button>
        </div>
      </div>

      {/* Structured Investor & Judge Review Card if requested */}
      {mentorReview && (
        <div className="bg-[#0B0C0E] border border-[#D97B3F]/40 rounded-[6px] p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[#2A2D31] pb-3">
            <div className="flex items-center gap-2 font-mono text-sm text-[#D97B3F] font-bold">
              <Award className="w-4 h-4" />
              Investor & Judge Pitch Audit ({projectName})
            </div>
            <span className="text-[10px] font-mono text-[#8B8F97] bg-[#16181B] px-2 py-0.5 rounded border border-[#2A2D31]">
              Live Advisor Feedback
            </span>
          </div>

          <p className="text-xs text-[#EDEDEF] leading-relaxed font-sans">{mentorReview.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Strengths */}
            <div className="bg-[#16181B] border border-[#2A2D31] p-4 rounded-[6px] space-y-2">
              <div className="text-xs font-mono uppercase text-[#5FA88A] flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Top 5 Key Strengths
              </div>
              <ul className="space-y-1 text-xs text-[#8B8F97]">
                {mentorReview.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#5FA88A]">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Weaknesses */}
            <div className="bg-[#16181B] border border-[#2A2D31] p-4 rounded-[6px] space-y-2">
              <div className="text-xs font-mono uppercase text-[#C25A4D] flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Top 5 Weaknesses & Gaps
              </div>
              <ul className="space-y-1 text-xs text-[#8B8F97]">
                {mentorReview.weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#C25A4D]">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tough Judge Questions & Presentation Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#2A2D31]">
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-[#C9A44C] flex items-center gap-1.5 font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                5 Questions Hackathon & VC Judges Will Ask
              </div>
              <ol className="space-y-1 text-xs text-[#8B8F97] list-decimal list-inside font-mono">
                {mentorReview.judgeQuestions.map((q, idx) => (
                  <li key={idx} className="leading-relaxed">{q}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-[#D97B3F] flex items-center gap-1.5 font-semibold">
                <Lightbulb className="w-3.5 h-3.5" />
                Demo Pitch Presentation Tips
              </div>
              <ul className="space-y-1 text-xs text-[#8B8F97]">
                {mentorReview.demoSuggestions.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#D97B3F]">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Chips as Horizontal Pill Buttons */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B8F97]">Suggested Advisor Questions:</div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="bg-[#0B0C0E] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] hover:border-[#D97B3F]/50 px-3 py-1.5 rounded-full text-xs font-mono transition-colors text-left disabled:opacity-50"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="space-y-4 max-h-[450px] overflow-y-auto p-4 bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.sender === "cofounder" && (
              <div className="w-7 h-7 bg-[#D97B3F]/10 border border-[#D97B3F]/30 rounded-[4px] flex items-center justify-center text-[#D97B3F] flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-[6px] p-4 space-y-2 border ${
                m.sender === "user"
                  ? "bg-[#D97B3F]/10 text-[#EDEDEF] border-[#D97B3F]/30"
                  : "bg-[#16181B] text-[#EDEDEF] border-[#2A2D31]"
              }`}
            >
              {m.sender === "cofounder" && m.role && (
                <div className="flex items-center gap-2 border-b border-[#2A2D31] pb-1.5 mb-1.5 font-mono">
                  <span className="text-[10px] uppercase font-bold text-[#D97B3F] bg-[#D97B3F]/10 px-2 py-0.5 rounded border border-[#D97B3F]/20">
                    [{m.role.toUpperCase()}]
                  </span>
                </div>
              )}

              <p className="whitespace-pre-wrap font-sans text-xs">{m.text}</p>

              {m.actionableFix && (
                <div className="mt-3 bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-3 space-y-2 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-[#5FA88A]">
                    <span className="flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5" />
                      Recommended Actionable Fix
                    </span>
                    <button
                      onClick={() => handleCopy(m.id, m.actionableFix!)}
                      className="text-[#8B8F97] hover:text-[#EDEDEF] flex items-center gap-1 text-[11px]"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#5FA88A]" />
                          <span className="text-[#5FA88A]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] text-[#EDEDEF] overflow-x-auto whitespace-pre-wrap">
                    {m.actionableFix}
                  </pre>
                </div>
              )}
            </div>

            {m.sender === "user" && (
              <div className="w-7 h-7 bg-[#1E2124] border border-[#2A2D31] rounded-[4px] flex items-center justify-center text-[#8B8F97] flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs font-mono text-[#D97B3F] p-2">
            <Bot className="w-4 h-4 animate-bounce" />
            <span>AI Co-Founder is analyzing project context...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask your AI Co-Founder anything about landing page, tech stack, roadmap, or pitch..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-4 py-2.5 text-xs text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium px-4 py-2.5 rounded-[6px] text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask Advisor</span>
        </button>
      </form>
    </div>
  );
}
