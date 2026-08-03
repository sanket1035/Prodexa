# 05 — Backend Schema (Data Model & Auth)

## Provider
Firebase Firestore (NoSQL, document-based) + Firebase Auth

## Collections

### `users`
| Field | Type | Notes |
|---|---|---|
| `uid` | string (doc ID) | From Firebase Auth |
| `email` | string | |
| `displayName` | string | |
| `photoURL` | string | |
| `createdAt` | timestamp | |

### `projects`
| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `userId` | string (FK → users.uid) | |
| `name` | string | Derived from URL/repo or user-entered |
| `websiteUrl` | string | |
| `githubRepoUrl` | string \| null | |
| `pitchDeckUrl` | string \| null | Firebase Storage path |
| `screenshotUrls` | array\<string\> | Firebase Storage paths |
| `createdAt` | timestamp | |
| `lastValidatedAt` | timestamp \| null | |
| `latestScore` | number \| null | Denormalized for fast list rendering on `/projects` |

### `validationRuns`
| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `projectId` | string (FK → projects.id) | |
| `userId` | string (FK → users.uid) | Redundant for security-rule simplicity |
| `status` | string | `pending` \| `running` \| `completed` \| `failed` |
| `currentModule` | string \| null | For progress polling while `running` |
| `overallScore` | number \| null | 0–100, null until completed |
| `moduleScores` | map | `{ productUnderstanding, engineering, ux, performance, accessibility, business }` — each 0–100 or null if module failed |
| `moduleStatus` | map | Per-module: `completed` \| `skipped` \| `failed`, with a `reason` string if not completed |
| `issues` | array\<Issue\> | See Issue shape below |
| `roadmap` | array\<RoadmapItem\> | Output of Launch Planner module |
| `createdAt` | timestamp | |
| `completedAt` | timestamp \| null | |

**Issue shape** (embedded, not a separate collection — read-heavy, no independent queries needed):
```
{
  id: string,
  category: "engineering" | "ux" | "performance" | "accessibility" | "business" | "product",
  severity: "critical" | "high" | "medium" | "low",
  title: string,
  description: string,
  fixText: string          // the "Copy Fix" content
}
```

**RoadmapItem shape**:
```
{
  priority: "critical" | "high" | "medium" | "low",
  title: string,
  estimatedEffort: string   // e.g. "15 min", "1–2 hrs"
}
```

## Relationships
- `projects.userId` → `users.uid` (many-to-one)
- `validationRuns.projectId` → `projects.id` (many-to-one)
- `validationRuns.userId` → `users.uid` (denormalized, many-to-one)

## Indexes
- `projects`: composite index on `(userId, createdAt desc)` for the projects list
- `validationRuns`: composite index on `(projectId, createdAt desc)` for score history queries

## Auth Provider
Firebase Auth — Google sign-in only for v1. JWT-based session, Firebase client SDK on frontend, Firebase Admin SDK in API routes for privileged writes.

## Row-Level Security (Firestore Security Rules)
```
match /projects/{projectId} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId;
}

match /validationRuns/{runId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false;  // only written by API routes via Admin SDK, never directly from client
}
```

## User Roles
Single role for v1: `user`. No admin panel, no team roles — out of scope per PRD.

## File Storage
Firebase Storage, structured as:
- `/pitchDecks/{userId}/{projectId}/{filename}.pdf`
- `/screenshots/{userId}/{projectId}/{filename}`

## Sensitive Fields
None beyond standard auth tokens (handled entirely by Firebase Auth, never stored in Firestore). No payment data in v1 — no fields to protect there.

## API Endpoints (for reference — implemented as Next.js API routes)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/projects` | GET, POST | List / create projects |
| `/api/projects/[id]` | GET, DELETE | Get / delete a single project |
| `/api/validate` | POST | Kick off a validation run for a project |
| `/api/validate/[runId]/status` | GET | Poll current module + partial results |
| `/api/validate/[runId]/export` | GET | Generate PDF/Markdown export |
