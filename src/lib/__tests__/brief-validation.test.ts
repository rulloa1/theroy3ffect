import { describe, it, expect } from "vitest";
import { z } from "zod";

const briefSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(120).optional().default(""),
  projectType: z.string().trim().min(1, "Pick a project type").max(60),
  goals: z.string().trim().min(10, "Tell me a bit more about your goals").max(2000),
  audience: z.string().trim().max(1000).optional().default(""),
  deliverables: z.string().trim().max(1000).optional().default(""),
  referencesLinks: z.string().trim().max(1000).optional().default(""),
  budget: z.string().trim().max(60).optional().default(""),
  timeline: z.string().trim().max(60).optional().default(""),
  extra: z.string().trim().max(2000).optional().default(""),
});

describe("Brief Intake Form Schema Validation", () => {
  it("validates a complete project brief submission", () => {
    const payload = {
      name: "Jane Doe",
      email: "jane@company.com",
      company: "Acme Corp",
      projectType: "Design + Build",
      goals: "We need a complete high-converting brand system and WebGL marketing app.",
      audience: "B2B SaaS Founders",
      deliverables: "Figma UI/UX, WebGL Shaders, Next.js build",
      budget: "$5,000 – $10,000",
      timeline: "2–4 weeks",
    };

    const result = briefSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane Doe");
      expect(result.data.email).toBe("jane@company.com");
      expect(result.data.company).toBe("Acme Corp");
    }
  });

  it("rejects brief with invalid email address", () => {
    const payload = {
      name: "Jane Doe",
      email: "invalid-email",
      projectType: "Brand identity",
      goals: "Looking for brand identity work.",
    };

    const result = briefSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects brief with goals shorter than 10 characters", () => {
    const payload = {
      name: "Jane Doe",
      email: "jane@company.com",
      projectType: "Brand identity",
      goals: "Short",
    };

    const result = briefSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
