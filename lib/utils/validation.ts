import { z } from "zod";

export const newProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100),
  websiteUrl: z
    .string()
    .url("Please enter a valid Website URL (e.g. https://your-app.com)"),
  githubRepoUrl: z
    .string()
    .url("Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)")
    .refine((url) => url.includes("github.com"), "Must be a GitHub URL")
    .optional()
    .or(z.literal("")),
  pitchDeckUrl: z.string().optional().nullable(),
  screenshotUrls: z.array(z.string()).optional(),
});

export type NewProjectInput = z.infer<typeof newProjectSchema>;
