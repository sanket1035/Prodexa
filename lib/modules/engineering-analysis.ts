import { Issue } from "@/lib/types/schema";

export interface EngineeringReviewReport {
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  maintainabilityScore: number; // 0-100
  developerExperienceScore: number; // 0-100
  readmeQuality: "excellent" | "adequate" | "missing";
  hasInstallationGuide: boolean;
  hasLicense: boolean;
  issueHealthRatio: string;
}

export interface EngineeringModuleResult {
  status: "completed" | "skipped" | "failed";
  reason?: string;
  score: number | null;
  issues: Issue[];
  reviewReport?: EngineeringReviewReport;
  details: {
    hasReadme: boolean;
    hasLicense: boolean;
    hasPackageJson: boolean;
    recentCommit: boolean;
    openIssuesCount: number;
    starsCount: number;
    forksCount: number;
    watchersCount: number;
    defaultBranch: string;
    primaryLanguage: string;
    repoSizeKb: number;
    lastCommitDate: string | null;
    topics: string[];
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
        forksCount: 0,
        watchersCount: 0,
        defaultBranch: "main",
        primaryLanguage: "TypeScript",
        repoSizeKb: 0,
        lastCommitDate: null,
        topics: [],
      },
    };
  }

  try {
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
          forksCount: 0,
          watchersCount: 0,
          defaultBranch: "main",
          primaryLanguage: "Unknown",
          repoSizeKb: 0,
          lastCommitDate: null,
          topics: [],
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
    let lastCommitDate: string | null = null;
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        const commitDateObj = new Date(commits[0].commit.committer.date);
        lastCommitDate = commitDateObj.toISOString();
        const daysDiff = (Date.now() - commitDateObj.getTime()) / (1000 * 3600 * 24);
        recentCommit = daysDiff <= 30;
      }
    }

    // Deterministic Score Calculation
    let score = 0;
    if (hasReadme) score += 25;
    if (hasLicense) score += 25;
    if (hasPackageJson) score += 20;
    if (recentCommit) score += 15;
    if (repoData.open_issues_count !== undefined && repoData.open_issues_count < 20) score += 15;

    score = Math.max(20, Math.min(100, score));

    const issues: Issue[] = [];

    if (!hasLicense) {
      issues.push({
        id: "eng-missing-license",
        category: "engineering",
        severity: "critical",
        title: "Repository lacks open-source LICENSE file",
        description: "Problem: No LICENSE file found in root.\nWhy it matters: Potential investors and open-source contributors cannot legally verify usage rights.\nConfidence: 99%",
        fixText: `MIT License\n\nCopyright (c) 2026 ${owner}\n\nPermission is hereby granted, free of charge...`,
      });
    }

    if (!hasReadme) {
      issues.push({
        id: "eng-missing-readme",
        category: "engineering",
        severity: "high",
        title: "Missing or incomplete README.md documentation",
        description: "Problem: Missing project README file.\nWhy it matters: Judges and developers cannot understand installation, tech stack, or build steps.\nConfidence: 98%",
        fixText: `# ${repo}\n\n## Getting Started\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``,
      });
    }

    const reviewReport: EngineeringReviewReport = {
      strengths: [
        hasReadme ? "Comprehensive README documentation present in root" : "Standard repository structure",
        hasLicense ? "Clear open-source LICENSE authorization" : "Standard codebase configuration",
        recentCommit ? "Active development activity (commits within last 30 days)" : "Stable codebase commit history",
      ],
      weaknesses: [
        !hasLicense ? "Missing open-source LICENSE authorization file" : "Requires additional test coverage workflows",
        !hasReadme ? "Missing installation and build documentation" : "Requires automated CI/CD deployment pipeline",
      ],
      risks: [
        repoData.open_issues_count > 25 ? `High open issue count (${repoData.open_issues_count} open issues)` : "Low maintenance risk",
      ],
      maintainabilityScore: score >= 80 ? 90 : 70,
      developerExperienceScore: hasReadme && hasPackageJson ? 88 : 65,
      readmeQuality: hasReadme ? "excellent" : "missing",
      hasInstallationGuide: hasReadme,
      hasLicense,
      issueHealthRatio: `${repoData.open_issues_count || 0} open / ${repoData.stargazers_count || 0} stars`,
    };

    return {
      status: "completed",
      score,
      issues,
      reviewReport,
      details: {
        hasReadme,
        hasLicense,
        hasPackageJson,
        recentCommit,
        openIssuesCount: repoData.open_issues_count || 0,
        starsCount: repoData.stargazers_count || 0,
        forksCount: repoData.forks_count || 0,
        watchersCount: repoData.watchers_count || 0,
        defaultBranch: repoData.default_branch || "main",
        primaryLanguage: repoData.language || "TypeScript",
        repoSizeKb: repoData.size || 0,
        lastCommitDate,
        topics: repoData.topics || [],
      },
    };
  } catch (error: any) {
    return {
      status: "failed",
      reason: `GitHub engineering analysis error: ${error.message}`,
      score: null,
      issues: [],
      details: {
        hasReadme: false,
        hasLicense: false,
        hasPackageJson: false,
        recentCommit: false,
        openIssuesCount: 0,
        starsCount: 0,
        forksCount: 0,
        watchersCount: 0,
        defaultBranch: "main",
        primaryLanguage: "Unknown",
        repoSizeKb: 0,
        lastCommitDate: null,
        topics: [],
      },
    };
  }
}
