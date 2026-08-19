import { z } from "zod";

export const PROJECT_TYPES = [
  "brand_sprint",
  "website_uiux",
  "design_and_build",
  "retainer",
  "free_audit",
  "not_sure",
] as const;

export const BUDGET_RANGES = [
  "under_2500",
  "2500_4999",
  "5000_7999",
  "8000_plus",
  "retainer",
  "not_specified",
] as const;

const email = z.string().trim().email().max(255);
const shortText = z.string().trim().max(300);
const longText = z.string().trim().max(2000);

export const captureLeadSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  company_name: shortText.optional(),
  email: email.optional(),
  phone: z.string().trim().max(40).optional(),
  website_url: shortText.optional(),
  project_type: z.enum(PROJECT_TYPES).default("not_sure"),
  primary_goal: longText.optional(),
  target_audience: shortText.optional(),
  timeline: shortText.optional(),
  budget_range: z.enum(BUDGET_RANGES).optional(),
  notes: longText.optional(),
  consent_to_follow_up: z.boolean().default(false),
});

export const createAuditRequestSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email,
  website_url: z.string().trim().min(3).max(300),
  primary_bottleneck: longText.optional(),
  consent_to_email: z.boolean().default(false),
});

export const getAvailabilitySchema = z.object({
  time_zone: z.string().trim().max(60).optional(),
  earliest_date: z.string().trim().max(30).optional(),
});

export const bookDiscoveryCallSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email,
  phone: z.string().trim().max(40).optional(),
  slot_start: z.string().trim().min(10).max(40),
  time_zone: z.string().trim().max(60).default("America/Chicago"),
  notes: longText.optional(),
});

export const APPROVED_TEMPLATES = [
  "audit_acknowledgement",
  "discovery_confirmation",
  "onboarding_questionnaire",
  "human_followup_acknowledgement",
  "missed_call_reschedule",
] as const;

export const sendApprovedFollowupSchema = z.object({
  template_id: z.enum(APPROVED_TEMPLATES),
  email,
  first_name: z.string().trim().max(80).optional(),
  variables: z.record(z.string(), z.string().max(300)).optional(),
});

export const sendOnboardingQuestionnaireSchema = z.object({
  email,
  first_name: z.string().trim().max(80).optional(),
});

export const createHumanFollowupSchema = z.object({
  full_name: z.string().trim().max(120).optional(),
  email: email.optional(),
  phone: z.string().trim().max(40).optional(),
  reason: z.string().trim().min(1).max(120),
  urgency: z.enum(["low", "normal", "high"]).default("normal"),
  summary: longText,
  preferred_method: z.string().trim().max(60).optional(),
  consent_to_email: z.boolean().default(false),
});

export const TOOL_NAMES = [
  "capture_lead",
  "create_audit_request",
  "get_discovery_availability",
  "book_discovery_call",
  "send_approved_followup",
  "send_onboarding_questionnaire",
  "create_human_followup",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];
