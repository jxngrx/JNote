# Contributing to JNote

Thanks for your interest in contributing. JNote is a local-first productivity app built with Next.js, and every improvement — bug fix, UI polish, or new feature — helps.

## Getting started locally

Follow the [Getting Started](README.md#getting-started) section in the README:

1. Clone the repo
2. Run `yarn install`
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL`
4. Run `yarn dev`

You should see the app at `http://localhost:3000`.

## Branch naming

Use short, descriptive prefixes:

| Prefix | Use for |
|--------|---------|
| `feature/` | New features or enhancements |
| `fix/` | Bug fixes |
| `chore/` | Tooling, deps, docs, refactors with no behavior change |
| `docs/` | Documentation-only changes |

Examples:

- `feature/pages-export-markdown`
- `fix/todo-column-reorder`
- `chore/upgrade-next-16`

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**

```
feat(pages): add table row context menu
fix(api): block private IPs in link-preview redirects
docs: update environment variable table in README
chore(deps): bump next to 16.2.6
```

Keep the subject line under 72 characters. Use the body for context when the *why* isn't obvious.

## Code style & linting

- **TypeScript** throughout — prefer typed props and store shapes in `lib/types.ts`
- **CSS variables** for colors (`var(--text-primary)`, etc.) — avoid hardcoded hex in components
- **Semantic HTML** — `<button>` for actions, `<nav>` for navigation
- Match existing patterns in nearby files before introducing new abstractions

### Lint

```bash
yarn lint
```

Fix any ESLint errors before opening a PR. Config lives in `eslint.config.mjs` (extends `eslint-config-next`).

### Build check

```bash
NEXT_PUBLIC_SITE_URL=https://example.com/ yarn build
```

Set a placeholder URL if you don't have a real domain yet. The build will fail without this variable.

## Pull request process

1. **Fork** the repo and create a branch from `main`
2. **Make focused changes** — one concern per PR when possible
3. **Test manually** in the browser for UI changes (there is no automated test suite in CI yet)
4. **Run** `yarn lint` and `yarn build`
5. **Open a PR** against `main`

### PR description should include

- **What** changed (1–3 sentences)
- **Why** (problem or motivation)
- **How to test** — steps a reviewer can follow
- **Screenshots / recordings** for visual changes

PRs are reviewed for correctness, consistency with the existing design system, and scope. Large PRs may be asked to split.

## Reporting issues

No formal issue templates yet — open a GitHub issue with:

### Bug reports

- Clear title describing the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser + OS version
- Screenshots or console errors if relevant

### Feature requests

- Problem you're trying to solve
- Proposed solution (optional)
- Whether you'd be willing to submit a PR

Search existing issues first to avoid duplicates.

## Architecture notes for contributors

- **Modes** (`sticky-notes`, `pages`, `area`, `todo`, `world-time`) are switched via `lib/app-store.ts` and rendered in `app/page.tsx`
- **Persistence** is client-side: Zustand stores write to `localStorage`; custom todo sounds use IndexedDB
- **API routes** (`app/api/`) are minimal — link previews and IP geolocation only. Keep them secured (rate limits, SSRF checks) when modifying

## Code of Conduct

Be respectful and constructive. We follow the spirit of the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/):

- Use welcoming and inclusive language
- Accept constructive criticism gracefully
- Focus on what's best for the community and project
- Show empathy toward other contributors

Harassment, trolling, or personal attacks are not tolerated.

---

Questions? Open an issue or start a draft PR — we're happy to help you get oriented.
