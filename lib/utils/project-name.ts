export function getDerivedProjectName(project: {
  name?: string | null;
  websiteUrl?: string | null;
  githubRepoUrl?: string | null;
}): string {
  const name = project.name;
  if (name && name !== "Workspace Project" && name !== "Product Workspace" && name !== "Untitled Project" && name.trim() !== "") {
    return name.trim();
  }

  if (project.websiteUrl) {
    const clean = project.websiteUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/\.vercel\.app$/, "")
      .replace(/\.app$/, "")
      .replace(/\.in$/, "")
      .replace(/\.com$/, "")
      .replace(/\.io$/, "")
      .replace(/\.ai$/, "");

    const parts = clean.split(/[-_.]/).filter((x) => x && !x.match(/^[a-z0-9]{6,10}$/));
    if (parts.length > 0) {
      return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    }
  }

  if (project.githubRepoUrl) {
    const repo = project.githubRepoUrl.replace("https://github.com/", "").split("/")[1] || "";
    if (repo) {
      const parts = repo.split(/[-_.]/).filter(Boolean);
      return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    }
  }

  return "Product Workspace";
}
