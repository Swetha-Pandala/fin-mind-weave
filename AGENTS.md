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

# Engineering rules

- Domain types live in `src/domain/types.ts`; seed data in `src/data/`; logic in `src/services/` — UI never computes business logic inline. Why: keeps agents/analytics testable and UI thin.
- All agent workflows go through `runAgents()` in `src/services/orchestrator.ts`. Why: single traced entry point for metrics and observability.
- Citations may only come from `retrieve()` results; never synthesize citation text. Why: prevents fabricated sources.
- LLM providers implement `LLMProvider` in `src/services/providers.ts`; real providers must call server functions reading keys from server env. Why: demo mode works without keys and secrets stay out of the client.
- Run history is persisted client-side via `src/services/run-store.ts`. Why: no-login demo; can be swapped for a database table behind the same API.
- Seed data is deterministic (seeded PRNG, lazy build). Why: identical SSR/client output and no global-scope randomness.
