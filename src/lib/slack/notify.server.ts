/**
 * Slack alerting through the linked Slack connection (connector gateway).
 * Used by automation jobs to mirror owner email alerts into a Slack channel.
 *
 * Channel is configured in private.automation_config.slack_channel_id
 * (defaults to #general). Failures are logged and swallowed so a Slack
 * outage never breaks the email alert path or the calling job.
 */
const SLACK_GATEWAY = "https://connector-gateway.lovable.dev/slack/api";
const DEFAULT_CHANNEL = "C0BQT25BW7Q"; // #general

async function resolveChannelId(): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any;
    const { data } = await db
      .from("automation_config")
      .select("slack_channel_id")
      .eq("id", true)
      .maybeSingle();
    return data?.slack_channel_id || DEFAULT_CHANNEL;
  } catch {
    return DEFAULT_CHANNEL;
  }
}

/** Post a plain-text alert to the configured Slack channel. Never throws. */
export async function postSlackAlert(
  title: string,
  details: Record<string, string | number | undefined>,
): Promise<void> {
  try {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["SLACK_API_KEY"];
    if (!lovableKey || !connectionKey) {
      console.warn("[slack] alert skipped — Slack connection not linked");
      return;
    }

    const lines = Object.entries(details)
      .filter(([, value]) => value)
      .map(([key, value]) => `• *${key}:* ${value}`);
    const text = [`:rotating_light: *${title}*`, ...lines].join("\n");

    const response = await fetch(`${SLACK_GATEWAY}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: await resolveChannelId(),
        text,
        unfurl_links: false,
      }),
    });

    const body = await response.text();
    let parsed: { ok?: boolean; error?: string } = {};
    try {
      parsed = JSON.parse(body);
    } catch {
      /* non-JSON gateway error */
    }
    if (!response.ok || parsed.ok === false) {
      console.error(
        `[slack] chat.postMessage failed [${response.status}]: ${parsed.error ?? body.slice(0, 300)}`,
      );
    }
  } catch (error) {
    console.error("[slack] alert failed:", error);
  }
}
