"use client";

import React, { useState } from "react";
import { Copy, Check, Download, Network } from "lucide-react";
import { downloadFile } from "@/lib/pdf/exporter";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export default function MermaidDiagram({
  chart,
  title = "Auto-Generated System Architecture Diagram",
}: MermaidDiagramProps) {
  const [copied, setCopied] = useState(false);

  const defaultChart = chart || `graph TD
    Client["Client Web App (Next.js 14 / Tailwind)"] --> API["Next.js Server API Routes"]
    API --> Auth["Firebase Authentication"]
    API --> DB["Firebase Firestore Database"]
    API --> AI["OpenAI Inference Engine"]
    API --> Host["Anti-Gravity / Vercel Serverless"]`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(defaultChart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    downloadFile("architecture.mermaid", defaultChart, "text/plain");
  };

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2D31] pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#D97B3F]" />
          <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 bg-[#1E2124] hover:bg-[#25292E] text-[#EDEDEF] border border-[#2A2D31] px-3 py-1.5 rounded-[6px] text-xs font-mono transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#5FA88A]" />
                <span className="text-[#5FA88A]">Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#8B8F97]" />
                <span>Copy Mermaid</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCode}
            className="flex items-center gap-1.5 bg-[#1E2124] hover:bg-[#25292E] text-[#EDEDEF] border border-[#2A2D31] px-3 py-1.5 rounded-[6px] text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#6E7B8B]" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Visual System Nodes Representation */}
      <div className="bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-6 space-y-6">
        <div className="text-xs font-mono text-[#8B8F97] uppercase tracking-wider">
          System Flow Visualizer
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <div className="bg-[#16181B] border border-[#2A2D31] p-4 rounded-[6px] w-full max-w-xs space-y-1">
            <div className="text-xs font-mono text-[#D97B3F]">01. Client Layer</div>
            <div className="font-medium text-sm text-[#EDEDEF]">Next.js 14 Web App</div>
            <div className="text-[11px] text-[#8B8F97]">React, Tailwind CSS, Dark Theme</div>
          </div>

          <div className="text-[#D97B3F] font-mono font-bold text-lg hidden md:block">→</div>
          <div className="text-[#D97B3F] font-mono font-bold text-lg md:hidden">↓</div>

          <div className="bg-[#16181B] border border-[#2A2D31] p-4 rounded-[6px] w-full max-w-xs space-y-1">
            <div className="text-xs font-mono text-[#5FA88A]">02. Server API Layer</div>
            <div className="font-medium text-sm text-[#EDEDEF]">App Router API Endpoints</div>
            <div className="text-[11px] text-[#8B8F97]">Firebase Admin SDK, Orchestrator</div>
          </div>

          <div className="text-[#D97B3F] font-mono font-bold text-lg hidden md:block">→</div>
          <div className="text-[#D97B3F] font-mono font-bold text-lg md:hidden">↓</div>

          <div className="bg-[#16181B] border border-[#2A2D31] p-4 rounded-[6px] w-full max-w-xs space-y-1">
            <div className="text-xs font-mono text-[#6E7B8B]">03. Database & AI Engine</div>
            <div className="font-medium text-sm text-[#EDEDEF]">Firestore & GPT-4o-mini</div>
            <div className="text-[11px] text-[#8B8F97]">Bounded Context Package Storage</div>
          </div>
        </div>

        {/* Fallback Code Viewer */}
        <div className="space-y-2 pt-2 border-t border-[#2A2D31]">
          <div className="text-xs font-mono text-[#8B8F97]">Mermaid Syntax:</div>
          <pre className="bg-[#16181B] border border-[#2A2D31] p-3 rounded-[6px] text-xs font-mono text-[#EDEDEF] overflow-x-auto whitespace-pre-wrap">
            {defaultChart}
          </pre>
        </div>
      </div>
    </div>
  );
}
