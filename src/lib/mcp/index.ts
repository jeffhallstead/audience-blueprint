import { auth, defineMcp } from "@lovable.dev/mcp-js";
import runBrandScout from "./tools/run-brand-scout";
import listBrandScouts from "./tools/list-brand-scouts";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "audience-blueprint",
  title: "Audience Blueprint",
  version: "0.1.0",
  instructions: "Publisher Blueprint Brand Scout: run outreach teardowns on brands and review saved teardowns. Requires an admin or analyst account.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [runBrandScout, listBrandScouts],
});
