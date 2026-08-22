import { streamText } from "ai";
import {
  AiGatewayBlockedError,
  createLovableAiGatewayProvider,
  statusFromAiError,
} from "@/lib/ai-gateway.server";
import { getIndustry, type ProspectSignal } from "./industries";

const MODEL = "google/gemini-3-flash-preview";
export const SITE_URL = "https://www.theroyeffect.com";

const SYSTEM = `You write short cold outreach emails for Rory Ulloa, a Houston-based creative director and no-code developer at The Roy Effect (theroyeffect.com). He designs and builds websites for local businesses.

Voice: direct, human, specific, confident. No hype, no emoji, no exclamation marks, no "I hope this finds you well", no agency jargon, no flattery.
Rules:
- Open by naming the one biggest, concrete problem found on their site (or that they have no site). Be factual, never insulting.
- Say plainly what it is costing them in customers, in one line.
- Reference that a free personalized report is waiting. Do not paste any URL — the button is added separately.
- Under 110 words. Short paragraphs. No greeting sign-off block, no signature, no subject line inside the body.
- Never invent prices, timelines, guarantees, client names, or facts you were not given.

Reply with ONLY a JSON object: {"subject": string, "body": string, "rationale": string}. No markdown fence, no commentary.`;

export interface OutreachDraft {
  subject: string;
  body: string;
  rationale: string;
}

const pick = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

/** Tolerant parse: models vary on key names, fences, and array wrappers. */
export function parseOutreachResponse(raw: string): OutreachDraft {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error("AI returned no JSON");
  let parsed: unknown = JSON.parse(cleaned.slice(start));
  if (Array.isArray(parsed)) parsed = parsed[0];
  if (!parsed || typeof parsed !== "object") throw new Error("AI returned no draft object");
  const obj = parsed as Record<string, unknown>;
  const subject = pick(obj, ["subject", "subjectLine", "subject_line", "title"]);
  const body = pick(obj, ["body", "emailBody", "email_body", "message", "content"]);
  if (!subject || !body) throw new Error("AI draft missing subject or body");
  return {
    subject: subject.slice(0, 140),
    body: body.slice(0, 4000),
    rationale: pick(obj, ["rationale", "reason", "why", "reasoning"]).slice(0, 500),
  };
}

export async function generateOutreachDraft(prospect: {
  business_name: string;
  industry: string;
  website: string | null;
  has_website: boolean;
  address: string | null;
  pain_score: number;
  signals: ProspectSignal[];
}): Promise<OutreachDraft & { model: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(apiKey);
  const descriptor = getIndustry(prospect.industry)?.descriptor ?? "local business";

  try {
    const result = streamText({
      model: gateway(MODEL),
      system: SYSTEM,
      prompt: [
        `Business: ${prospect.business_name} — a Houston ${descriptor}.`,
        prospect.address ? `Location: ${prospect.address}` : "",
        prospect.has_website ? `Their website: ${prospect.website}` : "They have no website listed anywhere.",
        `Problems found (most severe first):`,
        prospect.signals
          .slice()
          .sort((a, b) => b.weight - a.weight)
          .map((s) => `- ${s.label}: ${s.detail}`)
          .join("\n") || "- No specific issues recorded.",
        `Write the subject line (under 55 characters, plain and specific, no clickbait), the email body, and a one-sentence rationale for Rory explaining why this business is worth contacting now.`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    const text = await result.text;
    return { ...parseOutreachResponse(text), model: MODEL };
  } catch (error) {
    const status = statusFromAiError(error);
    if (status === 402 || status === 403) {
      throw new AiGatewayBlockedError(status, "AI drafting is blocked", error);
    }
    throw error;
  }
}
