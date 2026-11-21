<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Microdrama Greenlight: lives at /microdrama-greenlight; public verdict recomputed server-side, stored via service role in microdrama_greenlight_checks (admin/analyst read only).

- Brand Scout logic lives in src/lib/brand-scout/engine.ts, shared by the admin server function and the MCP tool — one teardown implementation.
- MCP server (src/lib/mcp) uses Lovable Cloud OAuth; tools act as the caller under RLS and require admin/analyst role.
