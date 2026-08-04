---
version: 2.1
name: Prodexa Dark Graphite
description: An enterprise founder operating system design language adapting Linear, Vercel, GitHub, and Raycast aesthetic.
colors:
  primary: "#D97B3F"        # Prodexa Warm Burnt Amber Accent
  primary-hover: "#E88A4E"
  secondary: "#EDEDEF"      # Pure High-Contrast Text
  neutral: "#0B0C0E"        # Near-Black Canvas
  surface: "#16181B"        # Flat Surface Container
  surface-elevated: "#1E2124"# Raised Element / Input Fill
  text-muted: "#8B8F97"     # Muted Secondary Copy & Metadata
  border-subtle: "#2A2D31"  # Hairline Divider / Card Edge
  border-strong: "#3A3E45"  # Emphasized Active Border
  success: "#5FA88A"        # Desaturated Sage Green
  warning: "#C9A44C"        # Desaturated Ochre Gold
  error: "#C25A4D font-mono"  # Desaturated Brick Red
typography:
  headline-display:
    fontFamily: "Inter, sans-serif"
    fontSize: "56px"
    fontWeight: 510
    lineHeight: "60px"
    letterSpacing: "-1.2px"
  headline-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: "36px"
    fontWeight: 510
    lineHeight: "42px"
    letterSpacing: "-0.8px"
  headline-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "20px"
    fontWeight: 510
    lineHeight: "26px"
    letterSpacing: "-0.2px"
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "-0.1px"
  code-mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
---

# Prodexa Dark Graphite System (Design Specification)

## Overview
Prodexa adopts a disciplined, enterprise-grade dark aesthetic inspired by **Linear (40%)**, **Vercel (30%)**, **GitHub (20%)**, and **Raycast (10%)**. The system relies on flat near-black surfaces (`#0B0C0E`), crisp hairline borders (`#2A2D31`), high-contrast Inter typography, monospace numerals (`Geist Mono`), and a single restrained warm amber accent (`#D97B3F`).

## Core Rules & Constraints
- **NO Gradients**: Avoid blue/purple AI gradients or decorative background overlays.
- **NO Glassmorphism & NO Neon Glow**: Depth is achieved solely through flat surface nesting (`#0B0C0E` background → `#16181B` surface → `#1E2124` input) and 1px hairline borders (`#2A2D31`).
- **Dense & Compact Information**: Keep padding restrained (16px to 24px) for high data density.
- **Monospace Metrics**: All numeric scores, IDs, and code blocks use monospace font rendering.

## Component Specifications
- **Primary Action**: Amber pill button (`bg-[#D97B3F] text-[#0B0C0E] font-mono hover:bg-[#E88A4E]`).
- **Secondary Action**: Flat hairline border button (`bg-[#16181B] text-[#EDEDEF] border border-[#2A2D31] hover:border-[#3A3E45]`).
- **Cards & Accordions**: Hairline bordered containers (`bg-[#16181B] border border-[#2A2D31] rounded-[6px]`).
- **Status Badges**: Desaturated pill tags (`bg-[#5FA88A]/10 text-[#5FA88A]` for success, `bg-[#C9A44C]/10 text-[#C9A44C]` for warning, `bg-[#C25A4D]/10 text-[#C25A4D]` for error).
