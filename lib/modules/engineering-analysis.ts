import { Issue } from "@/lib/types/schema";
import { generateModuleInsight } from "@/lib/utils/openai";

export interface EngineeringModuleResult {
  status: "completed" | "skipped" | "failed";
  reason?: string;
  score: number | null;
  issues: Issue[];
  details: {
    hasReadme: boolean;
    hasLicense: boolean;
    hasPackageJson: boolean;
    recentCommit: boolean;
    openIssuesCount: number;
    starsCount: number;
  };
}

export async function runEngineeringAnalysis(
  githubUrl: string | null
): Promise<EngineeringModuleResult> {
  if (!githubUrl) {
    return {
      status: "skipped",
      reason: "No GitHub repository URL provided for engineering analysis",
      score: null,
      issues: [],
      details: {
        hasReadme: false,
        hasLicense: false,
        hasPackageJson: false,
        recentCommit: false,
        openIssuesCount: 0,
        starsCount: 0,
      },
    };
  }

  try {
    // Parse owner and repo from URL
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return {
        status: "failed",
        reason: "Invalid GitHub URL format",
        score: null,
        issues: [],
        details: {
          hasReadme: false,
          hasLicense: false,
          hasPackageJson: false,
          recentCommit: false,
          openIssuesCount: 0,
          starsCount: 0,
        },
      };
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    const headers: Record<string, string> = {
      "User-Agent": "Prodexa-PreLaunch-Engine/1.0",
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Fetch main repo metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    let repoData: any = {};
    if (repoRes.ok) {
      repoData = await repoRes.json();
    }

    // 2. Fetch contents to verify README, LICENSE, package.json
    const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
    let filenames: string[] = [];
    if (contentsRes.ok) {
      const contents = await contentsRes.json();
      if (Array.isArray(contents)) {
        filenames = contents.map((f: any) => f.name.toLowerCase());
      }
    }

    const hasReadme = filenames.some((f) => f.startsWith("readme"));
    const hasLicense = filenames.some((f) => f.startsWith("license") || f.startsWith("copying"));
    const hasPackageJson = filenames.includes("package.json") || filenames.includes("cargo.toml") || filenames.includes("pyproject.toml") || filenames.includes("go.mod");

    // 3. Fetch commits to check freshness
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
    let recentCommit = false;
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        const lastCommitDate = new Date(commits[0].commit.committer.date);
        const daysDiff = (Date.now() - lastCommitDate.getTime()) / (1000 * 3600 * 24);
        recentCommit = daysDiff <= 30;
      }
    }

    // Deterministic Score Calculation
    let score = 0;
    if (hasReadme) score += 30;
    if (hasLicense) score += 25;
    if (hasPackageJson) score += 20;
    if (recentCommit) score += 15;
    if (repoData.open_issues_count !== undefined && repoData.open_issues_count < 15) score += 10;

    // Generate issues & Copy-Fix recommendations
    const issues: Issue[] = [];

    if (!hasLicense) {
      issues.push({
        id: "eng-missing-license",
        category: "engineering",
        severity: "critical",
        title: "Repository lacks open-source LICENSE file",
        description: "Without an explicit LICENSE file, your project remains default copyrighted. Contributors, judges, and users cannot legally copy or use the software.",
        fixText: `MIT License

Copyright (c) 2026 ${owner}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...`,
      });
    }

    if (!hasReadme) {
      issues.push({
        id: "eng-missing-readme",
        category: "engineering",
        severity: "critical",
        title: "Missing README.md documentation",
        description: "No README was found in the repository root. A comprehensive README is mandatory for technical pre-launch evaluation.",
        fixText: `# ${repo}

> ${repoData.description || "A modern software application."}

## Tech Stack
- Next.js / TypeScript / Node.js

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

## Features
- Feature 1
- Feature 2
`,
      });
    } else if (hasReadme && repoData.description && repoData.description.length < 20) {
      issues.push({
        id: "eng-short-desc",
        category: "engineering",
        severity: "medium",
        title: "GitHub repository tagline is sparse",
        description: "The GitHub repository description is empty or too short for fast screening.",
        fixText: `${repoData.name} — ${repoData.description || "Fast, reliable pre-launch platform."} Built for early-stage teams & hackathons.`,
      });
    }

    if (!recentCommit) {
      issues.push({
        id: "eng-stale-commits",
        category: "engineering",
        severity: "low",
        title: "No repository commits in the past 30 days",
        description: "The primary repository branch appears inactive based on commit timestamps.",
        fixText: `git commit -m "docs: update pre-launch configuration & release notes" --allow-empty && git push origin main`,
      });
    }

    // LLM enrichment pass for qualitative reasoning
    const systemPrompt = `You are a Senior Engineering Auditor reviewing a GitHub repository for launch readiness. 
Evaluate repo signals and output structured JSON format: { "summary": string, "additionalIssues": [] }`;

    const userContent = `Repository: ${githubUrl}
Has README: ${hasReadme}
Has LICENSE: ${hasLicense}
Has Manifest: ${hasPackageJson}
Recent commit (<30d): ${recentCommit}
Stars: ${repoData.stargazers_count || 0}
Open Issues: ${repoData.open_issues_count || 0}`;

    const fallbackJSON = { summary: "Engineering analysis completed based on GitHub metadata.", additionalIssues: [] };

    await generateModuleInsight(systemPrompt, userContent, fallbackJSON);

    return {
      status: "completed",
      score,
      issues,
      details: {
        hasReadme,
        hasLicense,
        hasPackageJson,
        recentCommit,
        openIssuesCount: repoData.open_issues_count || 0,
        starsCount: repoData.stargazers_count || 0,
      },
    };
  } catch (error: any) {
    console.warn("Engineering Analysis module degraded gracefully:", error);
    return {
      status: "failed",
      reason: `GitHub API error: ${error.message || "Failed to inspect repository"}`,
      score: null,
      issues: [],
      details: {
        hasReadme: false,
        hasLicense: false,
        hasPackageJson: false,
        recentCommit: false,
        openIssuesCount: 0,
        starsCount: 0,
      },
    };
  }
}
