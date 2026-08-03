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
    const duration = 1000; // 1 second count-up
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
    if (s === null) return "#8B8F97";
    if (s >= 80) return "#5FA88A"; // Sage green
    if (s >= 60) return "#C9A44C"; // Ochre
    return "#C25A4D"; // Brick red
  };

  const currentColor = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2D31"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Score Ring */}
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

      {/* Center Monospace Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
        <span className="text-3xl font-bold tracking-tight text-[#EDEDEF]">
          {score !== null ? `${animatedScore}%` : "—"}
        </span>
        <span className="text-[10px] text-[#8B8F97] uppercase tracking-wider font-sans mt-0.5">
          Readiness
        </span>
      </div>
    </div>
  );
}
