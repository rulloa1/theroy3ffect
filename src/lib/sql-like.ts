/**
 * Escape the wildcard characters that PostgREST's `like`/`ilike` filters treat
 * as patterns, so a value matches literally.
 *
 * Without this, a value taken from user input is a pattern, not a comparison:
 * an account registered as `%@%.%` or `r_ry@…` matches other people's rows
 * (`_` matches any single character, `%` any run of them), which is how an
 * email-scoped lookup turns into someone else's record.
 *
 * `*` is also a wildcard at the PostgREST layer and cannot be escaped there, so
 * every caller must reject it before the value reaches a filter — the email
 * validators do (`z.string().email()`, and the voice agent's looser regex).
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
