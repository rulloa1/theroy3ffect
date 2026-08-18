import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_SHOWCASE_PROJECTS,
  mapShowcaseRow,
  type PortfolioProject,
} from "./projects.data";

export { DEFAULT_SHOWCASE_PROJECTS };
export type { PortfolioProject };

export const getPublicShowcaseProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortfolioProject[]> => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
      const key =
        process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) return DEFAULT_SHOWCASE_PROJECTS;

      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            headers.delete("Authorization");
            headers.set("apikey", key);
            return fetch(input, { ...init, headers });
          },
        },
      });

      const { data, error } = await client
        .from("showcase_projects")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) return DEFAULT_SHOWCASE_PROJECTS;
      return (data as Record<string, unknown>[]).map(mapShowcaseRow);
    } catch {
      return DEFAULT_SHOWCASE_PROJECTS;
    }
  },
);
