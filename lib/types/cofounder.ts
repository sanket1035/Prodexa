export type CoFounderRole = "advisor" | "pm" | "architect" | "judge";

export interface CoFounderMessage {
  id: string;
  sender: "user" | "cofounder";
  text: string;
  role?: CoFounderRole;
  actionableFix?: string; // Optional Copy-Fix code or advice snippet
  timestamp: string;
}

export interface CoFounderThread {
  projectId: string;
  messages: CoFounderMessage[];
}
