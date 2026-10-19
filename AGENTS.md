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

## Architecture
- Cricket innings transitions and scoring limits are centralized in src/lib/cricket.js so scoring, undo, and recovery use the same rules.
- Source code is plain JavaScript (.js/.jsx); tsconfig has allowJs + checkJs:false. Exceptions that MUST stay .ts because the framework hardcodes the filenames: src/server.ts, src/start.ts, src/routeTree.gen.ts (generated), vite.config.ts.
- Signed-in users' matches mirror from localStorage to the Cloud `matches` table via src/lib/cloudSync.js (listens to localscore:update/delete events); guests stay local-only, so pages keep reading localStorage.
