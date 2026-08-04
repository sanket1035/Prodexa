"use client";

import React, { useEffect, useState } from "react";

interface ScoreRadialProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreRadial({
  score,
  size = 140,
  strokeWidth = 6,
}: ScoreRadialProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const finalScore = score !== null ? Math.max(0, Math.min(100, score)) : 0;

  useEffect(() => {
    if (score === null) return;
    let start = 0;
    const duration = 1000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = finalScore / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= finalScore) {
        setAnimatedScore(finalScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, finalScore]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s: number | null) => {
    if (s === null) return "var(--text-faint)";
    if (s >= 80) return "var(--success)";
    if (s >= 60) return "var(--warning)";
    return "var(--error)";
  };

  const currentColor = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={currentColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={score !== null ? strokeDashoffset : circumference}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
        <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          {score !== null ? `${animatedScore}%` : "—"}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-sans mt-0.5" style={{ color: "var(--text-muted)" }}>
          Readiness
        </span>
      </div>
    </div>
  );
}
