export interface ArchitectureConflict {
  id: string;
  category: "tech_stack" | "database" | "architecture" | "roadmap";
  title: string;
  description: string;
  suggestedResolution: string;
  confidenceScore: number; // 0-100
  sourceLabel: "Deterministic Validation" | "Heuristic Analysis" | "AI Context Reasoning";
}

export interface ConsistencyReport {
  hasConflicts: boolean;
  conflictsCount: number;
  conflicts: ArchitectureConflict[];
  overallConsistencyScore: number; // 0-100
}

export function auditCrossModuleConsistency(
  techStack: { frontend: string; backend: string; database: string; ai: string },
  mvpFeatures: string[],
  databaseCollections: Array<{ name: string; fields: string }>,
  mermaidDiagram: string,
  ideaText: string
): ConsistencyReport {
  const conflicts: ArchitectureConflict[] = [];
  const fullText = (JSON.stringify(techStack) + " " + mvpFeatures.join(" ") + " " + ideaText).toLowerCase();

  // 1. Tech Stack Conflict Check: Firebase vs AWS/PostgreSQL mismatch
  if (techStack.database.toLowerCase().includes("firebase") && fullText.includes("postgres")) {
    conflicts.push({
      id: "conflict-db-mismatch",
      category: "tech_stack",
      title: "Tech Stack Contradiction: Firebase NoSQL vs PostgreSQL Relational DB",
      description: "Frontend specification mentions PostgreSQL queries, but primary database is configured as Firebase Firestore.",
      suggestedResolution: "Unify primary database layer to Firebase Firestore NoSQL schema or migrate database configuration to Supabase / PostgreSQL.",
      confidenceScore: 96,
      sourceLabel: "Deterministic Validation",
    });
  }

  // 2. Auth / Security Conflict: Auth mentioned in features but missing in DB collections
  const hasUserFeature = mvpFeatures.some((f) => f.toLowerCase().includes("auth") || f.toLowerCase().includes("user") || f.toLowerCase().includes("login") || f.toLowerCase().includes("profile"));
  const hasUserCollection = databaseCollections.some((c) => c.name.toLowerCase() === "users" || c.name.toLowerCase() === "profiles" || c.name.toLowerCase() === "accounts");

  if (hasUserFeature && !hasUserCollection) {
    conflicts.push({
      id: "conflict-missing-user-schema",
      category: "database",
      title: "Missing Entity: User Accounts collection not defined in Database Schema",
      description: "MVP features include User Authentication / Profiles, but 'users' collection is missing from the Firestore database schema.",
      suggestedResolution: "Add 'users' collection schema (fields: uid, email, displayName, photoURL, createdAt) to Database Section.",
      confidenceScore: 98,
      sourceLabel: "Deterministic Validation",
    });
  }

  // 3. Payment Conflict: Monetization/Payment feature without Payment Service in Architecture
  const hasPaymentFeature = fullText.includes("payment") || fullText.includes("subscription") || fullText.includes("stripe") || fullText.includes("monetization");
  const hasPaymentInGraph = mermaidDiagram.toLowerCase().includes("stripe") || mermaidDiagram.toLowerCase().includes("payment");

  if (hasPaymentFeature && !hasPaymentInGraph) {
    conflicts.push({
      id: "conflict-missing-payment-gateway",
      category: "architecture",
      title: "Architecture Gap: Payment Gateway node missing from System Architecture Diagram",
      description: "Product roadmap specifies SaaS subscription payments, but system architecture diagram lacks a Payment Gateway node (Stripe API).",
      suggestedResolution: "Add Payment Gateway node (`API --> Payment[\"Stripe API / Billing Gateway\"]`) to Mermaid System Architecture Diagram.",
      confidenceScore: 94,
      sourceLabel: "Deterministic Validation",
    });
  }

  // Calculate consistency score: 100 minus 15 per conflict
  const overallConsistencyScore = Math.max(55, 100 - conflicts.length * 15);

  return {
    hasConflicts: conflicts.length > 0,
    conflictsCount: conflicts.length,
    conflicts,
    overallConsistencyScore,
  };
}

export function autoRepairBlueprintConsistency<T extends {
  mermaidDiagram?: string;
  database?: { collections: Array<{ name: string; fields: string }>; endpoints: Array<{ method: string; path: string; desc: string }> };
  features?: { mvpFeatures: string[]; futureFeatures: string[]; monetization: string };
}>(blueprintData: T): T {
  const repaired = { ...blueprintData };
  const fullText = JSON.stringify(repaired).toLowerCase();

  // 1. Repair missing users collection if auth mentioned
  if (fullText.includes("user") || fullText.includes("auth") || fullText.includes("login")) {
    if (repaired.database?.collections) {
      const hasUserCol = repaired.database.collections.some((c) => c.name.toLowerCase() === "users" || c.name.toLowerCase() === "profiles");
      if (!hasUserCol) {
        repaired.database.collections.unshift({
          name: "users",
          fields: "uid, email, displayName, photoURL, createdAt",
        });
      }
    }
  }

  // 2. Repair missing payment gateway node in Mermaid if payments mentioned
  if (fullText.includes("stripe") || fullText.includes("payment") || fullText.includes("monetiz") || fullText.includes("subscription")) {
    if (repaired.mermaidDiagram && !repaired.mermaidDiagram.toLowerCase().includes("payment") && !repaired.mermaidDiagram.toLowerCase().includes("stripe")) {
      repaired.mermaidDiagram += `\n    API --> Payment["Stripe Payment Gateway"]`;
    }
  }

  return repaired;
}
